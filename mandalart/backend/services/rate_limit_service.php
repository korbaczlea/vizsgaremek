<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../models/rate_limit_model.php';

function get_request_ip(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip    = trim($parts[0]);
        if ($ip !== '') {
            return substr($ip, 0, 64);
        }
    }

    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 64);
}

function registration_is_enabled(): bool
{
    return filter_var(MANDALART_REGISTRATION_OPEN, FILTER_VALIDATE_BOOLEAN);
}

/** @return array{max: int, window_sec: int} */
function register_rate_limit_config(): array
{
    $max = (int) MANDALART_REGISTER_RATE_MAX_PER_IP;
    $win = (int) MANDALART_REGISTER_RATE_WINDOW_SEC;
    if ($max < 1) {
        $max = 1;
    }
    if ($win < 60) {
        $win = 60;
    }

    return ['max' => $max, 'window_sec' => $win];
}

function assert_register_allowed_or_exit(): void
{
    if (!registration_is_enabled()) {
        send_json('registration_disabled', 403);
    }
    $ip  = get_request_ip();
    $cfg = register_rate_limit_config();
    $n   = rate_limit_count_recent('register', $ip, $cfg['window_sec']);
    if ($n >= $cfg['max']) {
        send_json('rate_limited', 429);
    }
    rate_limit_record_hit('register', $ip);
}
