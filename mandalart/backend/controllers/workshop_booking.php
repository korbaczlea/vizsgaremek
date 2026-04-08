<?php

require_once __DIR__ . '/../services/workshop_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$result = process_workshop_booking($data);

send_json($result['status'], $result['code']);

