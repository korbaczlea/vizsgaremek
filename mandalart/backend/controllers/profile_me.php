<?php

require_once __DIR__ . '/../services/profile_service.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$result = profile_get_me($email);
send_json($result['status'], $result['code'], isset($result['user']) ? ['user' => $result['user']] : []);
