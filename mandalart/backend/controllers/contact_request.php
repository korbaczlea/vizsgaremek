<?php

require_once __DIR__ . '/../services/contact_service.php';
require_once __DIR__ . '/../models/user_model.php';

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

$userRow = get_user_by_email($email);
$hasName = trim((string) ($data['name'] ?? '')) !== ''
    || trim((string) ($data['first_name'] ?? '')) !== '';
if ($userRow && !$hasName && trim((string) ($userRow['name'] ?? '')) !== '') {
    $data['name'] = (string) $userRow['name'];
}

$stillNoName = trim((string) ($data['name'] ?? '')) === ''
    && trim((string) ($data['first_name'] ?? '')) === '';
if ($stillNoName) {
    $data['name'] = 'Customer';
}

$result = process_contact_message($data);
send_json($result['status'], $result['code']);
