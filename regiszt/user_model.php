<?php

require_once __DIR__ . '/../config.php';

function get_user_by_email(string $email): ?array
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT id, name, email, password_hash, phone, role
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch();

    return $row ?: null;
}

function create_user(string $name, string $email, string $password_hash): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, phone, role)
         VALUES (:name, :email, :password_hash, :phone, :role)'
    );

    return $stmt->execute([
        ':name'          => $name,
        ':email'         => $email,
        ':password_hash' => $password_hash,
        ':phone'         => null,
        ':role'          => 'user',
    ]);
}

function update_password(string $email, string $password_hash): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'UPDATE users
         SET password_hash = :password_hash
         WHERE email = :email'
    );

    return $stmt->execute([
        ':password_hash' => $password_hash,
        ':email'         => $email,
    ]);
}

function is_admin_email(string $email): bool
{
    $user = get_user_by_email($email);
    if (!$user) {
        return false;
    }
    return ($user['role'] ?? 'user') === 'admin';
}
