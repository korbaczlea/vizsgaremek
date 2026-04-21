<?php

require_once __DIR__ . '/../models/workshop_session_model.php';
require_once __DIR__ . '/../services/sendgrid_mail.php';

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

$row = get_session_booking_for_notification($bookingId);
if (!$row) {
    send_json('not_found', 404);
}

$previousStatus = (string) ($row['booking_status'] ?? '');
$statusChanged = ($previousStatus !== $status);

$ok = $statusChanged ? admin_update_session_booking_status($bookingId, $status) : true;

if (!$ok) {
    send_json('not_found', 404);
}

if ($statusChanged && SENDGRID_API_KEY !== '') {
    $to = trim((string) ($row['user_email'] ?? ''));
    if ($to !== '' && strcasecmp($to, 'guest@example.com') !== 0) {
        $sent = mandalart_send_workshop_booking_status_email(
            $to,
            (string) ($row['user_name'] ?? ''),
            (string) ($row['workshop_title'] ?? ''),
            (string) ($row['start_datetime'] ?? ''),
            $status
        );
        if (!$sent['ok']) {
            error_log('mandalart workshop status email: ' . json_encode($sent, JSON_UNESCAPED_UNICODE));
        }
    }
}

send_json('success', 200);
