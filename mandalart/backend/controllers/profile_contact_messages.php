<?php

require_once __DIR__ . '/../models/contact_model.php';

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

$markRead = true;
if (isset($_GET['mark_read'])) {
    $markRead = ((string) $_GET['mark_read'] === '1');
}

$result = profile_get_contact_conversations($email, $markRead);

send_json('success', 200, [
    'unread_count' => $result['unread_count'] ?? 0,
    'conversations' => $result['conversations'] ?? [],
]);

