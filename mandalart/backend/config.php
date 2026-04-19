<?php

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_NAME', getenv('DB_NAME') ?: 'mandalart');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'csereld_le_egy_min_32_karakteres_random_stringre');

require_once __DIR__ . '/config/register_settings.php';
require_once __DIR__ . '/config/workshop_settings.php';

if (!defined('MANDALART_DEV_EXPOSE_RESET_TOKEN')) {
    define(
        'MANDALART_DEV_EXPOSE_RESET_TOKEN',
        filter_var(getenv('MANDALART_DEV_EXPOSE_RESET_TOKEN') ?: 'false', FILTER_VALIDATE_BOOLEAN)
    );
}

$sendgridKey = getenv('SENDGRID_API_KEY');
define('SENDGRID_API_KEY', is_string($sendgridKey) ? trim($sendgridKey) : '');

$mailFrom = getenv('MANDALART_MAIL_FROM');
define(
    'MANDALART_MAIL_FROM',
    (is_string($mailFrom) && $mailFrom !== '') ? $mailFrom : 'noreply@mandalart.shop'
);

$publicOrigin = getenv('MANDALART_PUBLIC_ORIGIN');
define(
    'MANDALART_PUBLIC_ORIGIN',
    (is_string($publicOrigin) && $publicOrigin !== '') ? rtrim($publicOrigin, '/') : ''
);

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}
