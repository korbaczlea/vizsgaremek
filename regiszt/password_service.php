<?php

require_once __DIR__ . '/../models/user_model.php';
require_once __DIR__ . '/../core/jwt.php';

function process_chpass_request(string $email): array
{
    $user = get_user_by_email($email);

    if (!$user) {
        return ['status' => 'success', 'code' => 200];
    }

    $token = JWT::generate_reset_token($email);

    return ['status' => 'success', 'code' => 200, 'token' => $token];
}

function process_chpass_promise(string $token, string $new_password): array
{
    $payload = JWT::validate_reset_token($token);

    if (!$payload || empty($payload->email)) {
        return ['status' => 'invalid_credentials', 'code' => 403];
    }

    $email = $payload->email;
    $hash  = password_hash($new_password, PASSWORD_BCRYPT);
    $ok    = update_password($email, $hash);

    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}
