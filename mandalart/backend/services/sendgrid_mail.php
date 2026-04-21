<?php

/**
 * Send transactional mail via SendGrid Web API (HTTPS, port 443).
 */

function mandalart_email_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function mandalart_email_status_badge(string $label, string $tone = 'neutral'): string
{
    $toneMap = [
        'success' => ['bg' => '#e8f7ee', 'text' => '#166534'],
        'warning' => ['bg' => '#fff6e8', 'text' => '#9a5800'],
        'danger' => ['bg' => '#fdecec', 'text' => '#991b1b'],
        'info' => ['bg' => '#e9f2ff', 'text' => '#1e3a8a'],
        'neutral' => ['bg' => '#f3f4f6', 'text' => '#374151'],
    ];
    $picked = $toneMap[$tone] ?? $toneMap['neutral'];

    return '<span style="display:inline-block;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.3px;background:'
        . $picked['bg'] . ';color:' . $picked['text'] . ';">' . mandalart_email_escape($label) . '</span>';
}

function mandalart_build_email_html(
    string $headline,
    string $leadParagraph,
    string $contentHtml,
    ?string $ctaText = null,
    ?string $ctaUrl = null
): string {
    $ctaBlock = '';
    if ($ctaText !== null && $ctaUrl !== null && trim($ctaText) !== '' && trim($ctaUrl) !== '') {
        $ctaBlock = '<div style="margin-top:20px;margin-bottom:4px;">'
            . '<a href="' . mandalart_email_escape($ctaUrl) . '" style="display:inline-block;padding:12px 18px;background:#b96c9c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">'
            . mandalart_email_escape($ctaText) . '</a>'
            . '</div>';
    }

    return '<!doctype html><html><body style="margin:0;padding:0;background:#f3eadf;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eadf;padding:24px 12px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #efe7df;">'
        . '<tr><td style="padding:18px 24px;background:linear-gradient(90deg,#f7e7f1,#efe8ff);">'
        . '<div style="font-size:20px;font-weight:800;letter-spacing:1px;color:#111827;">MANDALART</div>'
        . '<div style="margin-top:4px;font-size:12px;color:#6b7280;letter-spacing:0.4px;">CREATE · DECORATE · INSPIRE</div>'
        . '</td></tr>'
        . '<tr><td style="padding:24px;">'
        . '<h2 style="margin:0 0 10px;font-size:22px;line-height:1.25;color:#111827;">' . mandalart_email_escape($headline) . '</h2>'
        . '<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">' . mandalart_email_escape($leadParagraph) . '</p>'
        . $contentHtml
        . $ctaBlock
        . '<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">Need help? Reply to this email and our team will assist you.</p>'
        . '</td></tr>'
        . '<tr><td style="padding:14px 24px;border-top:1px solid #f1f1f1;background:#fafafa;font-size:12px;color:#9ca3af;">&copy; ' . gmdate('Y') . ' Mandalart. All rights reserved.</td></tr>'
        . '</table>'
        . '</td></tr></table></body></html>';
}

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

    $plain = "Password reset request\n\n"
        . "We received a request to reset your Mandalart password.\n"
        . "Use this secure link within 1 hour:\n{$resetUrl}\n\n"
        . "If you did not request this, please ignore this email.\n";

    $html = mandalart_build_email_html(
        'Reset your password',
        'We received a request to reset your Mandalart account password.',
        '<div style="margin:12px 0 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<div style="font-size:13px;color:#6b7280;">Security notice</div>'
        . '<div style="margin-top:6px;font-size:14px;color:#111827;">This link expires in <strong>1 hour</strong>.</div>'
        . '<div style="margin-top:10px;font-size:12px;color:#6b7280;word-break:break-all;">'
        . mandalart_email_escape($resetUrl)
        . '</div></div>',
        'Set a new password',
        $resetUrl
    );

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
        . "Welcome to Mandalart. Your account is now active.\n"
        . "You can sign in here: {$site}\n\n"
        . "— Mandalart\n";

    $html = mandalart_build_email_html(
        'Welcome to Mandalart',
        "Hi {$safe}, your account is ready.",
        '<div style="margin-top:12px;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.7;">'
        . '<li>Browse handmade mandalas and workshops</li>'
        . '<li>Track your orders and bookings in your profile</li>'
        . '<li>Get support updates directly in your account</li>'
        . '</ul></div>',
        'Open Mandalart',
        $site
    );

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

    $plain = "New sign-in detected\n\n"
        . "We noticed a sign-in to your Mandalart account.\n"
        . "Time (UTC): {$when}\n\n"
        . "If this was not you, change your password now: {$site}\n";

    $html = mandalart_build_email_html(
        'New sign-in to your account',
        'We noticed a new login activity on your Mandalart account.',
        '<div style="margin:12px 0 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<div style="font-size:13px;color:#6b7280;">Time (UTC)</div>'
        . '<div style="margin-top:6px;font-size:14px;color:#111827;font-weight:600;">' . mandalart_email_escape($when) . '</div>'
        . '</div>'
        . '<p style="margin:14px 0 0;font-size:14px;color:#374151;line-height:1.7;">If this was not you, reset your password immediately.</p>',
        'Secure my account',
        $site
    );

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
            'tone'    => 'warning',
        ],
        'processing' => [
            'subject' => "Order {$orderNumber} — being prepared",
            'line'    => 'We are preparing your items. You will get another update when your order ships.',
            'tone'    => 'info',
        ],
        'shipping' => [
            'subject' => "Order {$orderNumber} — on the way",
            'line'    => 'Your order has been shipped or handed to the courier. It should reach you soon.',
            'tone'    => 'info',
        ],
        'delivered' => [
            'subject' => "Order {$orderNumber} — delivered",
            'line'    => 'Your order is marked as delivered. Thank you for shopping with Mandalart.',
            'tone'    => 'success',
        ],
        'cancelled' => [
            'subject' => "Order {$orderNumber} — cancelled",
            'line'    => 'Your order has been cancelled. If you did not request this, please contact us.',
            'tone'    => 'danger',
        ],
    ];

    $block = $copy[$newStatus] ?? [
        'subject' => "Order {$orderNumber} — status update",
        'line'    => 'Your order status has been updated.',
        'tone'    => 'neutral',
    ];

    $plain = "Hi {$greeting},\n\n"
        . "Order: {$orderNumber}\n"
        . 'New status: ' . $newStatus . "\n\n"
        . $block['line'] . "\n\n"
        . "View your orders: {$profileUrl}\n\n"
        . "— Mandalart\n";

    $html = mandalart_build_email_html(
        "Order {$orderNumber} updated",
        "Hi {$greeting}, we have an update about your order.",
        '<div style="margin:12px 0 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<div style="font-size:13px;color:#6b7280;">Order number</div>'
        . '<div style="margin-top:6px;font-size:15px;color:#111827;font-weight:700;">' . mandalart_email_escape($orderNumber) . '</div>'
        . '<div style="margin-top:12px;">' . mandalart_email_status_badge('Status: ' . strtoupper($newStatus), (string) $block['tone']) . '</div>'
        . '<p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">' . mandalart_email_escape($block['line']) . '</p>'
        . '</div>',
        'View my orders',
        $profileUrl
    );

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

/**
 * Notify customer about workshop booking status events.
 *
 * @param string $status pending|confirmed|cancelled|attended
 */
function mandalart_send_workshop_booking_status_email(
    string $toEmail,
    string $customerName,
    string $workshopTitle,
    string $sessionStartDateTime,
    string $status
): array {
    $from = MANDALART_MAIL_FROM;
    $site = MANDALART_PUBLIC_ORIGIN !== '' ? MANDALART_PUBLIC_ORIGIN : 'https://mandalart.shop';
    $profileUrl = rtrim($site, '/') . '/Profile';
    $greeting = trim($customerName) !== '' ? trim($customerName) : 'Customer';
    $title = trim($workshopTitle) !== '' ? trim($workshopTitle) : 'Workshop session';
    $when = trim($sessionStartDateTime) !== '' ? trim($sessionStartDateTime) : '-';

    $copy = [
        'pending' => [
            'subject' => 'Workshop booking received',
            'line' => 'We received your booking request. We will notify you once it is confirmed.',
            'tone' => 'warning',
        ],
        'confirmed' => [
            'subject' => 'Workshop booking confirmed',
            'line' => 'Your workshop booking is confirmed. We look forward to seeing you.',
            'tone' => 'success',
        ],
        'cancelled' => [
            'subject' => 'Workshop booking cancelled',
            'line' => 'Your workshop booking has been cancelled. If this was unexpected, please contact us.',
            'tone' => 'danger',
        ],
        'attended' => [
            'subject' => 'Workshop marked as attended',
            'line' => 'Your workshop booking was marked as attended. Thank you for joining.',
            'tone' => 'info',
        ],
    ];

    $block = $copy[$status] ?? [
        'subject' => 'Workshop booking status update',
        'line' => 'Your workshop booking status has been updated.',
        'tone' => 'neutral',
    ];

    $plain = "Hi {$greeting},\n\n"
        . "Workshop: {$title}\n"
        . "Session: {$when}\n"
        . "New status: {$status}\n\n"
        . $block['line'] . "\n\n"
        . "View your bookings: {$profileUrl}\n\n"
        . "— Mandalart\n";

    $extra = '';
    if ($status === 'confirmed') {
        $extra = '<p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">Please arrive 10 minutes early so we can begin on time.</p>';
    } elseif ($status === 'cancelled') {
        $extra = '<p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">Need help rebooking? Contact our team and we will assist you quickly.</p>';
    }

    $html = mandalart_build_email_html(
        'Workshop booking update',
        "Hi {$greeting}, your workshop booking status has changed.",
        '<div style="margin:12px 0 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<div style="font-size:13px;color:#6b7280;">Workshop</div>'
        . '<div style="margin-top:6px;font-size:15px;color:#111827;font-weight:700;">' . mandalart_email_escape($title) . '</div>'
        . '<div style="margin-top:10px;font-size:13px;color:#6b7280;">Session</div>'
        . '<div style="margin-top:6px;font-size:14px;color:#111827;">' . mandalart_email_escape($when) . '</div>'
        . '<div style="margin-top:12px;">' . mandalart_email_status_badge('Status: ' . strtoupper($status), (string) $block['tone']) . '</div>'
        . '<p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">' . mandalart_email_escape($block['line']) . '</p>'
        . $extra
        . '</div>',
        $status === 'cancelled' ? 'Contact support' : 'View my bookings',
        $profileUrl
    );

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

function mandalart_send_workshop_waitlist_joined_email(
    string $toEmail,
    string $customerName,
    string $workshopTitle,
    string $sessionStartDateTime
): array {
    $from = MANDALART_MAIL_FROM;
    $site = MANDALART_PUBLIC_ORIGIN !== '' ? MANDALART_PUBLIC_ORIGIN : 'https://mandalart.shop';
    $profileUrl = rtrim($site, '/') . '/Profile';
    $greeting = trim($customerName) !== '' ? trim($customerName) : 'Customer';
    $title = trim($workshopTitle) !== '' ? trim($workshopTitle) : 'Workshop session';
    $when = trim($sessionStartDateTime) !== '' ? trim($sessionStartDateTime) : '-';

    $plain = "Hi {$greeting},\n\n"
        . "You are now on the waitlist for this workshop:\n"
        . "Workshop: {$title}\n"
        . "Session: {$when}\n\n"
        . "If a place becomes available, we will notify you by email.\n"
        . "You can track your waitlist/bookings in your profile: {$profileUrl}\n\n"
        . "— Mandalart\n";

    $html = mandalart_build_email_html(
        'You are on the workshop waitlist',
        "Hi {$greeting}, your waitlist request has been recorded.",
        '<div style="margin:12px 0 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">'
        . '<div style="font-size:13px;color:#6b7280;">Workshop</div>'
        . '<div style="margin-top:6px;font-size:15px;color:#111827;font-weight:700;">' . mandalart_email_escape($title) . '</div>'
        . '<div style="margin-top:10px;font-size:13px;color:#6b7280;">Session</div>'
        . '<div style="margin-top:6px;font-size:14px;color:#111827;">' . mandalart_email_escape($when) . '</div>'
        . '<div style="margin-top:12px;">' . mandalart_email_status_badge('WAITLISTED', 'warning') . '</div>'
        . '<p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">If a place becomes available, we will notify you by email automatically.</p>'
        . '</div>',
        'View my profile',
        $profileUrl
    );

    $payload = [
        'personalizations' => [['to' => [['email' => $toEmail]]]],
        'from'             => ['email' => $from, 'name' => 'Mandalart'],
        'subject'          => 'Workshop waitlist confirmation',
        'content'          => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

    return mandalart_sendgrid_mail($payload);
}
