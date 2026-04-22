<?php

require_once __DIR__ . '/../models/gallery_model.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json('malformed_request', 400);
}

$filesField = $_FILES['files'] ?? $_FILES['files[]'] ?? null;
if (!$filesField) {
    send_json('malformed_request', 400, ['message' => 'Missing files field']);
}

$publicImagesDir = __DIR__ . '/../public/gallery_images';
if (!is_dir($publicImagesDir)) {
    if (!mkdir($publicImagesDir, 0775, true) && !is_dir($publicImagesDir)) {
        send_json('server_error', 500, ['message' => 'public/gallery_images directory not found']);
    }
}

$realPublicImagesDir = realpath($publicImagesDir);
if (!$realPublicImagesDir || !is_dir($realPublicImagesDir)) {
    send_json('server_error', 500, ['message' => 'public/gallery_images directory not found']);
}

$allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];

if (is_array($filesField['name'] ?? null)) {
    $names = $filesField['name'];
    $tmpNames = $filesField['tmp_name'];
    $errors = $filesField['error'];
} else {
    $names = [$filesField['name'] ?? ''];
    $tmpNames = [$filesField['tmp_name'] ?? ''];
    $errors = [$filesField['error'] ?? UPLOAD_ERR_NO_FILE];
}

$uploaded = [];
$skipped = [];

for ($i = 0; $i < count($names); $i++) {
    $origName = (string) ($names[$i] ?? '');
    $tmpPath = (string) ($tmpNames[$i] ?? '');
    $err = (int) ($errors[$i] ?? UPLOAD_ERR_NO_FILE);

    if ($err !== UPLOAD_ERR_OK) {
        $skipped[] = ['filename' => $origName, 'reason' => 'upload_error', 'error' => $err];
        continue;
    }

    if ($origName === '' || $tmpPath === '' || !is_uploaded_file($tmpPath)) {
        $skipped[] = ['filename' => $origName, 'reason' => 'invalid_upload'];
        continue;
    }

    $baseName = basename($origName);
    $ext = strtolower(pathinfo($baseName, PATHINFO_EXTENSION));
    if ($ext === '' || !in_array($ext, $allowed, true)) {
        $skipped[] = ['filename' => $origName, 'reason' => 'invalid_extension'];
        continue;
    }

    $nameNoExt = pathinfo($baseName, PATHINFO_FILENAME);
    $nameNoExt = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $nameNoExt);
    if (!$nameNoExt) $nameNoExt = 'image';

    $targetName = $nameNoExt . '.' . $ext;
    $destPath = $realPublicImagesDir . DIRECTORY_SEPARATOR . $targetName;
    if (file_exists($destPath)) {
        $targetName = $nameNoExt . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destPath = $realPublicImagesDir . DIRECTORY_SEPARATOR . $targetName;
    }

    if (!move_uploaded_file($tmpPath, $destPath)) {
        $skipped[] = ['filename' => $origName, 'reason' => 'move_failed'];
        continue;
    }

    gallery_upsert_filename($targetName, null);
    $uploaded[] = $targetName;
}

$status = count($uploaded) ? 'success' : 'server_error';
$code = count($uploaded) ? 200 : 500;

send_json($status, $code, [
    'uploaded' => $uploaded,
    'skipped' => $skipped,
    'uploaded_count' => count($uploaded),
    'skipped_count' => count($skipped),
]);

