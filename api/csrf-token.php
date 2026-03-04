<?php

/**
 * GET /api/csrf-token
 *
 * Returns a short-lived CSRF token that must be included
 * as an X-CSRF-Token header on all POST API calls.
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/security.php';

load_env(__DIR__ . '/../.env');

if (!check_origin()) {
    send_json_error(403, 'Forbidden.');
}

header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode(['token' => create_csrf_token()]);
