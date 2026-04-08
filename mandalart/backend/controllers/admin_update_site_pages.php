<?php

require_once __DIR__ . '/../services/site_pages_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$result = site_pages_apply_admin_update($data);
if (!$result['ok']) {
    send_json('malformed_request', 400, ['message' => $result['error'] ?? 'invalid']);
}

$payload = site_pages_get_admin();
send_json('success', 200, $payload);
