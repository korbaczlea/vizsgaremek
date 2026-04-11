<?php

require_once __DIR__ . '/../services/contact_service.php';
require_once __DIR__ . '/../services/rate_limit_service.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

assert_contact_guest_allowed_or_exit();

$result = process_contact_message($data);
send_json($result['status'], $result['code']);
