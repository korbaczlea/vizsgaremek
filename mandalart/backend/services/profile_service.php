<?php

require_once __DIR__ . '/../models/profile_model.php';
require_once __DIR__ . '/../models/user_model.php';
require_once __DIR__ . '/register_service.php';
require_once __DIR__ . '/../core/jwt.php';

function profile_get_me(string $email): array
{
    $u = profile_get_user($email);
    if (!$u) {
        return ['status' => 'wrong_token', 'code' => 401];
    }
    return ['status' => 'success', 'code' => 200, 'user' => $u];
}

function profile_get_orders(string $email): array
{
    return ['status' => 'success', 'code' => 200, 'orders' => profile_list_orders($email)];
}

function profile_get_bookings(string $email): array
{
    return ['status' => 'success', 'code' => 200, 'bookings' => profile_list_bookings($email)];
}

function profile_update_me(string $email, array $data): array
{
    $name = trim((string)($data['name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));
    $newEmail = trim((string)($data['email'] ?? ''));
    if ($name === '' || $newEmail === '' || !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $existing = get_user_by_email($newEmail);
    if ($existing && strtolower((string)$existing['email']) !== strtolower($email)) {
        return ['status' => 'email_already_exists', 'code' => 409];
    }

    $ok = profile_update_user($email, $newEmail, $name, $phone);
    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    $token = JWT::generate_token($newEmail);
    return ['status' => 'success', 'code' => 200, 'token' => $token];
}

function profile_change_password(string $email, array $data): array
{
    $current = (string)($data['current_password'] ?? '');
    $newPass = (string)($data['new_password'] ?? '');

    if ($current === '' || $newPass === '') {
        return ['status' => 'malformed_request', 'code' => 400];
    }
    if (!is_strong_password($newPass)) {
        return ['status' => 'weak_password', 'code' => 400];
    }

    $u = get_user_by_email($email);
    if (!$u || empty($u['password_hash']) || !password_verify($current, $u['password_hash'])) {
        return ['status' => 'invalid_credentials', 'code' => 403];
    }

    $hash = password_hash($newPass, PASSWORD_BCRYPT);
    $ok = update_password($email, $hash);
    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}
