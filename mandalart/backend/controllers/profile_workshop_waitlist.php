<?php

require_once __DIR__ . '/../services/workshop_booking_profile_service.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$result = profile_get_workshop_waitlist($email);
send_json($result['status'], $result['code'], ['waitlist' => $result['waitlist'] ?? []]);
