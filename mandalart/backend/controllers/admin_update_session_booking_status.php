<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$bookingId = (int) ($data['booking_id'] ?? $data['id'] ?? 0);
$status    = trim((string) ($data['status'] ?? ''));

if ($bookingId <= 0 || $status === '') {
    send_json('malformed_request', 400);
}

$ok = admin_update_session_booking_status($bookingId, $status);

if (!$ok) {
    send_json('not_found', 404);
}

send_json('success', 200);
