<?php

require_once __DIR__ . '/../services/site_pages_service.php';

send_json('success', 200, ['about' => about_page_get_public()]);
