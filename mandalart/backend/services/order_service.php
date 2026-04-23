<?php

require_once __DIR__ . '/../models/order_model.php';
require_once __DIR__ . '/sendgrid_mail.php';

function process_order(array $payload, ?string $currentUserEmail = null): array
{
    $customer = $payload['customer'] ?? null;
    $items    = $payload['items'] ?? null;
    $total    = $payload['total'] ?? null;

    if (!is_array($customer) || !is_array($items) || !is_numeric($total)) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $required = ['fullName', 'country', 'county', 'city', 'postalCode', 'street', 'houseNumber', 'phone'];
    foreach ($required as $key) {
        if (empty(trim($customer[$key] ?? ''))) {
            return ['status' => 'malformed_request', 'code' => 400];
        }
    }

    if (count($items) === 0) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    try {
        $created = create_order($customer, $items, (float) $total, $currentUserEmail);
    } catch (Throwable $e) {
        return ['status' => 'server_error', 'code' => 500];
    }

    if (empty($created['ok'])) {
        if (($created['reason'] ?? '') === 'insufficient_stock') {
            return [
                'status' => 'insufficient_stock',
                'code'   => 409,
                'product_id' => (int) ($created['product_id'] ?? 0),
            ];
        }
        return ['status' => 'server_error', 'code' => 500];
    }

    if (SENDGRID_API_KEY !== '') {
        $to = trim((string) ($created['email'] ?? ''));
        if ($to !== '' && strcasecmp($to, 'guest@example.com') !== 0) {
            $sent = mandalart_send_order_status_update_email(
                $to,
                (string) ($created['full_name'] ?? ''),
                (string) ($created['order_number'] ?? ''),
                'pending'
            );
            if (!$sent['ok']) {
                error_log('mandalart order pending email: ' . json_encode($sent, JSON_UNESCAPED_UNICODE));
            }
        }
    }

    return ['status' => 'success', 'code' => 200];
}

