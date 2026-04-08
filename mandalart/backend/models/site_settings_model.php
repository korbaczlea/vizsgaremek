<?php

require_once __DIR__ . '/../config.php';

function site_settings_ensure_tables(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    $pdo = get_db();
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS site_settings (
      k VARCHAR(64) NOT NULL PRIMARY KEY,
      v MEDIUMTEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS rate_limit_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(32) NOT NULL,
      ip VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_action_ip_time (action, ip, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function site_setting_get(string $key, ?string $default = null): ?string
{
    site_settings_ensure_tables();
    $pdo  = get_db();
    $stmt = $pdo->prepare('SELECT v FROM site_settings WHERE k = :k LIMIT 1');
    $stmt->execute([':k' => $key]);
    $row = $stmt->fetch();

    return $row ? (string) $row['v'] : $default;
}

function site_setting_set(string $key, string $value): void
{
    site_settings_ensure_tables();
    $pdo  = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (k, v) VALUES (:k, :v) ON DUPLICATE KEY UPDATE v = VALUES(v)'
    );
    $stmt->execute([':k' => $key, ':v' => $value]);
}
