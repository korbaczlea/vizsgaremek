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

$ok = admin_delete_workshop_session($id);
send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);

