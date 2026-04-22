<?php

require_once __DIR__ . '/../models/gallery_model.php';

$rows = gallery_list_images(true);

$images = array_map(
    static function (array $r): array {
        return [
            'id'    => (int) $r['id'],
            'title' => $r['title'] ?? null,
            'src'   => '/gallery_images/' . $r['filename'],
        ];
    },
    $rows
);

send_json('success', 200, ['images' => $images]);

