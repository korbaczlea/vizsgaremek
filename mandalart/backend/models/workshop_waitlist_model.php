<?php

require_once __DIR__ . '/../config.php';

function ensure_workshop_waitlist_table(): void
{
    $pdo = get_db();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS workshop_waitlist (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            session_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED DEFAULT NULL,
            guest_email VARCHAR(150) NOT NULL,
            guest_name VARCHAR(200) NOT NULL,
            guest_phone VARCHAR(50) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_waitlist_session_email (session_id, guest_email),
            KEY idx_waitlist_session (session_id),
            KEY idx_waitlist_email (guest_email),
            CONSTRAINT fk_waitlist_session FOREIGN KEY (session_id) REFERENCES workshop_sessions (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function waitlist_add_row(
    int $sessionId,
    string $email,
    string $guestName,
    string $phone,
    ?int $userId
): string {
    ensure_workshop_waitlist_table();
    $pdo = get_db();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO workshop_waitlist (session_id, user_id, guest_email, guest_name, guest_phone, created_at)
             VALUES (:sid, :uid, :email, :name, :phone, NOW())'
        );
        $stmt->execute([
            ':sid' => $sessionId,
            ':uid' => $userId,
            ':email' => $email,
            ':name' => $guestName,
            ':phone' => $phone,
        ]);
        return 'success';
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? 0) === 1062) {
            return 'already_on_waitlist';
        }
        return 'server_error';
    } catch (Throwable $e) {
        return 'server_error';
    }
}

function waitlist_remove_by_id_for_email(int $waitlistId, string $email): bool
{
    ensure_workshop_waitlist_table();
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'DELETE FROM workshop_waitlist WHERE id = :id AND guest_email = :email'
    );
    return $stmt->execute([':id' => $waitlistId, ':email' => $email]);
}

function waitlist_list_for_email(string $email): array
{
    ensure_workshop_waitlist_table();
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT
            w.id,
            w.session_id,
            w.guest_email,
            w.guest_name,
            w.guest_phone,
            w.created_at,
            ws.start_datetime,
            ws.end_datetime,
            wt.title AS workshop_title
         FROM workshop_waitlist w
         JOIN workshop_sessions ws ON ws.id = w.session_id
         JOIN workshops wt ON wt.id = ws.workshop_id
         WHERE w.guest_email = :email
         ORDER BY ws.start_datetime ASC, w.id ASC'
    );
    $stmt->execute([':email' => $email]);
    return $stmt->fetchAll() ?: [];
}

function waitlist_pop_first_locked(PDO $pdo, int $sessionId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT * FROM workshop_waitlist WHERE session_id = :sid ORDER BY id ASC LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([':sid' => $sessionId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function waitlist_delete_by_id(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('DELETE FROM workshop_waitlist WHERE id = :id');
    $stmt->execute([':id' => $id]);
}
