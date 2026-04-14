<?php

require_once __DIR__ . '/../models/order_model.php';
require_once __DIR__ . '/mail_service.php';

/**
 * Rendelés feldolgozása.
 *
 * Elvárt input:
 * - customer: { fullName, country, county, city, postalCode, street, houseNumber, phone, payment }
 * - items: [ { id, name, price, currency, qty }, ... ]
 * - total: number
 *
 * Visszatérés:
 * - ['status' => 'success', 'code' => 200]
 * - ['status' => 'malformed_request', 'code' => 400]
 * - ['status' => 'server_error', 'code' => 500]
 */
function process_order(array $payload, ?string $currentUserEmail = null): array
{
    $customer = $payload['customer'] ?? null;
    $items    = $payload['items'] ?? null;
    $total    = $payload['total'] ?? null;

    if (!is_array($customer) || !is_array($items) || !is_numeric($total)) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    // Minimális validáció, ugyanazok a mezők, mint a frontend validációban
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

    if ($created === null) {
        return ['status' => 'server_error', 'code' => 500];
    }

    $mailTo = trim((string) ($created['email'] ?? ''));
    if ($mailTo !== '' && $mailTo !== 'guest@example.com' && filter_var($mailTo, FILTER_VALIDATE_EMAIL)) {
        mandalart_mail_send_order_confirmation(
            $mailTo,
            (string) ($created['full_name'] ?? ''),
            (string) ($created['order_number'] ?? ''),
            (float) ($created['total_amount'] ?? 0.0),
            is_array($created['items'] ?? null) ? $created['items'] : []
        );
    }

    return ['status' => 'success', 'code' => 200];
}

