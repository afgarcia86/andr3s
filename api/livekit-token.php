<?php

/**
 * POST /api/livekit/token
 *
 * Generates a short-lived JWT for joining a LiveKit voice call room.
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/jwt.php';

load_env(__DIR__ . '/../.env');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_error(405, 'Method not allowed.');
}

if (!check_origin()) {
    send_json_error(403, 'Forbidden.');
}

check_csrf();

$c = config();

if (empty($c['livekit']['api_key']) || empty($c['livekit']['api_secret']) || empty($c['livekit']['url'])) {
    send_json_error(503, 'Voice call is not configured.');
}

$room_name = 'voice-' . time() . mt_rand(100, 999);
$identity  = 'visitor-' . time() . mt_rand(100, 999);

$token = create_livekit_token(
    $c['livekit']['api_key'],
    $c['livekit']['api_secret'],
    [
        'roomJoin'       => true,
        'room'           => $room_name,
        'canPublish'     => true,
        'canSubscribe'   => true,
        'canPublishData' => false,
    ],
    $identity,
    300 // 5 minutes
);

header('Content-Type: application/json');
echo json_encode([
    'token'    => $token,
    'url'      => $c['livekit']['url'],
    'roomName' => $room_name,
]);
