<?php

require_once __DIR__ . '/../services/order_service.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json('malformed_request', 400);
}

$currentUserEmail = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? $_SERVER['Authorization']
    ?? '';

if ($authHeader === '' && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
}

if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
    require_once __DIR__ . '/../core/jwt.php';
    $payload = JWT::validate_token($m[1]);
    if ($payload && !empty($payload->email)) {
        $currentUserEmail = $payload->email;
    }
}

$result = process_order($data, $currentUserEmail);

$extra = [];
if (!empty($result['product_id'])) {
    $extra['product_id'] = $result['product_id'];
}
if (($result['status'] ?? '') === 'insufficient_stock') {
    $extra['message'] = 'Not enough stock for one or more products. Refresh the shop and adjust quantities.';
}

send_json($result['status'], $result['code'], $extra);

