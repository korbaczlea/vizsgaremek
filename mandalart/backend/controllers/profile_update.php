<?php

require_once __DIR__ . '/../services/profile_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$result = profile_update_me($email, $data);
send_json(
    $result['status'],
    $result['code'],
    isset($result['token']) ? ['token' => $result['token']] : []
);
