<?php

/**
 * Router for PHP's built-in development server.
 * Replicates the .htaccess URL rewrites that Apache handles in production.
 *
 * Usage: php -S localhost:8080 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// API route rewrites (mirrors api/.htaccess)
$routes = [
    '/api/chat'          => __DIR__ . '/api/chat.php',
    '/api/livekit/token' => __DIR__ . '/api/livekit-token.php',
    '/api/csrf-token'    => __DIR__ . '/api/csrf-token.php',
];

if (isset($routes[$uri])) {
    require $routes[$uri];
    return true;
}

// Let the built-in server handle static files
return false;
