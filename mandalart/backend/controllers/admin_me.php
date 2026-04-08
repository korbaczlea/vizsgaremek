<?php

require_once __DIR__ . '/../models/user_model.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$u = get_user_by_email($email);
if (!$u) {
    send_json('wrong_token', 401);
}

send_json('success', 200, [
    'email' => $u['email'],
    'role'  => $u['role'] ?? 'user',
    'name'  => $u['name'] ?? null,
]);

