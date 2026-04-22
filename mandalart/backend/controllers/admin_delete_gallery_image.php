<?php

require_once __DIR__ . '/../models/gallery_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    send_json('malformed_request', 400);
}

try {
    if (isset($data['ids']) && is_array($data['ids'])) {
        $deleted = gallery_delete_images($data['ids']);
        send_json('success', 200, ['deleted_count' => $deleted]);
    }

    if (!isset($data['id'])) {
        send_json('malformed_request', 400);
    }

    $id = (int) $data['id'];
    if ($id <= 0) {
        send_json('malformed_request', 400);
    }

    $ok = gallery_delete_image($id);
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500, [
        'deleted_count' => $ok ? 1 : 0,
    ]);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

