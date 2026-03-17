<?php

require_once __DIR__ . '/../models/user_model.php';

function process_register(string $name, string $email, string $password): array
{
    $existing = get_user_by_email($email);
    if ($existing) {
        return ['status' => 'email_already_exists', 'code' => 409];
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ok   = create_user($name, $email, $hash);

    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}
