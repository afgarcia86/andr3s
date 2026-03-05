<?php

/**
 * POST /api/chat
 *
 * Receives conversation messages from the frontend, forwards them to
 * the OpenAI v1/responses endpoint with file_search, and streams the
 * response back as SSE in the format the frontend expects:
 *
 *   data: {"content":"chunk"}\n\n
 *   data: {"done":true,"sources":[]}\n\n
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/security.php';

load_env(__DIR__ . '/../.env');

// ── Guards ──────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_error(405, 'Method not allowed.');
}

if (!check_origin()) {
    send_json_error(403, 'Forbidden.');
}

check_csrf();

// ── Session ─────────────────────────────────────────────────────────

$session = get_or_create_session();
$ip_hash = hash_ip(get_client_ip());
$c       = config();

// ── Parse body ──────────────────────────────────────────────────────

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !is_array($body['messages'] ?? null) || empty($body['messages'])) {
    send_json_error(400, 'Messages array is required.');
}

$messages     = array_slice($body['messages'], -$c['input']['max_messages']);
$last_message = end($messages);

if (($last_message['role'] ?? '') !== 'user') {
    send_json_error(400, 'Last message must be from the user.');
}

if (strlen($last_message['content'] ?? '') > $c['input']['max_chars']) {
    send_json_error(400, "Message too long. Keep it under {$c['input']['max_chars']} characters.");
}

// ── Rate limit ──────────────────────────────────────────────────────

$rate = check_rate_limit($ip_hash, $session['id']);
if (!$rate['allowed']) {
    log_request([
        'timestamp'         => gmdate('c'),
        'ipHash'            => $ip_hash,
        'sessionId'         => $session['id'],
        'status'            => 429,
        'blocked'           => true,
        'blockReason'       => 'rate_limit',
        'userMessageLength' => strlen($last_message['content']),
    ]);
    if (!empty($rate['retry_after'])) {
        header('Retry-After: ' . $rate['retry_after']);
    }
    send_json_error(429, $rate['reason']);
}

// ── Abuse detection ─────────────────────────────────────────────────

$abuse = check_abuse($last_message['content']);
if ($abuse['blocked']) {
    log_request([
        'timestamp'         => gmdate('c'),
        'ipHash'            => $ip_hash,
        'sessionId'         => $session['id'],
        'status'            => 403,
        'blocked'           => true,
        'blockReason'       => 'abuse',
        'userMessageLength' => strlen($last_message['content']),
    ]);
    send_json_error(403, $abuse['reason']);
}

// ── Build OpenAI Responses API request ──────────────────────────────

$input = [];
foreach ($messages as $m) {
    $input[] = [
        'role'    => $m['role'] === 'user' ? 'user' : 'assistant',
        'content' => $m['content'],
    ];
}

$request_body = [
    'model'        => $c['openai']['model'],
    'instructions' => $c['openai']['instructions'],
    'input'        => $input,
    'stream'       => true,
];

// Attach file_search tool if a vector store is configured
if (!empty($c['openai']['vector_store_id'])) {
    $request_body['tools'] = [
        [
            'type'             => 'file_search',
            'vector_store_ids' => [$c['openai']['vector_store_id']],
        ],
    ];
}

// ── SSE headers ─────────────────────────────────────────────────────

if ($session['new']) {
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    setcookie('session_id', $session['id'], [
        'expires'  => time() + 86400,
        'path'     => '/',
        'httponly'  => true,
        'samesite' => 'Strict',
        'secure'   => $secure,
    ]);
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache, no-transform');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

// Kill every layer of output buffering
while (ob_get_level()) ob_end_flush();
@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering', '0');
@ini_set('implicit_flush', '1');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
set_time_limit(120);

// ── Stream from OpenAI ──────────────────────────────────────────────

$response_text = '';
$sse_buffer    = '';

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $c['openai']['api_key'],
    ],
    CURLOPT_POSTFIELDS     => json_encode($request_body),
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_TIMEOUT        => 120,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_WRITEFUNCTION  => function ($ch, $data) use (&$response_text, &$sse_buffer) {
        $sse_buffer .= $data;

        // Process complete SSE lines
        while (($pos = strpos($sse_buffer, "\n")) !== false) {
            $line       = substr($sse_buffer, 0, $pos);
            $sse_buffer = substr($sse_buffer, $pos + 1);
            $line       = trim($line);

            if ($line === '' || !str_starts_with($line, 'data: ')) continue;

            $json_str = substr($line, 6);
            if ($json_str === '[DONE]') continue;

            $event = json_decode($json_str, true);
            if (!$event) continue;

            $type = $event['type'] ?? '';

            // Text delta — forward to client
            if ($type === 'response.output_text.delta') {
                $delta = $event['delta'] ?? '';
                if ($delta !== '') {
                    $response_text .= $delta;
                    echo 'data: ' . json_encode(['content' => $delta]) . "\n\n";
                    flush();
                }
            }
        }

        return strlen($data);
    },
]);

$ok        = curl_exec($ch);
$curl_err  = curl_errno($ch);
$http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (!$ok || $curl_err || $http_code >= 400) {
    echo 'data: ' . json_encode(['error' => 'Something went wrong. Please try again.']) . "\n\n";
    flush();

    log_request([
        'timestamp'         => gmdate('c'),
        'ipHash'            => $ip_hash,
        'sessionId'         => $session['id'],
        'status'            => 500,
        'userMessageLength' => strlen($last_message['content']),
    ]);
    exit;
}

// ── Done ────────────────────────────────────────────────────────────

echo 'data: ' . json_encode(['done' => true, 'sources' => []]) . "\n\n";
flush();

log_request([
    'timestamp'         => gmdate('c'),
    'ipHash'            => $ip_hash,
    'sessionId'         => $session['id'],
    'status'            => 200,
    'userMessageLength' => strlen($last_message['content']),
]);
