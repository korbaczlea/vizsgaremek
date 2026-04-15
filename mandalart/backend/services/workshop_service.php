<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

function process_workshop_booking(array $data): array
{
    $sessionId = (int) ($data['session_id'] ?? 0);
    $firstName = trim((string) ($data['first_name'] ?? ''));
    $lastName  = trim((string) ($data['last_name'] ?? ''));
    $email     = trim((string) ($data['email'] ?? ''));
    $phone     = trim((string) ($data['phone'] ?? ''));

    if ($sessionId <= 0 || $firstName === '' || $lastName === '' || $email === '' || $phone === '') {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $session = get_workshop_session_by_id($sessionId);
    if (!$session) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $available = (int) $session['available_spots'];
    if ($available <= 0) {
        return ['status' => 'slot_already_booked', 'code' => 409];
    }

    $currentCount = count_session_bookings($sessionId);
    if ($currentCount >= $available) {
        return ['status' => 'slot_already_booked', 'code' => 409];
    }

    try {
        $userId = create_or_get_user_by_booking($firstName, $lastName, $email, $phone);
    } catch (Throwable $e) {
        return ['status' => 'server_error', 'code' => 500];
    }

    $pdo = get_db();
    try {
        $guestName = trim($firstName . ' ' . $lastName);
        $stmt = $pdo->prepare(
            'INSERT INTO bookings (user_id, session_id, guest_name, guest_email, guest_phone, status, num_participants, total_price, created_at)
             VALUES (:user_id, :session_id, :guest_name, :guest_email, :guest_phone, :status, :num_participants, :total_price, NOW())'
        );
        $stmt->execute([
            ':user_id'          => $userId,
            ':session_id'      => $sessionId,
            ':guest_name'      => $guestName,
            ':guest_email'     => $email,
            ':guest_phone'     => $phone,
            ':status'          => 'pending',
            ':num_participants'=> 1,
            ':total_price'     => 0.00,
        ]);
    } catch (Throwable $e) {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}

