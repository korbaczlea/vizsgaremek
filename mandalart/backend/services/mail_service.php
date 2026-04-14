<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/mail_settings.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

function mandalart_mail_escape(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function mandalart_mail_is_configured(): bool
{
    return MANDALART_SMTP_USER !== '' && MANDALART_SMTP_PASSWORD !== '';
}

/**
 * @return bool true ha elküldve, false ha nincs SMTP beállítás vagy hiba történt
 */
function mandalart_send_html_email(string $to, string $subject, string $htmlBody, string $altBody = ''): bool
{
    if (!mandalart_mail_is_configured()) {
        error_log('MandalArt mail: set MANDALART_SMTP_USER and MANDALART_SMTP_PASSWORD (Gmail app password).');
        return false;
    }
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (!is_file($autoload)) {
        error_log('MandalArt mail: run composer install in backend (vendor/autoload.php missing).');
        return false;
    }
    require_once $autoload;

    $mail = new PHPMailer(true);

    try {
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->isSMTP();
        $mail->Host = MANDALART_SMTP_HOST;
        $mail->Port = MANDALART_SMTP_PORT;
        $mail->SMTPAuth = true;
        $mail->Username = MANDALART_SMTP_USER;
        $mail->Password = MANDALART_SMTP_PASSWORD;

        if (MANDALART_SMTP_PORT === 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        $mail->setFrom(MANDALART_MAIL_FROM, MANDALART_MAIL_FROM_NAME);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = $altBody !== ''
            ? $altBody
            : trim(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody)));

        $mail->send();
        return true;
    } catch (Exception $e) {
        $info = $mail->ErrorInfo !== '' ? $mail->ErrorInfo : $e->getMessage();
        error_log('MandalArt mail error: ' . $info);
        return false;
    }
}

function mandalart_mail_send_password_reset(string $email, string $token): void
{
    $link = MANDALART_PUBLIC_SITE_URL . '/reset-password?token=' . rawurlencode($token);
    $subj = 'MandalArt — password reset';
    $html = '<p>Hello,</p>'
        . '<p>You asked to reset your MandalArt account password. Open this link to choose a new password (valid for a limited time):</p>'
        . '<p><a href="' . mandalart_mail_escape($link) . '">' . mandalart_mail_escape($link) . '</a></p>'
        . '<p>If you did not request this, you can ignore this email.</p>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($email, $subj, $html);
}

function mandalart_mail_send_contact_received(string $to, string $firstName): void
{
    $name = $firstName !== '' ? mandalart_mail_escape($firstName) : 'there';
    $subj = 'MandalArt — we received your message';
    $html = '<p>Hi ' . $name . ',</p>'
        . '<p>Thank you for contacting MandalArt. We have received your message and will reply by email as soon as we can.</p>'
        . '<p>— MandalArt<br>' . mandalart_mail_escape(MANDALART_MAIL_FROM) . '</p>';
    mandalart_send_html_email($to, $subj, $html);
}

function mandalart_mail_send_contact_reply(string $to, string $replyText): void
{
    $subj = 'MandalArt — reply from our team';
    $html = '<p>Hello,</p>'
        . '<p>We have a new reply for you:</p>'
        . '<blockquote style="margin:1em 0;padding:0.5em 1em;border-left:3px solid #ccc;">'
        . nl2br(mandalart_mail_escape($replyText))
        . '</blockquote>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($to, $subj, $html);
}

/**
 * @param array<int, array<string, mixed>> $items
 */
function mandalart_mail_send_order_confirmation(string $to, string $fullName, string $orderNumber, float $total, array $items): void
{
    $subj = 'MandalArt — order received (' . $orderNumber . ')';
    $lines = '';
    foreach ($items as $item) {
        $name = (string) ($item['name'] ?? 'Product');
        $qty  = (int) ($item['qty'] ?? 1);
        $price = (float) ($item['price'] ?? 0);
        $lines .= '<tr><td>' . mandalart_mail_escape($name) . '</td><td>' . $qty . '</td><td>' . mandalart_mail_escape(number_format($price, 2)) . '</td></tr>';
    }
    $html = '<p>Hi ' . mandalart_mail_escape($fullName) . ',</p>'
        . '<p>Thank you for your order. We have received it and will process it soon.</p>'
        . '<p><strong>Order number:</strong> ' . mandalart_mail_escape($orderNumber) . '<br>'
        . '<strong>Total:</strong> ' . mandalart_mail_escape(number_format($total, 2)) . '</p>'
        . '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th></tr></thead><tbody>'
        . $lines
        . '</tbody></table>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($to, $subj, $html);
}

function mandalart_mail_send_workshop_booking_pending(string $to, string $guestName, string $workshopTitle, string $startDatetime): void
{
    $subj = 'MandalArt — workshop booking request received';
    $html = '<p>Hi ' . mandalart_mail_escape($guestName) . ',</p>'
        . '<p>We have received your booking request for the following workshop:</p>'
        . '<ul>'
        . '<li><strong>' . mandalart_mail_escape($workshopTitle) . '</strong></li>'
        . '<li>' . mandalart_mail_escape($startDatetime) . '</li>'
        . '</ul>'
        . '<p>Status: pending confirmation. We will confirm by email when your place is confirmed.</p>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($to, $subj, $html);
}

function mandalart_mail_send_workshop_waitlist_joined(string $to, string $guestName, string $workshopTitle, string $startDatetime): void
{
    $subj = 'MandalArt — you are on the workshop waitlist';
    $html = '<p>Hi ' . mandalart_mail_escape($guestName) . ',</p>'
        . '<p>You are on the waitlist for:</p>'
        . '<ul>'
        . '<li><strong>' . mandalart_mail_escape($workshopTitle) . '</strong></li>'
        . '<li>' . mandalart_mail_escape($startDatetime) . '</li>'
        . '</ul>'
        . '<p>If a place becomes available, we will email you.</p>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($to, $subj, $html);
}

function mandalart_mail_send_workshop_promoted_from_waitlist(string $to, string $guestName, string $workshopTitle, string $startDatetime): void
{
    $subj = 'MandalArt — a workshop place is available for you';
    $html = '<p>Hi ' . mandalart_mail_escape($guestName) . ',</p>'
        . '<p>A place has become available and we have reserved it for you (pending confirmation):</p>'
        . '<ul>'
        . '<li><strong>' . mandalart_mail_escape($workshopTitle) . '</strong></li>'
        . '<li>' . mandalart_mail_escape($startDatetime) . '</li>'
        . '</ul>'
        . '<p>Please check your account or contact us if you have questions.</p>'
        . '<p>— MandalArt</p>';
    mandalart_send_html_email($to, $subj, $html);
}
