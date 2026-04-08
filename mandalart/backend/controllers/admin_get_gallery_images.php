<?php

require_once __DIR__ . '/../models/gallery_model.php';

$rows = gallery_list_images(false);
send_json('success', 200, ['images' => $rows]);

