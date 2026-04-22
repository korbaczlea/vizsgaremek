<?php

require_once __DIR__ . '/../services/login_service.php';
require_once __DIR__ . '/../services/sendgrid_mail.php';
require_once __DIR__ . '/../core/jwt.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['email']) || empty($data['password'])) {
    send_json('malformed_request', 400);
}

$email = base64_decode($data['email'], true);
$pass  = base64_decode($data['password'], true);

if ($email === false || $pass === false || $email === '' || $pass === '') {
    send_json('malformed_request', 400);
}

$code = process_login($email, $pass);

if ($code !== 200) {
    send_json('invalid_credentials', 403);
}

if (SENDGRID_API_KEY !== '') {
    $mail = mandalart_send_login_notification($email);
    if (!$mail['ok']) {
        error_log('mandalart login notify email: ' . json_encode($mail, JSON_UNESCAPED_UNICODE));
    }
}

$token = JWT::generate_token($email);

send_json('success', 200, ['token' => $token]);
