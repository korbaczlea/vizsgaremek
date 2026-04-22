<?php

require_once __DIR__ . '/../models/order_model.php';
require_once __DIR__ . '/../services/sendgrid_mail.php';

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

$row = get_order_for_notification($id);
if (!$row) {
    send_json('not_found', 404);
}

$previous = (string) ($row['order_status'] ?? '');
$statusChanged = ($previous !== $status);

if ($statusChanged) {
    $ok = admin_update_order_status($id, $status);
} else {
    $ok = true;
}

if (!$ok) {
    send_json('server_error', 500);
}

if ($statusChanged && SENDGRID_API_KEY !== '') {
    $to = trim((string) ($row['email'] ?? ''));
    if ($to !== '' && strcasecmp($to, 'guest@example.com') !== 0) {
        $name   = (string) ($row['full_name'] ?? '');
        $number = (string) ($row['order_number'] ?? '');
        $sent   = mandalart_send_order_status_update_email($to, $name, $number, $status);
        if (!$sent['ok']) {
            error_log('mandalart order status email: ' . json_encode($sent, JSON_UNESCAPED_UNICODE));
        }
    }
}

send_json('success', 200);

