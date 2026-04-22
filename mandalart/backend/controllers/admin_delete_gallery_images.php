<?php

require_once __DIR__ . '/../models/gallery_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data) || empty($data['ids']) || !is_array($data['ids'])) {
    send_json('malformed_request', 400);
}

try {
    $ok = gallery_delete_images($data['ids']);
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);
} catch (Throwable $e) {
    send_json('server_error', 500);
}
