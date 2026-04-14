<?php

require_once __DIR__ . '/../models/contact_model.php';
require_once __DIR__ . '/../services/mail_service.php';

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

$adminEmail = $currentUserEmail ?? null;
if (!$adminEmail) {
    send_json('missing_auth_header', 401);
}

try {
    $ok = admin_add_contact_reply($contactMessageId, $adminEmail, $replyMessage);
    if ($ok) {
        $row = contact_get_message_row($contactMessageId);
        $to = $row ? trim((string) ($row['email'] ?? '')) : '';
        if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
            mandalart_mail_send_contact_reply($to, $replyMessage);
        }
    }
    send_json($ok ? 'success' : 'server_error', $ok ? 200 : 500);
} catch (Throwable $e) {
    send_json('server_error', 500);
}

