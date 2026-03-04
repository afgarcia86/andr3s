<?php

/**
 * Minimal HS256 JWT implementation for LiveKit tokens.
 * Zero dependencies.
 */

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function create_jwt(array $payload, string $secret): string
{
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body    = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$body", $secret, true));

    return "$header.$body.$sig";
}

function create_livekit_token(
    string $api_key,
    string $api_secret,
    array  $grants,
    string $identity,
    int    $ttl = 300
): string {
    $now = time();

    return create_jwt([
        'iss'   => $api_key,
        'sub'   => $identity,
        'iat'   => $now,
        'nbf'   => $now,
        'exp'   => $now + $ttl,
        'jti'   => $identity . '-' . bin2hex(random_bytes(8)),
        'video' => $grants,
    ], $api_secret);
}
