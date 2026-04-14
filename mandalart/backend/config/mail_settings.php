<?php

/**
 * Outbound mail (Gmail SMTP / Google Workspace).
 *
 * Set on the server (Apache SetEnv, php-fpm pool env, or system env):
 * - MANDALART_SMTP_USER       Gmail vagy Workspace cím (pl. info@mandalart.shop)
 * - MANDALART_SMTP_PASSWORD   Google „App password” (2FA mellett)
 *
 * Opcionális:
 * - MANDALART_MAIL_FROM       alap: info@mandalart.shop
 * - MANDALART_MAIL_FROM_NAME  alap: MandalArt
 * - MANDALART_PUBLIC_SITE_URL alap: https://mandalart.shop (jelszó-visszaállító link)
 * - MANDALART_SMTP_HOST       alap: smtp.gmail.com
 * - MANDALART_SMTP_PORT       alap: 465 (SMTPS) vagy 587 (STARTTLS)
 */

if (!defined('MANDALART_MAIL_FROM')) {
    define('MANDALART_MAIL_FROM', getenv('MANDALART_MAIL_FROM') ?: 'info@mandalart.shop');
}
if (!defined('MANDALART_MAIL_FROM_NAME')) {
    define('MANDALART_MAIL_FROM_NAME', getenv('MANDALART_MAIL_FROM_NAME') ?: 'MandalArt');
}
if (!defined('MANDALART_PUBLIC_SITE_URL')) {
    define(
        'MANDALART_PUBLIC_SITE_URL',
        rtrim((string) (getenv('MANDALART_PUBLIC_SITE_URL') ?: 'https://mandalart.shop'), '/')
    );
}
if (!defined('MANDALART_SMTP_HOST')) {
    define('MANDALART_SMTP_HOST', getenv('MANDALART_SMTP_HOST') ?: 'smtp.gmail.com');
}
if (!defined('MANDALART_SMTP_PORT')) {
    define('MANDALART_SMTP_PORT', (int) (getenv('MANDALART_SMTP_PORT') ?: 465));
}
if (!defined('MANDALART_SMTP_USER')) {
    define('MANDALART_SMTP_USER', (string) (getenv('MANDALART_SMTP_USER') ?: ''));
}
if (!defined('MANDALART_SMTP_PASSWORD')) {
    $p = getenv('MANDALART_SMTP_PASSWORD');
    define('MANDALART_SMTP_PASSWORD', ($p !== false && $p !== null) ? (string) $p : '');
}
