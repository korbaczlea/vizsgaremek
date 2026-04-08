<?php

require_once __DIR__ . '/../services/contact_service.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$email = $currentUserEmail ?? null;
if (!$email) {
    send_json('missing_auth_header', 401);
}

// Never trust client-provided email for authenticated requests.
$data['email'] = $email;

$result = process_contact_message($data);
send_json($result['status'], $result['code']);
