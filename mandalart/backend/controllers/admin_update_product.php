<?php

require_once __DIR__ . '/../models/admin_product_model.php';

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

$name = trim((string) ($data['name'] ?? ''));
$slug = trim((string) ($data['slug'] ?? ''));
if ($name === '' || $slug === '') {
    send_json('malformed_request', 400);
}

$payload = [
    'name'           => $name,
    'slug'           => $slug,
    'description'    => (string) ($data['description'] ?? ''),
    'price'          => (float) ($data['price'] ?? 0),
    'stock_quantity' => (int) ($data['stock_quantity'] ?? 0),
    'category'       => (string) ($data['category'] ?? ''),
    'image_url'      => (string) ($data['image_url'] ?? ''),
    'is_active'      => (int) ($data['is_active'] ?? 1) ? 1 : 0,
];

try {
    $ok = admin_update_product($id, $payload);
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

