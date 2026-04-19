<?php

/**
 * Send transactional mail via SendGrid Web API (HTTPS, port 443).
 * Avoids outbound SMTP (e.g. port 25) which is often blocked on cloud hosts.
 */
function mandalart_send_password_reset_email(string $toEmail, string $jwtToken): array
{
    $apiKey = SENDGRID_API_KEY;
    if ($apiKey === '') {
        return ['ok' => false, 'reason' => 'missing_api_key'];
    }

    $origin = MANDALART_PUBLIC_ORIGIN;
    if ($origin === '') {
        return ['ok' => false, 'reason' => 'missing_public_origin'];
    }

    $resetUrl = $origin . '/reset-password?token=' . rawurlencode($jwtToken);
    $from     = MANDALART_MAIL_FROM;

    $plain = "Jelszó visszaállítás\n\n"
        . "Nyisd meg ezt a linket (1 óráig érvényes):\n"
        . $resetUrl . "\n\n"
        . "Ha nem te kérted, hagyd figyelmen kívül ezt az üzenetet.\n";

    $html = '<p>Jelszó visszaállítás</p>'
        . '<p><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '">Új jelszó beállítása</a></p>'
        . '<p>Ha a gomb nem működik, másold be a böngészőbe:<br><code style="word-break:break-all">'
        . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '</code></p>'
        . '<p>Ha nem te kérted, hagyd figyelmen kívül ezt az üzenetet.</p>';

    $payload = [
        'personalizations' => [
            [
                'to' => [['email' => $toEmail]],
            ],
        ],
        'from' => [
            'email' => $from,
            'name'  => 'Mandalart',
        ],
        'subject' => 'Jelszó visszaállítás — Mandalart',
        'content' => [
            ['type' => 'text/plain', 'value' => $plain],
            ['type' => 'text/html', 'value' => $html],
        ],
    ];

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
