<?php

require_once __DIR__ . '/../models/order_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['id']) || empty($data['order_status'])) {
    send_json('malformed_request', 400);
}

$id = (int) $data['id'];
$status = (string) $data['order_status'];

$allowed = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
if ($id <= 0 || !in_array($status, $allowed, true)) {
    send_json('malformed_request', 400);
}

$ok = admin_update_order_status($id, $status);

send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);

