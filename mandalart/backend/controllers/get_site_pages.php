<?php

require_once __DIR__ . '/../services/rate_limit_service.php';

send_json('success', 200, [
    'registration_open' => registration_is_enabled(),
]);
