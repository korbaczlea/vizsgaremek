<?php

require_once __DIR__ . '/../services/site_pages_service.php';

$payload = site_pages_get_admin();
send_json('success', 200, $payload);
