<?php

require_once __DIR__ . '/../config.php';

function gallery_has_active_column(): bool
{
    static $hasActive = null;
    if ($hasActive !== null) return $hasActive;

    $pdo = get_db();
    $stmt = $pdo->query("SHOW COLUMNS FROM gallery_images LIKE 'active'");
    $row = $stmt ? $stmt->fetch() : false;
    $hasActive = (bool) $row;
    return $hasActive;
}

function gallery_list_images(bool $onlyActive = true): array
{
    $pdo = get_db();
    $hasActive = gallery_has_active_column();

    $where = "";
    if ($hasActive && $onlyActive) {
        $where = "WHERE active = 1";
    }

    if ($hasActive) {
        $stmt = $pdo->query(
            "SELECT id, filename, title, sort_order, created_at, active
             FROM gallery_images
             $where
             ORDER BY sort_order ASC, id ASC"
        );
    } else {
        $stmt = $pdo->query(
            "SELECT id, filename, title, sort_order, created_at
             FROM gallery_images
             ORDER BY sort_order ASC, id ASC"
        );
    }

    $rows = $stmt ? ($stmt->fetchAll() ?: []) : [];

    if (!$hasActive) {
        foreach ($rows as &$r) {
            $r['active'] = 1;
        }
        unset($r);
    }

    return $rows;
}

function gallery_upsert_filename(string $filename, ?string $title = null): void
{
    $pdo = get_db();
    $hasActive = gallery_has_active_column();

    if ($hasActive) {
        $stmt = $pdo->prepare(
            'INSERT INTO gallery_images (filename, title, active)
             VALUES (:filename, :title, 1)
             ON DUPLICATE KEY UPDATE
               title = COALESCE(gallery_images.title, VALUES(title)),
               active = 1'
        );
        $stmt->execute([
            ':filename' => $filename,
            ':title'    => $title,
        ]);
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO gallery_images (filename, title)
         VALUES (:filename, :title)
         ON DUPLICATE KEY UPDATE
           title = COALESCE(gallery_images.title, VALUES(title))'
    );
    $stmt->execute([
        ':filename' => $filename,
        ':title'    => $title,
    ]);
}

function gallery_update_image(int $id, ?string $title, ?int $sortOrder, ?int $active = null): bool
{
    $pdo = get_db();
    $hasActive = gallery_has_active_column();

    $sets = [];
    $params = [':id' => $id];

    if ($title !== null) {
        $sets[] = 'title = :title';
        $params[':title'] = $title;
    }
    if ($sortOrder !== null) {
        $sets[] = 'sort_order = :sort_order';
        $params[':sort_order'] = $sortOrder;
    }
    if ($active !== null && $hasActive) {
        $sets[] = 'active = :active';
        $params[':active'] = $active;
    }

    if (count($sets) === 0) {
        return true;
    }

    $sql = 'UPDATE gallery_images SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

function gallery_delete_image(int $id): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM gallery_images WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

function gallery_delete_images(array $ids): int
{
    $normalized = [];
    foreach ($ids as $id) {
        $n = (int) $id;
        if ($n > 0) {
            $normalized[$n] = true;
        }
    }

    $idList = array_keys($normalized);
    if (count($idList) === 0) {
        return 0;
    }

    $pdo = get_db();
    $placeholders = implode(',', array_fill(0, count($idList), '?'));
    $stmt = $pdo->prepare("DELETE FROM gallery_images WHERE id IN ($placeholders)");
    $stmt->execute($idList);
    return (int) $stmt->rowCount();
}

