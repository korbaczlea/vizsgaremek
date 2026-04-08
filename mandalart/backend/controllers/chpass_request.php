<?php

require_once __DIR__ . '/../services/password_service.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['email'])) {
    send_json('malformed_request', 400);
}

$email = base64_decode($data['email'], true);

if ($email === false || $email === '') {
    send_json('malformed_request', 400);
}

$result = process_chpass_request($email);

send_json($result['status'], $result['code'], isset($result['token']) ? ['token' => $result['token']] : []);
