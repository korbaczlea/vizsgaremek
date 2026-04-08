<?php

require_once __DIR__ . '/../models/gallery_model.php';

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

$title = array_key_exists('title', $data) ? (string) $data['title'] : null;
$sort  = array_key_exists('sort_order', $data) ? (int) $data['sort_order'] : null;
$active = array_key_exists('active', $data) ? (int) $data['active'] : null;

try {
    $ok = gallery_update_image($id, $title, $sort, $active);
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

