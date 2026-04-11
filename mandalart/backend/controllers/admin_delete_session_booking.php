<?php

require_once __DIR__ . '/../models/workshop_session_model.php';
require_once __DIR__ . '/../services/workshop_booking_profile_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$bookingId = (int) ($data['booking_id'] ?? $data['id'] ?? 0);
if ($bookingId <= 0) {
    send_json('malformed_request', 400);
}

$sessionId = admin_delete_session_booking($bookingId);
if ($sessionId === null) {
    send_json('not_found', 404);
}

workshop_try_promote_one_from_waitlist($sessionId);

send_json('success', 200);
