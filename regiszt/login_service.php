<?php

require_once __DIR__ . '/../models/user_model.php';

function process_login(string $email, string $password): int
{
    $user = get_user_by_email($email);

    if (!$user) {
        return 403;
    }

    if (!password_verify($password, $user['password_hash'])) {
        return 403;
    }

    return 200;
}
