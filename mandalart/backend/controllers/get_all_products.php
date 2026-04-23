<?php

require_once __DIR__ . '/../models/product_model.php';

$products = get_all_products();

$normalized = array_map(
    static function (array $row): array {
        return [
            'id'              => (int) $row['id'],
            'name'            => $row['name'],
            'description'     => $row['description'] ?? '',
            'price'           => (float) $row['price'],
            'category'        => $row['category'] ?? null,
            'currency'        => 'HUF',
            'image'           => $row['image_url'] ?? null,
            'stock_quantity'  => isset($row['stock_quantity']) ? (int) $row['stock_quantity'] : 0,
        ];
    },
    $products
);

send_json('success', 200, ['products' => $normalized]);

