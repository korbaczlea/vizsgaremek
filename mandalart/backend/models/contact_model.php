<?php

require_once __DIR__ . '/../config.php';

function ensure_contact_messages_table(): void
{
    $pdo = get_db();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS contact_messages (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            subject VARCHAR(255) DEFAULT NULL,
            message TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_contact_email (email),
            KEY idx_contact_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function contact_get_message_row(int $id): ?array
{
    ensure_contact_messages_table();
    if ($id <= 0) {
        return null;
    }
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, email, subject
         FROM contact_messages
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function create_contact_message(
    string $firstName,
    string $lastName,
    string $email,
    ?string $subject,
    string $message
): bool {
    ensure_contact_messages_table();

    $pdo = get_db();
    try {
        $stmt = $pdo->prepare('CALL create_contact_message_proc(:first_name, :last_name, :email, :subject, :message)');
        $ok = $stmt->execute([
            ':first_name' => $firstName,
            ':last_name'  => $lastName,
            ':email'      => $email,
            ':subject'    => $subject,
            ':message'    => $message,
        ]);
        while ($stmt->nextRowset()) {
            // consume extra result sets if any
        }
        return $ok;
    } catch (Throwable $e) {
        $stmt = $pdo->prepare(
            'INSERT INTO contact_messages (first_name, last_name, email, subject, message)
             VALUES (:first_name, :last_name, :email, :subject, :message)'
        );
        return $stmt->execute([
            ':first_name' => $firstName,
            ':last_name'  => $lastName,
            ':email'      => $email,
            ':subject'    => $subject,
            ':message'    => $message,
        ]);
    }
}

function admin_list_contact_messages(): array
{
    // Admin UI needs conversation history, not just the initial contact message.
    return admin_list_contact_conversations_with_replies();
}

function admin_delete_contact_conversation(int $contactMessageId): bool
{
    ensure_contact_messages_table();
    ensure_contact_replies_table();
    ensure_contact_user_replies_table();

    if ($contactMessageId <= 0) return false;

    $pdo = get_db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM contact_replies WHERE contact_message_id = :id')
            ->execute([':id' => $contactMessageId]);

        $pdo->prepare('DELETE FROM contact_user_replies WHERE contact_message_id = :id')
            ->execute([':id' => $contactMessageId]);

        $stmt = $pdo->prepare('DELETE FROM contact_messages WHERE id = :id');
        $ok = $stmt->execute([':id' => $contactMessageId]);

        $pdo->commit();
        return $ok;
    } catch (Throwable $e) {
        $pdo->rollBack();
        return false;
    }
}

function ensure_contact_replies_table(): void
{
    $pdo = get_db();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS contact_replies (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            contact_message_id BIGINT UNSIGNED NOT NULL,
            admin_email VARCHAR(150) NOT NULL,
            reply_message TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY idx_contact_replies_message_id (contact_message_id),
            KEY idx_contact_replies_is_read (is_read),
            KEY idx_contact_replies_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function admin_add_contact_reply(int $contactMessageId, string $adminEmail, string $replyMessage): bool
{
    ensure_contact_replies_table();

    $replyMessage = trim($replyMessage);
    $len = function (string $s): int {
        return function_exists('mb_strlen') ? (int) mb_strlen($s, 'UTF-8') : (int) strlen($s);
    };
    if ($contactMessageId <= 0 || $replyMessage === '' || trim($adminEmail) === '') {
        return false;
    }
    if ($len($replyMessage) > 300) {
        return false;
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO contact_replies (contact_message_id, admin_email, reply_message, is_read, created_at)
         VALUES (:contact_message_id, :admin_email, :reply_message, 0, NOW())'
    );
    return $stmt->execute([
        ':contact_message_id' => $contactMessageId,
        ':admin_email' => $adminEmail,
        ':reply_message' => $replyMessage,
    ]);
}

function ensure_contact_user_replies_table(): void
{
    $pdo = get_db();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS contact_user_replies (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            contact_message_id BIGINT UNSIGNED NOT NULL,
            user_email VARCHAR(150) NOT NULL,
            reply_message TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_contact_user_replies_message_id (contact_message_id),
            KEY idx_contact_user_replies_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function user_add_contact_reply(int $contactMessageId, string $userEmail, string $replyMessage): bool
{
    ensure_contact_user_replies_table();

    $replyMessage = trim($replyMessage);
    $userEmail = trim($userEmail);
    if ($contactMessageId <= 0 || $replyMessage === '' || $userEmail === '') return false;
    $len = function (string $s): int {
        return function_exists('mb_strlen') ? (int) mb_strlen($s, 'UTF-8') : (int) strlen($s);
    };
    if ($len($replyMessage) > 300) return false;

    $pdo = get_db();

    // Verify ownership: user can only reply to their own contact message email.
    $stmtCheck = $pdo->prepare('SELECT id FROM contact_messages WHERE id = :id AND email = :email LIMIT 1');
    $stmtCheck->execute([':id' => $contactMessageId, ':email' => $userEmail]);
    $row = $stmtCheck->fetch();
    if (!$row) return false;

    $stmt = $pdo->prepare(
        'INSERT INTO contact_user_replies (contact_message_id, user_email, reply_message, created_at)
         VALUES (:contact_message_id, :user_email, :reply_message, NOW())'
    );
    return $stmt->execute([
        ':contact_message_id' => $contactMessageId,
        ':user_email' => $userEmail,
        ':reply_message' => $replyMessage,
    ]);
}

function profile_get_contact_conversations(string $email, bool $markRead = true): array
{
    ensure_contact_messages_table();
    ensure_contact_replies_table();
    ensure_contact_user_replies_table();

    $pdo = get_db();

    // Compute unread count BEFORE marking read.
    $stmtUnread = $pdo->prepare(
        'SELECT COUNT(*) AS cnt
         FROM contact_replies cr
         JOIN contact_messages cm ON cm.id = cr.contact_message_id
         WHERE cm.email = :email AND cr.is_read = 0'
    );
    $stmtUnread->execute([':email' => $email]);
    $rowUnread = $stmtUnread->fetch();
    $unreadCount = (int) ($rowUnread['cnt'] ?? 0);

    // Fetch all base messages for this email.
    $stmtMsgs = $pdo->prepare(
        'SELECT id, first_name, last_name, subject, message, created_at
         FROM contact_messages
         WHERE email = :email
         ORDER BY created_at DESC, id DESC'
    );
    $stmtMsgs->execute([':email' => $email]);
    $messages = $stmtMsgs->fetchAll() ?: [];

    $conversations = [];
    foreach ($messages as $m) {
        $conversations[(int) $m['id']] = [
            'id' => (int) $m['id'],
            'first_name' => $m['first_name'] ?? '',
            'last_name' => $m['last_name'] ?? '',
            'subject' => $m['subject'] ?? null,
            'message' => $m['message'] ?? '',
            'created_at' => $m['created_at'] ?? null,
            'replies' => [],
        ];
    }

    if (count($conversations) === 0) {
        return ['unread_count' => $unreadCount, 'conversations' => []];
    }

    $stmtReplies = $pdo->prepare(
        'SELECT cr.id, cr.contact_message_id, cr.admin_email, cr.reply_message, cr.created_at, cr.is_read
         FROM contact_replies cr
         JOIN contact_messages cm ON cm.id = cr.contact_message_id
         WHERE cm.email = :email
         ORDER BY cr.created_at ASC, cr.id ASC'
    );
    $stmtReplies->execute([':email' => $email]);
    $replies = $stmtReplies->fetchAll() ?: [];

    foreach ($replies as $r) {
        $cid = (int) ($r['contact_message_id'] ?? 0);
        if (!isset($conversations[$cid])) continue;
        $conversations[$cid]['replies'][] = [
            'id' => (int) ($r['id'] ?? 0),
            'sender_type' => 'support',
            'admin_email' => $r['admin_email'] ?? '',
            'reply_message' => $r['reply_message'] ?? '',
            'created_at' => $r['created_at'] ?? null,
            'is_read' => (int) ($r['is_read'] ?? 0),
        ];
    }

    // Fetch user replies and merge.
    $stmtUserReplies = $pdo->prepare(
        'SELECT ur.id, ur.contact_message_id, ur.user_email, ur.reply_message, ur.created_at
         FROM contact_user_replies ur
         JOIN contact_messages cm ON cm.id = ur.contact_message_id
         WHERE cm.email = :email
         ORDER BY ur.created_at ASC, ur.id ASC'
    );
    $stmtUserReplies->execute([':email' => $email]);
    $userReplies = $stmtUserReplies->fetchAll() ?: [];
    foreach ($userReplies as $r) {
        $cid = (int) ($r['contact_message_id'] ?? 0);
        if (!isset($conversations[$cid])) continue;
        $conversations[$cid]['replies'][] = [
            'id' => (int) ($r['id'] ?? 0),
            'sender_type' => 'user',
            'user_email' => $r['user_email'] ?? '',
            'reply_message' => $r['reply_message'] ?? '',
            'created_at' => $r['created_at'] ?? null,
        ];
    }

    // Mark all replies as read once the user loads their profile.
    if ($markRead) {
        $pdo->prepare(
            'UPDATE contact_replies cr
             JOIN contact_messages cm ON cm.id = cr.contact_message_id
             SET cr.is_read = 1
             WHERE cm.email = :email AND cr.is_read = 0'
        )->execute([':email' => $email]);
    }

    // Return in desired order (newest conversations first).
    $ordered = [];
    foreach ($messages as $m) {
        $cid = (int) $m['id'];
        if (isset($conversations[$cid])) $ordered[] = $conversations[$cid];
    }

    // Ensure replies are chronological inside each conversation.
    foreach ($ordered as &$c) {
        if (!isset($c['replies']) || !is_array($c['replies'])) continue;
        usort($c['replies'], static function (array $a, array $b): int {
            $ta = $a['created_at'] ?? null;
            $tb = $b['created_at'] ?? null;
            // created_at is DATETIME string - lexical compare works for ISO-like format.
            if ($ta === $tb) return ((int)($a['id'] ?? 0)) <=> ((int)($b['id'] ?? 0));
            return ($ta ?? '') <=> ($tb ?? '');
        });
    }
    unset($c);

    return ['unread_count' => $unreadCount, 'conversations' => $ordered];
}

function admin_list_contact_conversations_with_replies(): array
{
    ensure_contact_messages_table();
    ensure_contact_replies_table();
    ensure_contact_user_replies_table();

    $pdo = get_db();

    // Base messages
    $stmtMsgs = $pdo->query(
        'SELECT id, first_name, last_name, email, subject, message, created_at
         FROM contact_messages
         ORDER BY created_at DESC, id DESC'
    );
    $messages = $stmtMsgs->fetchAll() ?: [];
    if (count($messages) === 0) return [];

    $ids = array_map(static fn($m) => (int)$m['id'], $messages);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    // Support replies (admin)
    $stmtSupport = $pdo->prepare(
        "SELECT cr.id, cr.contact_message_id, cr.admin_email, cr.reply_message, cr.created_at, cr.is_read
         FROM contact_replies cr
         WHERE cr.contact_message_id IN ($placeholders)
         ORDER BY cr.created_at ASC, cr.id ASC"
    );
    $stmtSupport->execute($ids);
    $supportReplies = $stmtSupport->fetchAll() ?: [];

    // User replies
    $stmtUser = $pdo->prepare(
        "SELECT ur.id, ur.contact_message_id, ur.user_email, ur.reply_message, ur.created_at
         FROM contact_user_replies ur
         WHERE ur.contact_message_id IN ($placeholders)
         ORDER BY ur.created_at ASC, ur.id ASC"
    );
    $stmtUser->execute($ids);
    $userReplies = $stmtUser->fetchAll() ?: [];

    $map = [];
    foreach ($messages as $m) {
        $mid = (int) $m['id'];
        $map[$mid] = $m;
        $map[$mid]['replies'] = [];
    }

    foreach ($supportReplies as $r) {
        $cid = (int) ($r['contact_message_id'] ?? 0);
        if (!isset($map[$cid])) continue;
        $map[$cid]['replies'][] = [
            'id' => (int) ($r['id'] ?? 0),
            'sender_type' => 'support',
            'admin_email' => $r['admin_email'] ?? '',
            'reply_message' => $r['reply_message'] ?? '',
            'created_at' => $r['created_at'] ?? null,
            'is_read' => (int) ($r['is_read'] ?? 0),
        ];
    }

    foreach ($userReplies as $r) {
        $cid = (int) ($r['contact_message_id'] ?? 0);
        if (!isset($map[$cid])) continue;
        $map[$cid]['replies'][] = [
            'id' => (int) ($r['id'] ?? 0),
            'sender_type' => 'user',
            'user_email' => $r['user_email'] ?? '',
            'reply_message' => $r['reply_message'] ?? '',
            'created_at' => $r['created_at'] ?? null,
        ];
    }

    // Sort replies chronologically within each conversation.
    foreach ($map as &$row) {
        if (!isset($row['replies']) || !is_array($row['replies'])) continue;
        usort($row['replies'], static function (array $a, array $b): int {
            $ta = $a['created_at'] ?? null;
            $tb = $b['created_at'] ?? null;
            if ($ta === $tb) return ((int)($a['id'] ?? 0)) <=> ((int)($b['id'] ?? 0));
            return ($ta ?? '') <=> ($tb ?? '');
        });
    }
    unset($row);

    // Keep original base message ordering.
    $out = [];
    foreach ($messages as $m) {
        $out[] = $map[(int)$m['id']];
    }

    return $out;
}

