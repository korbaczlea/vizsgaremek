<?php

require_once __DIR__ . '/../models/gallery_model.php';

$targetDir = __DIR__ . '/../public/gallery_images';
if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
        send_json('server_error', 500, ['message' => 'public/gallery_images directory not found']);
    }
}

$targetReal = realpath($targetDir);
if (!$targetReal || !is_dir($targetReal)) {
    send_json('server_error', 500, ['message' => 'public/gallery_images directory not found']);
}

$legacyDir = realpath(__DIR__ . '/../../public/gallery_images');
$scanDirs = [$targetReal];
if ($legacyDir && is_dir($legacyDir) && $legacyDir !== $targetReal) {
    $scanDirs[] = $legacyDir;
}

$allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
$count = 0;
$copied_from_legacy = 0;
$seen = [];

foreach ($scanDirs as $dir) {
    $files = scandir($dir);
    if ($files === false) {
        continue;
    }

    foreach ($files as $f) {
        if ($f === '.' || $f === '..' || isset($seen[$f])) {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $f;
        if (!is_file($path)) {
            continue;
        }
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            continue;
        }

        $seen[$f] = true;

        if ($dir !== $targetReal) {
            $targetPath = $targetReal . DIRECTORY_SEPARATOR . $f;
            if (!file_exists($targetPath) && @copy($path, $targetPath)) {
                $copied_from_legacy++;
            }
        }

        gallery_upsert_filename($f, null);
        $count++;
    }
}

send_json('success', 200, [
    'synced' => $count,
    'copied_from_legacy' => $copied_from_legacy,
]);

