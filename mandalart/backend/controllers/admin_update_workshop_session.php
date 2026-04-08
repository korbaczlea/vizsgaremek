<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data) || empty($data['id'])) {
    send_json('malformed_request', 400);
}

$id = (int) $data['id'];
if ($id <= 0) {
    send_json('malformed_request', 400);
}

$bookingDate = trim((string) ($data['booking_date'] ?? ''));
$startTime = trim((string) ($data['start_time'] ?? ''));
$endTime = trim((string) ($data['end_time'] ?? ''));
$availableSpots = (int) ($data['available_spots'] ?? 0);

if (
    $bookingDate === '' || $startTime === '' || $endTime === '' ||
    $availableSpots <= 0
) {
    send_json('malformed_request', 400);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $bookingDate) || !preg_match('/^\d{2}:\d{2}$/', $startTime) || !preg_match('/^\d{2}:\d{2}$/', $endTime)) {
    send_json('malformed_request', 400);
}

$startDatetime = $bookingDate . ' ' . $startTime . ':00';
$endDatetime = $bookingDate . ' ' . $endTime . ':00';

$ok = admin_update_workshop_session($id, [
    'start_datetime' => $startDatetime,
    'end_datetime' => $endDatetime,
    'available_spots' => $availableSpots,
]);

send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);

