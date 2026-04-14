<?php

require_once __DIR__ . '/../models/order_model.php';

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
        $ok = create_order($customer, $items, (float) $total, $currentUserEmail);
    } catch (Throwable $e) {
        return ['status' => 'server_error', 'code' => 500];
    }

    if (!$ok) {
        return ['status' => 'server_error', 'code' => 500];
    }

    // Itt lehetne email küldés a rendelés adataival.
    return ['status' => 'success', 'code' => 200];
}

