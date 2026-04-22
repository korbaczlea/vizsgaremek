<?php

require_once __DIR__ . '/../models/product_model.php';

$products = get_all_products();

$normalized = array_map(
    static function (array $row): array {
        $image = $row['image_url'] ?? null;
        if (is_string($image) && str_starts_with($image, '/gallery_images/')) {
            $image = '/public/gallery_images/' . substr($image, strlen('/gallery_images/'));
        }

        return [
            'id'          => (int) $row['id'],
            'name'        => $row['name'],
            'description' => $row['description'] ?? '',
            'price'       => (float) $row['price'],
            'currency'    => 'HUF',
            'image'       => $image,
        ];
    },
    $products
);

send_json('success', 200, ['products' => $normalized]);

