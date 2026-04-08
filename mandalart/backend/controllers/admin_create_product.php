<?php

require_once __DIR__ . '/../models/admin_product_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    send_json('malformed_request', 400);
}

function slugify(string $s): string
{
    $trimmed = trim($s);
    $lower = function_exists('mb_strtolower')
        ? mb_strtolower($trimmed, 'UTF-8')
        : strtolower($trimmed);
    if (!is_string($lower)) {
        $lower = $trimmed;
    }

    $out = preg_replace('/[^a-z0-9]+/u', '-', $lower);
    if (!is_string($out)) {
        $out = preg_replace('/[^a-z0-9]+/', '-', $lower);
    }
    if (!is_string($out)) {
        $out = '';
    }

    $out = trim($out, '-');
    return $out !== '' ? $out : 'product';
}

$name = trim((string) ($data['name'] ?? ''));
if ($name === '') {
    send_json('malformed_request', 400);
}

$nameLen = function_exists('mb_strlen') ? mb_strlen($name, 'UTF-8') : strlen($name);
if ($nameLen > 150) {
    send_json('malformed_request', 400, ['message' => 'Product name is too long (max 150 characters).']);
}

try {
    $category = (string) ($data['category'] ?? '');
    if (function_exists('mb_substr')) {
        $category = mb_substr($category, 0, 100, 'UTF-8');
    } else {
        $category = substr($category, 0, 100);
    }

    $payload = [
        'name'           => $name,
        'slug'           => trim((string) ($data['slug'] ?? '')) ?: slugify($name),
        'description'    => (string) ($data['description'] ?? ''),
        'price'          => (float) ($data['price'] ?? 0),
        'stock_quantity' => (int) ($data['stock_quantity'] ?? 0),
        'category'       => $category,
        'image_url'      => (string) ($data['image_url'] ?? ''),
        'is_active'      => (int) ($data['is_active'] ?? 1) ? 1 : 0,
    ];

    $id = admin_create_product($payload);
    send_json('success', 200, ['id' => $id]);
} catch (Throwable $e) {
    $msg = $e->getMessage();
    if ($e instanceof \PDOException) {
        $code = isset($e->errorInfo[1]) ? (int) $e->errorInfo[1] : 0;
        if ($code === 1062) {
            send_json('duplicate_key', 409, ['message' => $msg]);
        }
    }
    send_json('server_error', 500, ['message' => $msg]);
}

