<?php

require_once __DIR__ . '/../services/workshop_booking_profile_service.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$result = process_profile_cancel_waitlist($email, $data);
send_json($result['status'], $result['code']);
