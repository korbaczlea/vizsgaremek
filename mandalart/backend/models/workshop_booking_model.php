<?php

require_once __DIR__ . '/../config.php';

/**
 * Egyszerű workshop foglalások tárolása.
 *
 * Kapacitás: 1 időponthoz (booking_date + booking_time) maximum 5 foglalás tartozik.
 *
 * FONTOS: a 5-ös kapacitás miatt ne legyen UNIQUE korlát a (booking_date, booking_time) páron.
 *
 * Ha már megvan a tábla UNIQUE kulccsal, akkor futtasd:
 *   ALTER TABLE workshop_bookings DROP INDEX uniq_slot;
 *
 * CREATE TABLE workshop_bookings (
 *   id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
 *   booking_date DATE NOT NULL,
 *   booking_time VARCHAR(5) NOT NULL,
 *   first_name VARCHAR(100) NOT NULL,
 *   last_name VARCHAR(100) NOT NULL,
 *   email VARCHAR(150) NOT NULL,
 *   phone VARCHAR(50) NOT NULL,
 *   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *   PRIMARY KEY (id)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 */

function get_booking_count(string $date, string $time): int
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) 
         FROM workshop_bookings 
         WHERE booking_date = :d AND booking_time = :t'
    );
    $stmt->execute([':d' => $date, ':t' => $time]);

    return (int) $stmt->fetchColumn();
}

function is_slot_full(string $date, string $time, int $capacity = 5): bool
{
    $count = get_booking_count($date, $time);
    return $count >= $capacity;
}

function create_workshop_booking(
    string $date,
    string $time,
    string $firstName,
    string $lastName,
    string $email,
    string $phone
): bool {
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO workshop_bookings
         (booking_date, booking_time, first_name, last_name, email, phone)
         VALUES (:d, :t, :fn, :ln, :email, :phone)'
    );

    try {
        return $stmt->execute([
            ':d'     => $date,
            ':t'     => $time,
            ':fn'    => $firstName,
            ':ln'    => $lastName,
            ':email' => $email,
            ':phone' => $phone,
        ]);
    } catch (PDOException $e) {
        // Ha mégis van UNIQUE (booking_date, booking_time), akkor duplikációt kapunk:
        // tekintsük úgy, hogy a slot betelt.
        if ($e->getCode() === '23000') {
            return false;
        }
        throw $e;
    }
}

function admin_list_workshop_bookings(): array
{
    $pdo = get_db();
    $stmt = $pdo->query(
        'SELECT
            id,
            booking_date,
            booking_time,
            first_name,
            last_name,
            email,
            phone,
            created_at
         FROM workshop_bookings
         ORDER BY booking_date ASC, booking_time ASC, id DESC'
    );

    return $stmt->fetchAll() ?: [];
}

function get_booking_count_excluding_id(string $date, string $time, int $excludeId): int
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM workshop_bookings
         WHERE booking_date = :d AND booking_time = :t AND id <> :id'
    );
    $stmt->execute([':d' => $date, ':t' => $time, ':id' => $excludeId]);
    return (int) $stmt->fetchColumn();
}

function admin_update_workshop_booking_slot(int $id, string $newDate, string $newTime, int $capacity = 5): bool
{
    // Capacity ellenőrzés: a saját foglalás ne számítson bele
    $count = get_booking_count_excluding_id($newDate, $newTime, $id);
    if ($count >= $capacity) {
        return false;
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'UPDATE workshop_bookings
         SET booking_date = :d, booking_time = :t
         WHERE id = :id'
    );

    return $stmt->execute([':d' => $newDate, ':t' => $newTime, ':id' => $id]);
}

function admin_delete_workshop_booking(int $id): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM workshop_bookings WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function admin_create_workshop_booking(
    string $date,
    string $time,
    string $firstName,
    string $lastName,
    string $email,
    string $phone
): bool {
    // Kapacitás ellenőrzés
    if (is_slot_full($date, $time, 5)) {
        return false;
    }

    return create_workshop_booking($date, $time, $firstName, $lastName, $email, $phone);
}

