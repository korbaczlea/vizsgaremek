<?php

require_once __DIR__ . '/../config/workshop_settings.php';
require_once __DIR__ . '/../models/workshop_session_model.php';
require_once __DIR__ . '/../models/workshop_waitlist_model.php';
require_once __DIR__ . '/../models/user_model.php';

/**
 * @return array<string,mixed>|null
 */
function booking_get_owned(int $bookingId, string $userEmail, int $userId): ?array
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT b.*, ws.start_datetime, ws.end_datetime
         FROM bookings b
         JOIN workshop_sessions ws ON ws.id = b.session_id
         WHERE b.id = :id
           AND b.status <> :cancelled
           AND (b.guest_email = :email OR (:uid > 0 AND b.user_id = :uid2))'
    );
    $stmt->execute([
        ':id' => $bookingId,
        ':cancelled' => 'cancelled',
        ':email' => $userEmail,
        ':uid' => $userId,
        ':uid2' => $userId,
    ]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function process_workshop_waitlist_join(array $data): array
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

    $cap = (int) $session['available_spots'];
    $booked = count_session_bookings($sessionId);
    if ($booked < $cap) {
        return ['status' => 'session_not_full', 'code' => 409];
    }

    $user = get_user_by_email($email);
    $userId = $user ? (int) $user['id'] : null;
    $guestName = trim($firstName . ' ' . $lastName);

    $rc = waitlist_add_row($sessionId, $email, $guestName, $phone, $userId);
    if ($rc === 'already_on_waitlist') {
        return ['status' => 'already_on_waitlist', 'code' => 409];
    }
    if ($rc !== 'success') {
        return ['status' => 'server_error', 'code' => 500];
    }

    return ['status' => 'success', 'code' => 200];
}

function workshop_try_promote_one_from_waitlist(int $sessionId): void
{
    $pdo = get_db();
    $pdo->beginTransaction();
    try {
        $session = get_workshop_session_by_id($sessionId);
        if (!$session) {
            $pdo->rollBack();
            return;
        }
        $cap = (int) $session['available_spots'];

        $stmtCnt = $pdo->prepare(
            'SELECT COUNT(*) FROM bookings WHERE session_id = :sid AND status <> :cancelled FOR UPDATE'
        );
        $stmtCnt->execute([':sid' => $sessionId, ':cancelled' => 'cancelled']);
        $cnt = (int) $stmtCnt->fetchColumn();
        if ($cnt >= $cap) {
            $pdo->commit();
            return;
        }

        $w = waitlist_pop_first_locked($pdo, $sessionId);
        if (!$w) {
            $pdo->commit();
            return;
        }

        $parts = preg_split('/\s+/', trim((string) $w['guest_name']), 2) ?: [];
        $fn = trim((string) ($parts[0] ?? ''));
        $ln = trim((string) ($parts[1] ?? ''));
        if ($fn === '') {
            $fn = 'Guest';
        }

        try {
            $newUserId = create_or_get_user_by_booking($fn, $ln, (string) $w['guest_email'], (string) $w['guest_phone']);
        } catch (Throwable $e) {
            waitlist_delete_by_id($pdo, (int) $w['id']);
            $pdo->commit();
            return;
        }

        $guestName = trim($fn . ' ' . $ln);
        $ins = $pdo->prepare(
            'INSERT INTO bookings (user_id, session_id, guest_name, guest_email, guest_phone, status, num_participants, total_price, created_at)
             VALUES (:user_id, :session_id, :guest_name, :guest_email, :guest_phone, :status, :num_participants, :total_price, NOW())'
        );
        $ins->execute([
            ':user_id' => $newUserId,
            ':session_id' => $sessionId,
            ':guest_name' => $guestName,
            ':guest_email' => $w['guest_email'],
            ':guest_phone' => $w['guest_phone'],
            ':status' => 'pending',
            ':num_participants' => 1,
            ':total_price' => 0.00,
        ]);

        waitlist_delete_by_id($pdo, (int) $w['id']);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
    }
}

function process_profile_cancel_workshop_booking(string $email, array $data): array
{
    $user = get_user_by_email($email);
    $userId = $user ? (int) $user['id'] : 0;
    $bookingId = (int) ($data['booking_id'] ?? 0);
    if ($bookingId <= 0) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $b = booking_get_owned($bookingId, $email, $userId);
    if (!$b) {
        return ['status' => 'not_found', 'code' => 404];
    }

    if (!workshop_user_may_change_booking((string) $b['status'], (string) $b['start_datetime'])) {
        return ['status' => 'too_late_to_change', 'code' => 403];
    }

    $sessionId = (int) $b['session_id'];
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'UPDATE bookings SET status = :st WHERE id = :id AND status <> :cancelled'
    );
    $stmt->execute([
        ':st' => 'cancelled',
        ':id' => $bookingId,
        ':cancelled' => 'cancelled',
    ]);
    if ($stmt->rowCount() === 0) {
        return ['status' => 'not_found', 'code' => 404];
    }

    workshop_try_promote_one_from_waitlist($sessionId);

    return ['status' => 'success', 'code' => 200];
}

function process_profile_reschedule_workshop_booking(string $email, array $data): array
{
    $user = get_user_by_email($email);
    $userId = $user ? (int) $user['id'] : 0;
    $bookingId = (int) ($data['booking_id'] ?? 0);
    $newSessionId = (int) ($data['new_session_id'] ?? 0);
    if ($bookingId <= 0 || $newSessionId <= 0) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $b = booking_get_owned($bookingId, $email, $userId);
    if (!$b) {
        return ['status' => 'not_found', 'code' => 404];
    }

    if (!workshop_user_may_change_booking((string) $b['status'], (string) $b['start_datetime'])) {
        return ['status' => 'too_late_to_change', 'code' => 403];
    }

    $oldSessionId = (int) $b['session_id'];
    if ($newSessionId === $oldSessionId) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    $newSession = get_workshop_session_by_id($newSessionId);
    if (!$newSession) {
        return ['status' => 'malformed_request', 'code' => 400];
    }

    if (!workshop_user_may_change_booking('pending', (string) $newSession['start_datetime'])) {
        return ['status' => 'target_session_too_soon', 'code' => 403];
    }

    $cap = (int) $newSession['available_spots'];
    $booked = count_session_bookings($newSessionId);
    if ($booked >= $cap) {
        return ['status' => 'slot_already_booked', 'code' => 409];
    }

    $pdo = get_db();
    $pdo->beginTransaction();
    try {
        $stmtCnt = $pdo->prepare(
            'SELECT COUNT(*) FROM bookings WHERE session_id = :sid AND status <> :cancelled FOR UPDATE'
        );
        $stmtCnt->execute([':sid' => $newSessionId, ':cancelled' => 'cancelled']);
        if ((int) $stmtCnt->fetchColumn() >= $cap) {
            $pdo->rollBack();
            return ['status' => 'slot_already_booked', 'code' => 409];
        }

        $stmt = $pdo->prepare('UPDATE bookings SET session_id = :nsid WHERE id = :id AND status <> :cancelled');
        $stmt->execute([
            ':nsid' => $newSessionId,
            ':id' => $bookingId,
            ':cancelled' => 'cancelled',
        ]);
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            return ['status' => 'not_found', 'code' => 404];
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        return ['status' => 'server_error', 'code' => 500];
    }

    workshop_try_promote_one_from_waitlist($oldSessionId);

    return ['status' => 'success', 'code' => 200];
}

function profile_get_workshop_waitlist(string $email): array
{
    return ['status' => 'success', 'code' => 200, 'waitlist' => waitlist_list_for_email($email)];
}

function process_profile_cancel_waitlist(string $email, array $data): array
{
    $id = (int) ($data['waitlist_id'] ?? 0);
    if ($id <= 0) {
        return ['status' => 'malformed_request', 'code' => 400];
    }
    $ok = waitlist_remove_by_id_for_email($id, $email);
    if (!$ok) {
        return ['status' => 'not_found', 'code' => 404];
    }
    return ['status' => 'success', 'code' => 200];
}
