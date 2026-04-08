<?php

require_once __DIR__ . '/../models/workshop_booking_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['id']) || empty($data['booking_date']) || empty($data['booking_time'])) {
    send_json('malformed_request', 400);
}

$id = (int) $data['id'];
$date = trim((string) $data['booking_date']);
$time = trim((string) $data['booking_time']);

if ($id <= 0) {
    send_json('malformed_request', 400);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) {
    send_json('malformed_request', 400);
}

$ok = admin_update_workshop_booking_slot($id, $date, $time, 5);

if (!$ok) {
    send_json('slot_already_booked', 409);
}

send_json('success', 200);

