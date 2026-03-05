<?php

/**
 * Origin verification, rate limiting (SQLite), abuse detection, logging.
 */

// ---------------------------------------------------------------------------
// Origin check
// ---------------------------------------------------------------------------

function check_origin(): bool
{
    $c = config();
    $allowed = $c['allowed_origins'];

    // Skip origin check if no origins configured
    if (empty($allowed)) return true;

    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';

    // No Origin and no Referer = same-origin request (browsers omit
    // the Origin header on same-origin GETs) or server-side proxy.
    // Origin checking rejects *wrong* origins, not *absent* ones.
    if ($origin === '' && $referer === '') return true;

    if ($origin && in_array($origin, $allowed, true)) return true;

    if ($referer) {
        $parsed = parse_url($referer);
        $ref_origin = ($parsed['scheme'] ?? '') . '://' . ($parsed['host'] ?? '');
        if (!empty($parsed['port'])) {
            $ref_origin .= ':' . $parsed['port'];
        }
        if (in_array($ref_origin, $allowed, true)) return true;
    }

    return false;
}

// ---------------------------------------------------------------------------
// IP helpers
// ---------------------------------------------------------------------------

function get_client_ip(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function hash_ip(string $ip): string
{
    return substr(hash('sha256', $ip), 0, 12);
}

// ---------------------------------------------------------------------------
// Rate limiting (SQLite)
// ---------------------------------------------------------------------------

function get_rate_db(): SQLite3
{
    static $db = null;
    if ($db !== null) return $db;

    $dir = __DIR__ . '/../../data';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);

    $db = new SQLite3($dir . '/rate_limits.db');
    $db->busyTimeout(3000);
    $db->exec('PRAGMA journal_mode=WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS rate_limits (
        key  TEXT NOT NULL,
        type TEXT NOT NULL,
        count    INTEGER NOT NULL DEFAULT 1,
        reset_at INTEGER NOT NULL,
        PRIMARY KEY (key, type)
    )');

    return $db;
}

function check_rate_limit(string $ip_hash, string $session_id): array
{
    $c   = config();
    $db  = get_rate_db();
    $now = time();

    // Opportunistic cleanup (~10 % of requests)
    if (mt_rand(1, 10) === 1) {
        $db->exec("DELETE FROM rate_limits WHERE reset_at < $now");
    }

    // --- Per-minute (by IP) ---
    $stmt = $db->prepare(
        'SELECT count, reset_at FROM rate_limits WHERE key = :k AND type = :t'
    );
    $stmt->bindValue(':k', $ip_hash);
    $stmt->bindValue(':t', 'minute');
    $row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if ($row && $row['reset_at'] > $now) {
        if ($row['count'] >= $c['rate_limit']['per_minute']) {
            return [
                'allowed'     => false,
                'retry_after' => $row['reset_at'] - $now,
                'reason'      => 'Too many requests. Please wait a moment.',
            ];
        }
        $u = $db->prepare(
            'UPDATE rate_limits SET count = count + 1 WHERE key = :k AND type = :t'
        );
        $u->bindValue(':k', $ip_hash);
        $u->bindValue(':t', 'minute');
        $u->execute();
    } else {
        $u = $db->prepare(
            'INSERT OR REPLACE INTO rate_limits (key,type,count,reset_at) VALUES (:k,:t,1,:r)'
        );
        $u->bindValue(':k', $ip_hash);
        $u->bindValue(':t', 'minute');
        $u->bindValue(':r', $now + 60, SQLITE3_INTEGER);
        $u->execute();
    }

    // --- Daily (by session) ---
    $stmt = $db->prepare(
        'SELECT count, reset_at FROM rate_limits WHERE key = :k AND type = :t'
    );
    $stmt->bindValue(':k', $session_id);
    $stmt->bindValue(':t', 'daily');
    $row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if ($row && $row['reset_at'] > $now) {
        if ($row['count'] >= $c['rate_limit']['daily_per_session']) {
            return [
                'allowed' => false,
                'reason'  => "You've reached the daily limit. Come back tomorrow or reach out directly!",
            ];
        }
        $u = $db->prepare(
            'UPDATE rate_limits SET count = count + 1 WHERE key = :k AND type = :t'
        );
        $u->bindValue(':k', $session_id);
        $u->bindValue(':t', 'daily');
        $u->execute();
    } else {
        $u = $db->prepare(
            'INSERT OR REPLACE INTO rate_limits (key,type,count,reset_at) VALUES (:k,:t,1,:r)'
        );
        $u->bindValue(':k', $session_id);
        $u->bindValue(':t', 'daily');
        $u->bindValue(':r', $now + 86400, SQLITE3_INTEGER);
        $u->execute();
    }

    return ['allowed' => true];
}

// ---------------------------------------------------------------------------
// Abuse / prompt-injection detection
// ---------------------------------------------------------------------------

function check_abuse(string $message): array
{
    $patterns = [
        '/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i',
        '/show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i',
        '/print\s+(your\s+)?(env|environment)\s*(vars|variables)?/i',
        '/reveal\s+(your\s+)?(instructions|prompt|secrets|api\s*key)/i',
        '/what\s+(are|is)\s+your\s+(system\s+)?(instructions|prompt)/i',
        '/act\s+as\s+if\s+you\s+(are|were)/i',
        '/pretend\s+(you\s+)?(are|were)\s+(?!andres)/i',
        '/you\s+are\s+now\s+(?!andres)/i',
        '/jailbreak/i',
        '/DAN\s+mode/i',
        '/bypass\s+(your\s+)?(restrictions|filters|rules)/i',
        '/process\.env/i',
        '/\bAPI[_\s]?KEY\b/i',
        '/\bSECRET\b.*\bKEY\b/i',
    ];

    foreach ($patterns as $p) {
        if (preg_match($p, $message)) {
            return [
                'blocked' => true,
                'reason'  => "I'm here to answer questions about Andres' experience and skills. Let me help with that instead!",
            ];
        }
    }

    return ['blocked' => false];
}

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------

function log_request(array $entry): void
{
    $dir = __DIR__ . '/../../data';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);

    @file_put_contents(
        $dir . '/requests.jsonl',
        json_encode($entry) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

// ---------------------------------------------------------------------------
// Session helper
// ---------------------------------------------------------------------------

function get_or_create_session(): array
{
    if (!empty($_COOKIE['session_id']) && preg_match('/^[a-f0-9\-]{36}$/', $_COOKIE['session_id'])) {
        return ['id' => $_COOKIE['session_id'], 'new' => false];
    }

    // Generate UUID v4
    $d = random_bytes(16);
    $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
    $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
    $id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));

    return ['id' => $id, 'new' => true];
}

// ---------------------------------------------------------------------------
// CSRF tokens (HMAC-signed, time-limited)
// ---------------------------------------------------------------------------

function csrf_secret(): string
{
    $c = config();
    return hash('sha256', $c['openai']['api_key'] . '::csrf-salt');
}

function create_csrf_token(): string
{
    $ts  = time();
    $sig = hash_hmac('sha256', (string) $ts, csrf_secret());
    return $ts . '.' . $sig;
}

function verify_csrf_token(string $token, int $max_age = 1800): bool
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return false;

    [$ts, $sig] = $parts;
    if (!ctype_digit($ts)) return false;
    if (time() - (int) $ts > $max_age) return false;

    $expected = hash_hmac('sha256', $ts, csrf_secret());
    return hash_equals($expected, $sig);
}

function check_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$token || !verify_csrf_token($token)) {
        send_json_error(403, 'Invalid or expired token.');
    }
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function send_json_error(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => $message]);
    exit;
}
