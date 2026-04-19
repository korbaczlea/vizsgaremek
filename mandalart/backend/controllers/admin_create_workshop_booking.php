<?php

require_once __DIR__ . '/../models/workshop_booking_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$date      = trim((string) ($data['booking_date'] ?? ''));
$time      = trim((string) ($data['booking_time'] ?? ''));
$firstName = trim((string) ($data['first_name'] ?? ''));
$lastName  = trim((string) ($data['last_name'] ?? ''));
$email     = trim((string) ($data['email'] ?? ''));
$phone     = trim((string) ($data['phone'] ?? ''));

if (
    $date === '' || $time === '' ||
    $firstName === '' || $lastName === '' ||
    $email === '' || $phone === ''
) {
    send_json('malformed_request', 400);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) {
    send_json('malformed_request', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json('malformed_request', 400);
}

try {
    $ok = admin_create_workshop_booking($date, $time, $firstName, $lastName, $email, $phone);
    if (!$ok) {
        send_json('slot_already_booked', 409);
    }
    send_json('success', 200);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

