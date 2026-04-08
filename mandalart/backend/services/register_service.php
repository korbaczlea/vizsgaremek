<?php

require_once __DIR__ . '/../models/user_model.php';

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

function process_register(string $name, string $email, string $password, ?string $phone = null): array
{
    if (!is_strong_password($password)) {
        return ['status' => 'weak_password', 'code' => 400];
    }

    $existing = get_user_by_email($email);
    if ($existing) {
        return ['status' => 'email_already_exists', 'code' => 409];
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ok   = create_user($name, $email, $hash, $phone);

    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}
