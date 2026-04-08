<?php

require_once __DIR__ . '/../models/gallery_model.php';

// A Vite public mappája: projektgyökér/public
$publicImagesDir = realpath(__DIR__ . '/../../public/gallery_images');

if (!$publicImagesDir || !is_dir($publicImagesDir)) {
    send_json('server_error', 500, ['message' => 'public/gallery_images directory not found']);
}

$allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
$files = scandir($publicImagesDir);

if ($files === false) {
    send_json('server_error', 500);
}

$count = 0;
foreach ($files as $f) {
    if ($f === '.' || $f === '..') {
        continue;
    }
    $path = $publicImagesDir . DIRECTORY_SEPARATOR . $f;
    if (!is_file($path)) {
        continue;
    }
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) {
        continue;
    }

    gallery_upsert_filename($f, null);
    $count++;
}

send_json('success', 200, ['synced' => $count]);

