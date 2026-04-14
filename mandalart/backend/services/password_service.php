<?php

require_once __DIR__ . '/../models/user_model.php';
require_once __DIR__ . '/../core/jwt.php';
require_once __DIR__ . '/mail_service.php';

function is_strong_password(string $password): bool
{
    if (strlen($password) < 8) {
        return false;
    }
    if (!preg_match('/[a-z]/', $password)) {
        return false;
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return false;
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        return false;
    }
    return true;
}

function process_chpass_request(string $email): array
{
    $user = get_user_by_email($email);

    if (!$user) {
        return ['status' => 'email_not_registered', 'code' => 404];
    }

    $token = JWT::generate_reset_token($email);
    mandalart_mail_send_password_reset($email, $token);
    // In production, send $token by email only — do not expose in API responses.
    $out = ['status' => 'success', 'code' => 200];
    if (MANDALART_DEV_EXPOSE_RESET_TOKEN) {
        $out['token'] = $token;
    }
    return $out;
}

function process_chpass_promise(string $token, string $new_password): array
{
    if (!is_strong_password($new_password)) {
        return ['status' => 'weak_password', 'code' => 400];
    }

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
