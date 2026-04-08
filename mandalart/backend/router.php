<?php
/**
 * PHP beépített szerver router.
 * Minden kérés az index.php-ra megy, így az /api/... URL-ek működnek.
 * Indítás: php -S localhost:8000 router.php
 * (Futtasd a backend mappából!)
 */
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if ($uri !== '/' && $uri !== '' && file_exists(__DIR__ . $uri)) {
    return false; // létező fájl: kiszolgálja a szerver
}
require __DIR__ . '/index.php';
