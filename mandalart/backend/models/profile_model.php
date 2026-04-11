<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/user_model.php';

function profile_get_user(string $email): ?array
{
    $u = get_user_by_email($email);
    if (!$u) {
        return null;
    }

    return [
        'id' => (int) $u['id'],
        'name' => $u['name'] ?? '',
        'email' => $u['email'] ?? '',
        'phone' => $u['phone'] ?? '',
        'role' => $u['role'] ?? 'user',
    ];
}

function profile_update_user(string $currentEmail, string $newEmail, string $name, string $phone): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'UPDATE users
         SET email = :new_email, name = :name, phone = :phone
         WHERE email = :current_email'
    );
    return $stmt->execute([
        ':new_email' => $newEmail,
        ':name' => $name,
        ':phone' => $phone,
        ':current_email' => $currentEmail,
    ]);
}

function profile_list_orders(string $email): array
{
    $pdo = get_db();
    $user = get_user_by_email($email);
    $userId = $user ? (int) $user['id'] : 0;

    $stmt = $pdo->prepare(
        'SELECT
            o.id,
            o.order_number,
            o.full_name,
            o.email,
            o.phone,
            o.country,
            o.county,
            o.city,
            o.postal_code,
            o.street,
            o.house_number,
            o.payment_method,
            o.order_status,
            o.total_amount,
            o.created_at
         FROM orders o
         WHERE o.email = :email OR (:uid > 0 AND o.user_id = :uid)
         ORDER BY o.created_at DESC, o.id DESC'
    );
    $stmt->execute([
        ':email' => $email,
        ':uid' => $userId,
    ]);

    return $stmt->fetchAll() ?: [];
}

function profile_list_bookings(string $email): array
{
    $pdo = get_db();
    $user = get_user_by_email($email);
    $userId = $user ? (int) $user['id'] : 0;

    $stmt = $pdo->prepare(
        'SELECT
            b.id,
            b.session_id,
            b.status,
            b.num_participants,
            b.total_price,
            b.created_at,
            ws.start_datetime,
            ws.end_datetime,
            w.title AS workshop_title
         FROM bookings b
         JOIN workshop_sessions ws ON ws.id = b.session_id
         JOIN workshops w ON w.id = ws.workshop_id
         WHERE b.guest_email = :email OR (:uid > 0 AND b.user_id = :uid)
         ORDER BY ws.start_datetime DESC, b.id DESC'
    );
    $stmt->execute([
        ':email' => $email,
        ':uid' => $userId,
    ]);

    $rows = $stmt->fetchAll() ?: [];
    require_once __DIR__ . '/../config/workshop_settings.php';
    foreach ($rows as &$row) {
        $row['session_id'] = (int) ($row['session_id'] ?? 0);
        $row['can_modify'] = workshop_user_may_change_booking(
            (string) ($row['status'] ?? ''),
            isset($row['start_datetime']) ? (string) $row['start_datetime'] : null
        );
    }
    unset($row);

    return $rows;
}
