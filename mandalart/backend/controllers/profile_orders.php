<?php

require_once __DIR__ . '/../services/profile_service.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$result = profile_get_orders($email);
send_json($result['status'], $result['code'], ['orders' => $result['orders'] ?? []]);
