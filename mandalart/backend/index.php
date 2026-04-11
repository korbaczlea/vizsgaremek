<?php

require_once __DIR__ . '/config.php';

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function send_json(string $status, int $statusCode, array $extra = []): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $payload = array_merge(
        [
            'status'     => $status,
            'statuscode' => (string) $statusCode,
        ],
        $extra
    );

    echo json_encode($payload);
    exit;
}

// Endpoint meghatározása akkor is működjön, ha a backend almappában fut
// pl. /api/login_promise vagy /mandalart/backend/api/login_promise.
$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$parts   = array_values(array_filter(explode('/', trim($uriPath, '/'))));

$apiIndex = array_search('api', $parts, true);
$endpoint = ($apiIndex !== false) ? ($parts[$apiIndex + 1] ?? '') : '';

if ($apiIndex === false || $endpoint === '') {
    send_json('not_found', 404);
}

$public_endpoints = [
    'login_request',
    'login_promise',
    'register_request',
    'register_promise',
    'chpass_request',
    'chpass_promise',
    'workshop_booking',
    'get_workshop_sessions',
    'get_workshop_calendar',
    'workshop_waitlist_join',
    'place_order',
    'get_all_products',
    'get_featured_products',
    'get_categories',
    'newsletter',
    'get_gallery_images',
    'sync_gallery_images',
    'get_site_pages',
    'get_home_page',
    'get_about_page',
    'contact_guest_request',
];

$is_public = in_array($endpoint, $public_endpoints, true);

$currentUserEmail = null;

if (!$is_public) {
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

    if (!preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
        send_json('missing_auth_header', 401);
    }

    $token = $m[1];
    require_once __DIR__ . '/core/jwt.php';

    $payload = JWT::validate_token($token);
    if (!$payload || empty($payload->email)) {
        send_json('wrong_token', 401);
    }

    $currentUserEmail = $payload->email;
}

function require_admin(?string $email): void
{
    if (!$email) {
        send_json('missing_auth_header', 401);
    }
    require_once __DIR__ . '/models/user_model.php';
    if (!is_admin_email($email)) {
        send_json('forbidden', 403);
    }
}

switch ($endpoint) {
    case 'login_request':
        require __DIR__ . '/controllers/login_request.php';
        break;
    case 'login_promise':
        require __DIR__ . '/controllers/login_promise.php';
        break;
    case 'register_request':
        require __DIR__ . '/controllers/register_request.php';
        break;
    case 'register_promise':
        require __DIR__ . '/controllers/register_promise.php';
        break;
    case 'chpass_request':
        require __DIR__ . '/controllers/chpass_request.php';
        break;
    case 'chpass_promise':
        require __DIR__ . '/controllers/chpass_promise.php';
        break;
    case 'workshop_booking':
        require __DIR__ . '/controllers/workshop_booking.php';
        break;
    case 'get_workshop_sessions':
        require __DIR__ . '/controllers/get_workshop_sessions.php';
        break;
    case 'get_workshop_calendar':
        require __DIR__ . '/controllers/get_workshop_calendar.php';
        break;
    case 'workshop_waitlist_join':
        require __DIR__ . '/controllers/workshop_waitlist_join.php';
        break;
    case 'place_order':
        require __DIR__ . '/controllers/place_order.php';
        break;
    case 'contact_request':
        require __DIR__ . '/controllers/contact_request.php';
        break;
    case 'contact_guest_request':
        require __DIR__ . '/controllers/contact_guest_request.php';
        break;
    case 'get_all_products':
        require __DIR__ . '/controllers/get_all_products.php';
        break;
    case 'get_gallery_images':
        require __DIR__ . '/controllers/get_gallery_images.php';
        break;
    case 'sync_gallery_images':
        require __DIR__ . '/controllers/sync_gallery_images.php';
        break;
    case 'get_site_pages':
        require __DIR__ . '/controllers/get_site_pages.php';
        break;
    case 'get_home_page':
        require __DIR__ . '/controllers/get_home_page.php';
        break;
    case 'get_about_page':
        require __DIR__ . '/controllers/get_about_page.php';
        break;
    case 'profile_me':
        require __DIR__ . '/controllers/profile_me.php';
        break;
    case 'profile_orders':
        require __DIR__ . '/controllers/profile_orders.php';
        break;
    case 'profile_bookings':
        require __DIR__ . '/controllers/profile_bookings.php';
        break;
    case 'profile_update':
        require __DIR__ . '/controllers/profile_update.php';
        break;
    case 'profile_change_password':
        require __DIR__ . '/controllers/profile_change_password.php';
        break;

    case 'profile_contact_messages':
        require __DIR__ . '/controllers/profile_contact_messages.php';
        break;

    case 'profile_send_contact_reply':
        require __DIR__ . '/controllers/profile_send_contact_reply.php';
        break;

    case 'profile_cancel_workshop_booking':
        require __DIR__ . '/controllers/profile_cancel_workshop_booking.php';
        break;
    case 'profile_reschedule_workshop_booking':
        require __DIR__ . '/controllers/profile_reschedule_workshop_booking.php';
        break;
    case 'profile_workshop_waitlist':
        require __DIR__ . '/controllers/profile_workshop_waitlist.php';
        break;
    case 'profile_cancel_workshop_waitlist':
        require __DIR__ . '/controllers/profile_cancel_workshop_waitlist.php';
        break;

    // Admin endpoints (JWT + admin role required)
    case 'admin_me':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_me.php';
        break;
    case 'admin_get_products':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_products.php';
        break;
    case 'admin_create_product':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_create_product.php';
        break;
    case 'admin_update_product':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_product.php';
        break;
    case 'admin_delete_product':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_product.php';
        break;
    case 'admin_get_gallery_images':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_gallery_images.php';
        break;
    case 'admin_update_gallery':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_gallery.php';
        break;
    case 'admin_delete_gallery_image':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_gallery_image.php';
        break;
    case 'admin_upload_gallery_images':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_upload_gallery_images.php';
        break;
    case 'admin_get_workshop_sessions':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_workshop_sessions.php';
        break;
    case 'admin_create_workshop_session':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_create_workshop_session.php';
        break;
    case 'admin_update_workshop_session':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_workshop_session.php';
        break;
    case 'admin_delete_workshop_session':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_workshop_session.php';
        break;
    case 'admin_get_orders':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_orders.php';
        break;
    case 'admin_get_contact_messages':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_contact_messages.php';
        break;
    case 'admin_delete_contact_message':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_contact_message.php';
        break;
    case 'admin_reply_contact_message':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_reply_contact_message.php';
        break;
    case 'admin_update_order_status':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_order_status.php';
        break;
    case 'admin_get_workshop_bookings':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_workshop_bookings.php';
        break;
    case 'admin_update_workshop_booking':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_workshop_booking.php';
        break;
    case 'admin_delete_workshop_booking':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_workshop_booking.php';
        break;
    case 'admin_create_workshop_booking':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_create_workshop_booking.php';
        break;
    case 'admin_update_session_booking_status':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_session_booking_status.php';
        break;
    case 'admin_delete_session_booking':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_delete_session_booking.php';
        break;
    case 'admin_get_site_pages':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_get_site_pages.php';
        break;
    case 'admin_update_site_pages':
        require_admin($currentUserEmail);
        require __DIR__ . '/controllers/admin_update_site_pages.php';
        break;
    default:
        send_json('not_found', 404);
}
