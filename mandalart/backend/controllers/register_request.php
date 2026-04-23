<?php

require_once __DIR__ . '/../services/register_service.php';
require_once __DIR__ . '/../services/rate_limit_service.php';
require_once __DIR__ . '/../services/sendgrid_mail.php';
require_once __DIR__ . '/../core/jwt.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (
    !is_array($data)
    || empty($data['name'])
    || empty($data['email'])
    || empty($data['password'])
    || empty($data['phone'])
) {
    send_json('malformed_request', 400);
}

$name     = base64_decode($data['name'], true);
$email    = base64_decode($data['email'], true);
$password = base64_decode($data['password'], true);
$phone    = base64_decode($data['phone'], true);

if (
    $name === false || $email === false || $password === false || $phone === false
    || $name === '' || $email === '' || $password === '' || $phone === ''
) {
    send_json('malformed_request', 400);
}

assert_register_allowed_or_exit();

$result = process_register($name, $email, $password, $phone);

if ($result['status'] !== 'success') {
    send_json($result['status'], $result['code']);
}

if (SENDGRID_API_KEY !== '') {
    $mail = mandalart_send_registration_welcome($email, $name);
    if (!$mail['ok']) {
        error_log('mandalart welcome email: ' . json_encode($mail, JSON_UNESCAPED_UNICODE));
    }
}

$token = JWT::generate_token($email);
send_json('success', 200, ['token' => $token]);
