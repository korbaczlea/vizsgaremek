<?php

require_once __DIR__ . '/../models/contact_model.php';

function process_contact_message(array $payload): array
{
    $maxLen = 300;
    $nameRaw   = trim((string)($payload['name'] ?? ''));
    $firstName = trim((string)($payload['first_name'] ?? ''));
    $lastName  = trim((string)($payload['last_name'] ?? ''));
    $email     = trim((string)($payload['email'] ?? ''));
    $subject   = trim((string)($payload['subject'] ?? ''));
    $message   = trim((string)($payload['message'] ?? ''));

    if ($nameRaw !== '' && ($firstName === '' && $lastName === '')) {
        $parts = preg_split('/\s+/', $nameRaw) ?: [];
        $firstName = trim((string)($parts[0] ?? ''));
        $lastName = trim((string)implode(' ', array_slice($parts, 1)));
    }

    if ($firstName === '' || $email === '' || $message === '') {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $len = function (string $s): int {
        return function_exists('mb_strlen') ? (int) mb_strlen($s, 'UTF-8') : (int) strlen($s);
    };
    if ($len($message) > $maxLen) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    try {
        $ok = create_contact_message(
            $firstName,
            $lastName,
            $email,
            $subject !== '' ? $subject : null,
            $message
        );
    } catch (Throwable $e) {
        return ['status' => 'server_error', 'code' => 500];
    }

    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}
