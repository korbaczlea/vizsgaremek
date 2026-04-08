<?php

require_once __DIR__ . '/../services/password_service.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['token']) || empty($data['new_password'])) {
    send_json('malformed_request', 400);
}

$token       = $data['token'];
$newPassword = base64_decode($data['new_password'], true);

if ($newPassword === false || $newPassword === '') {
    send_json('malformed_request', 400);
}

$result = process_chpass_promise($token, $newPassword);

send_json($result['status'], $result['code']);
