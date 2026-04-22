<?php

require_once __DIR__ . '/../config.php';

/** Older DB installs may have get_all_products_proc without stock_quantity — merge from products. */
function enrich_products_with_stock_if_missing(PDO $pdo, array $rows): array
{
    if (!$rows) {
        return $rows;
    }
    if (array_key_exists('stock_quantity', $rows[0])) {
        return $rows;
    }
    $ids = array_values(array_filter(array_map('intval', array_column($rows, 'id'))));
    if (!$ids) {
        return $rows;
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, stock_quantity FROM products WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $stockMap = [];
    while ($r = $stmt->fetch()) {
        $stockMap[(int) $r['id']] = (int) $r['stock_quantity'];
    }
    foreach ($rows as &$row) {
        $id = (int) ($row['id'] ?? 0);
        $row['stock_quantity'] = $stockMap[$id] ?? 0;
    }
    unset($row);

    return $rows;
}

function get_all_products(): array
{
    $pdo = get_db();
    try {
        $stmt = $pdo->query('CALL get_all_products_proc()');
        $rows = $stmt->fetchAll() ?: [];
        while ($stmt->nextRowset()) {}

        return enrich_products_with_stock_if_missing($pdo, $rows);
    } catch (Throwable $e) {
        $stmt = $pdo->query(
            'SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.category,
                p.stock_quantity,
                (SELECT pi.image_path
                 FROM product_images pi
                 WHERE pi.product_id = p.id
                 ORDER BY pi.sort_order ASC, pi.id ASC
                 LIMIT 1) AS image_url,
                p.is_active
             FROM products p
             WHERE p.is_active = 1
             ORDER BY p.id ASC'
        );

        return enrich_products_with_stock_if_missing($pdo, $stmt->fetchAll() ?: []);
    }
}

