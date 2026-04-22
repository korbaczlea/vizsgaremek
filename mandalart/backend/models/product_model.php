<?php

require_once __DIR__ . '/../config.php';

function get_all_products(): array
{
    $pdo = get_db();
    try {
        $stmt = $pdo->query('CALL get_all_products_proc()');
        $rows = $stmt->fetchAll() ?: [];
        while ($stmt->nextRowset()) {}
        return $rows;
    } catch (Throwable $e) {
        $stmt = $pdo->query(
            'SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.category,
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
        return $stmt->fetchAll() ?: [];
    }
}

