<?php

/**
 * Send transactional mail via SendGrid Web API (HTTPS, port 443).
 */

function mandalart_sendgrid_mail(array $payload): array
{
    $apiKey = SENDGRID_API_KEY;
    if ($apiKey === '') {
        return ['ok' => false, 'reason' => 'missing_api_key'];
    }

    $json    = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 25,
        ]);
        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false) {
            return ['ok' => false, 'reason' => 'curl_error', 'detail' => $err];
        }
        if ($code >= 200 && $code < 300) {
            return ['ok' => true];
        }

        return ['ok' => false, 'reason' => 'sendgrid_http', 'http_code' => $code, 'detail' => substr((string) $body, 0, 500)];
    }

    $ctx = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => implode("\r\n", $headers) . "\r\n",
            'content' => $json,
            'timeout' => 25,
        ],
    ]);
    $body = @file_get_contents('https://api.sendgrid.com/v3/mail/send', false, $ctx);
    if ($body === false) {
        return ['ok' => false, 'reason' => 'http_request_failed'];
    }
    $code = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $code = (int) $m[1];
    }
    if ($code >= 200 && $code < 300) {
        return ['ok' => true];
    }

    return ['ok' => false, 'reason' => 'sendgrid_http', 'http_code' => $code, 'detail' => substr((string) $body, 0, 500)];
}

function mandalart_send_password_reset_email(string $toEmail, string $jwtToken): array
{
    if (MANDALART_PUBLIC_ORIGIN === '') {
        return ['ok' => false, 'reason' => 'missing_public_origin'];
    }

    $resetUrl = MANDALART_PUBLIC_ORIGIN . '/reset-password?token=' . rawurlencode($jwtToken);
    $from     = MANDALART_MAIL_FROM;

    $plain = "Password reset\n\n"
        . "Open this link to choose a new password. It expires in one hour:\n"
        . $resetUrl . "\n\n"
        . "If you did not request a reset, you can ignore this email.\n";

    $html = '<p><strong>Password reset</strong></p>'
        . '<p><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '">Set a new password</a></p>'
        . '<p>If the button does not work, copy and paste this URL into your browser:<br><code style="word-break:break-all">'
        . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '</code></p>'
        . '<p>If you did not request a password reset, you can ignore this email.</p>';

    $payload = [
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from'             => ['email' => $from, 'name' => 'Mandalart'],
        'subject'          => 'Reset your Mandalart password',
        'content'          => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

    return mandalart_sendgrid_mail($payload);
}

function mandalart_send_registration_welcome(string $toEmail, string $name): array
{
    $from = MANDALART_MAIL_FROM;
    $safe = trim($name) !== '' ? trim($name) : 'there';
    $site = MANDALART_PUBLIC_ORIGIN !== '' ? MANDALART_PUBLIC_ORIGIN : 'https://mandalart.shop';

    $plain = "Hi {$safe},\n\n"
        . "Thanks for creating a Mandalart account.\n\n"
        . "You can sign in anytime at:\n{$site}\n\n"
        . "— Mandalart\n";

    $html = '<p>Hi ' . htmlspecialchars($safe, ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>Thanks for creating a <strong>Mandalart</strong> account.</p>'
        . '<p><a href="' . htmlspecialchars($site, ENT_QUOTES, 'UTF-8') . '">Go to the site</a></p>'
        . '<p>— Mandalart</p>';

    $payload = [
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from'             => ['email' => $from, 'name' => 'Mandalart'],
        'subject'          => 'Welcome to Mandalart',
        'content'          => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

    return mandalart_sendgrid_mail($payload);
}

function mandalart_send_login_notification(string $toEmail): array
{
    $from = MANDALART_MAIL_FROM;
    $when = gmdate('Y-m-d H:i:s') . ' UTC';
    $site = MANDALART_PUBLIC_ORIGIN !== '' ? MANDALART_PUBLIC_ORIGIN : 'https://mandalart.shop';

    $plain = "Someone just signed in to your Mandalart account.\n\n"
        . "Time (UTC): {$when}\n\n"
        . "If this was you, you can ignore this message.\n"
        . "If not, change your password right away: {$site}\n\n"
        . "— Mandalart\n";

    $html = '<p>Someone just signed in to your <strong>Mandalart</strong> account.</p>'
        . '<p><strong>Time (UTC):</strong> ' . htmlspecialchars($when, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p>If this was you, you can ignore this message.</p>'
        . '<p>If it was not you, <a href="' . htmlspecialchars($site, ENT_QUOTES, 'UTF-8') . '">open the site</a> and change your password.</p>'
        . '<p>— Mandalart</p>';

    $payload = [
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from'             => ['email' => $from, 'name' => 'Mandalart'],
        'subject'          => 'New sign-in to your Mandalart account',
        'content'          => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

    return mandalart_sendgrid_mail($payload);
}

/**
 * Notify customer after an admin changes their order status.
 *
 * @param string $newStatus pending|processing|shipping|delivered|cancelled
 */
function mandalart_send_order_status_update_email(
    string $toEmail,
    string $customerName,
    string $orderNumber,
    string $newStatus
): array {
    $from = MANDALART_MAIL_FROM;
    $site = MANDALART_PUBLIC_ORIGIN !== '' ? MANDALART_PUBLIC_ORIGIN : 'https://mandalart.shop';
    $profileUrl = rtrim($site, '/') . '/Profile';

    $greeting = trim($customerName) !== '' ? trim($customerName) : 'Customer';

    $copy = [
        'pending' => [
            'subject' => "Order {$orderNumber} — received",
            'line'    => 'Your order is pending confirmation. We will email you again when the status changes.',
        ],
        'processing' => [
            'subject' => "Order {$orderNumber} — being prepared",
            'line'    => 'We are preparing your items. You will get another update when your order ships.',
        ],
        'shipping' => [
            'subject' => "Order {$orderNumber} — on the way",
            'line'    => 'Your order has been shipped or handed to the courier. It should reach you soon.',
        ],
        'delivered' => [
            'subject' => "Order {$orderNumber} — delivered",
            'line'    => 'Your order is marked as delivered. Thank you for shopping with Mandalart.',
        ],
        'cancelled' => [
            'subject' => "Order {$orderNumber} — cancelled",
            'line'    => 'Your order has been cancelled. If you did not request this, please contact us.',
        ],
    ];

    $block = $copy[$newStatus] ?? [
        'subject' => "Order {$orderNumber} — status update",
        'line'    => 'Your order status has been updated.',
    ];

    $plain = "Hi {$greeting},\n\n"
        . "Order: {$orderNumber}\n"
        . 'New status: ' . $newStatus . "\n\n"
        . $block['line'] . "\n\n"
        . "View your orders: {$profileUrl}\n\n"
        . "— Mandalart\n";

    $statusEsc = htmlspecialchars($newStatus, ENT_QUOTES, 'UTF-8');
    $html = '<p>Hi ' . htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p><strong>Order:</strong> ' . htmlspecialchars($orderNumber, ENT_QUOTES, 'UTF-8') . '<br>'
        . '<strong>New status:</strong> ' . $statusEsc . '</p>'
        . '<p>' . htmlspecialchars($block['line'], ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p><a href="' . htmlspecialchars($profileUrl, ENT_QUOTES, 'UTF-8') . '">View your orders</a></p>'
        . '<p>— Mandalart</p>';

    $payload = [
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from'             => ['email' => $from, 'name' => 'Mandalart'],
        'subject'          => $block['subject'],
        'content'          => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

    return mandalart_sendgrid_mail($payload);
}
