<?php

require_once __DIR__ . '/../models/contact_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data['id']) || !isset($data['reply'])) {
    send_json('malformed_request', 400);
}

$contactMessageId = (int) $data['id'];
$replyMessage = (string) ($data['reply'] ?? '');

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

try {
    $ok = user_add_contact_reply($contactMessageId, $email, $replyMessage);
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

