<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$workshopId = isset($data['workshop_id']) ? (int) $data['workshop_id'] : null;
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

try {
    $payload = [
        'workshop_id' => $workshopId,
        'start_datetime' => $startDatetime,
        'end_datetime' => $endDatetime,
        'available_spots' => $availableSpots,
    ];
    $id = admin_create_workshop_session($payload);
    send_json('success', 200, ['id' => $id]);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

