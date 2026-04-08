<?php

require_once __DIR__ . '/site_settings_model.php';

function rate_limit_count_recent(string $action, string $ip, int $windowSeconds): int
{
    site_settings_ensure_tables();
    $pdo   = get_db();
    $since = (new DateTimeImmutable('now'))
        ->modify('-' . max(1, $windowSeconds) . ' seconds')
        ->format('Y-m-d H:i:s');
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM rate_limit_events
         WHERE action = :a AND ip = :ip AND created_at >= :since'
    );
    $stmt->execute([':a' => $action, ':ip' => $ip, ':since' => $since]);

    return (int) $stmt->fetchColumn();
}

function rate_limit_record_hit(string $action, string $ip): void
{
    site_settings_ensure_tables();
    $pdo = get_db();
    $stmt = $pdo->prepare('INSERT INTO rate_limit_events (action, ip) VALUES (:a, :ip)');
    $stmt->execute([':a' => $action, ':ip' => $ip]);

    if (random_int(1, 80) === 1) {
        $pdo->exec('DELETE FROM rate_limit_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');
    }
}
