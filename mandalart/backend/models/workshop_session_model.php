<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/user_model.php';

function get_workshop_sessions_next3weeks(): array
{
    $pdo = get_db();

    $from = new DateTime('today midnight');
    $to = clone $from;
    $to->modify('+21 days');

    try {
        $stmt = $pdo->prepare('CALL get_workshop_sessions_next3weeks_proc(:from_dt, :to_dt)');
        $stmt->execute([
            ':from_dt' => $from->format('Y-m-d H:i:s'),
            ':to_dt'   => $to->format('Y-m-d H:i:s'),
        ]);
        $rows = $stmt->fetchAll() ?: [];
        while ($stmt->nextRowset()) {
            // consume extra result sets if any
        }
        return $rows;
    } catch (Throwable $e) {
        $stmt = $pdo->prepare(
            'SELECT
                ws.id,
                ws.workshop_id,
                ws.start_datetime,
                ws.end_datetime,
                ws.available_spots,
                w.title AS workshop_title
             FROM workshop_sessions ws
             JOIN workshops w ON w.id = ws.workshop_id
             WHERE w.is_active = 1
               AND ws.start_datetime >= :from
               AND ws.start_datetime < :to
               AND WEEKDAY(ws.start_datetime) = 5
             ORDER BY ws.start_datetime ASC'
        );
        $stmt->execute([
            ':from' => $from->format('Y-m-d H:i:s'),
            ':to'   => $to->format('Y-m-d H:i:s'),
        ]);
        return $stmt->fetchAll() ?: [];
    }
}

function get_workshop_session_by_id(int $id): ?array
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT
            ws.id,
            ws.workshop_id,
            ws.start_datetime,
            ws.end_datetime,
            ws.available_spots,
            w.title AS workshop_title
         FROM workshop_sessions ws
         JOIN workshops w ON w.id = ws.workshop_id
         WHERE ws.id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function count_session_bookings(int $sessionId): int
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM bookings b
         WHERE b.session_id = :sid
           AND b.status <> :cancelled'
    );
    $stmt->execute([
        ':sid' => $sessionId,
        ':cancelled' => 'cancelled',
    ]);
    return (int) $stmt->fetchColumn();
}

function create_or_get_user_by_booking(string $firstName, string $lastName, string $email, string $phone): int
{
    $user = get_user_by_email($email);
    if ($user) {
        if (!empty($phone) && empty($user['phone'])) {
            update_phone($email, $phone);
        }
        return (int) $user['id'];
    }

    $name = trim($firstName . ' ' . $lastName);
    if ($name === '') {
        $name = $email;
    }

    // Temp password for hash storage; real user can reset later.
    $tempPass = bin2hex(random_bytes(16));
    $hash = password_hash($tempPass, PASSWORD_BCRYPT);

    $ok = create_user($name, $email, $hash, $phone);
    if (!$ok) {
        throw new Exception('Failed to create user');
    }

    // Note: get_user_by_email again to retrieve id (simpler than lastInsertId with shared PDO).
    $user2 = get_user_by_email($email);
    if (!$user2) {
        throw new Exception('User not found after create');
    }
    return (int) $user2['id'];
}

function admin_list_workshop_sessions_with_bookings(): array
{
    $sessions = get_workshop_sessions_next3weeks();
    $pdo = get_db();

    $result = [];
    foreach ($sessions as $s) {
        $sid = (int) $s['id'];
        $stmt = $pdo->prepare(
            'SELECT
                b.id AS booking_id,
                b.status AS booking_status,
                b.num_participants,
                b.created_at,
                COALESCE(u.name, b.guest_name) AS user_name,
                COALESCE(u.email, b.guest_email) AS user_email,
                COALESCE(u.phone, b.guest_phone) AS user_phone
             FROM bookings b
             LEFT JOIN users u ON u.id = b.user_id
             WHERE b.session_id = :sid
               AND b.status <> :cancelled
             ORDER BY b.created_at DESC, b.id DESC'
        );
        $stmt->execute([':sid' => $sid, ':cancelled' => 'cancelled']);
        $bookings = $stmt->fetchAll() ?: [];

        $result[] = [
            'id' => $sid,
            'workshop_id' => (int) $s['workshop_id'],
            'workshop_title' => $s['workshop_title'],
            'start_datetime' => $s['start_datetime'],
            'end_datetime' => $s['end_datetime'],
            'booking_date' => substr((string) $s['start_datetime'], 0, 10),
            'start_time' => substr((string) $s['start_datetime'], 11, 5),
            'end_time' => substr((string) $s['end_datetime'], 11, 5),
            'available_spots' => (int) $s['available_spots'],
            'bookings' => $bookings,
        ];
    }

    return $result;
}

function admin_create_workshop_session(array $data): int
{
    $pdo = get_db();
    $pdo->beginTransaction();
    try {
        $workshopId = (int) ($data['workshop_id'] ?? 0);
        if ($workshopId <= 0) {
            $stmt = $pdo->query('SELECT id FROM workshops WHERE is_active = 1 ORDER BY id ASC LIMIT 1');
            $workshopId = (int) ($stmt->fetchColumn() ?: 0);
        }

        // If there are no workshops in the DB yet, create a default one
        // so workshop_sessions FK constraints can be satisfied.
        if ($workshopId <= 0) {
            $stmt = $pdo->query("SELECT id FROM workshops WHERE slug = 'default-workshop' LIMIT 1");
            $workshopId = (int) ($stmt->fetchColumn() ?: 0);
            if ($workshopId <= 0) {
                $stmt = $pdo->prepare(
                    'INSERT INTO workshops
                        (title, slug, description, price, duration_minutes, max_participants, is_active)
                     VALUES
                        (:title, :slug, :description, :price, :duration_minutes, :max_participants, :is_active)'
                );
                $stmt->execute([
                    ':title' => 'Workshop',
                    ':slug' => 'default-workshop',
                    ':description' => null,
                    ':price' => 0.00,
                    ':duration_minutes' => 120,
                    ':max_participants' => 20,
                    ':is_active' => 1,
                ]);
                $workshopId = (int) $pdo->lastInsertId();
            }
        }

        $start = $data['start_datetime'];
        $end = $data['end_datetime'];
        $available = (int) ($data['available_spots'] ?? 0);

        if ($start === '' || $end === '' || $available <= 0) {
            throw new Exception('Invalid input');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO workshop_sessions
                (workshop_id, start_datetime, end_datetime, available_spots)
             VALUES
                (:workshop_id, :start_datetime, :end_datetime, :available_spots)'
        );
        $stmt->execute([
            ':workshop_id' => $workshopId,
            ':start_datetime' => $start,
            ':end_datetime' => $end,
            ':available_spots' => $available,
        ]);

        $newId = (int) $pdo->lastInsertId();
        $pdo->commit();
        return $newId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function admin_update_workshop_session(int $id, array $data): bool
{
    $pdo = get_db();

    $start = $data['start_datetime'] ?? null;
    $end = $data['end_datetime'] ?? null;
    $available = array_key_exists('available_spots', $data) ? (int) $data['available_spots'] : null;

    if (!$start || !$end || $available === null || $available <= 0) {
        return false;
    }

    $currentBookings = count_session_bookings($id);
    if ($currentBookings > $available) {
        return false;
    }

    $stmt = $pdo->prepare(
        'UPDATE workshop_sessions
         SET start_datetime = :start_datetime,
             end_datetime = :end_datetime,
             available_spots = :available_spots
         WHERE id = :id'
    );
    return $stmt->execute([
        ':start_datetime' => $start,
        ':end_datetime' => $end,
        ':available_spots' => $available,
        ':id' => $id,
    ]);
}

function admin_delete_workshop_session(int $id): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM workshop_sessions WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

