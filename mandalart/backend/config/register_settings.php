<?php

/**
 * Sign-up visibility and rate limiting — edit here only (not in admin UI).
 * After changing, no DB migration needed.
 */

if (!defined('MANDALART_REGISTRATION_OPEN')) {
    define('MANDALART_REGISTRATION_OPEN', true);
}

/** Max successful sign-up POSTs per IP within the window below. */
if (!defined('MANDALART_REGISTER_RATE_MAX_PER_IP')) {
    define('MANDALART_REGISTER_RATE_MAX_PER_IP', 5);
}

/** Sliding window length in seconds (min 60 enforced in code). */
if (!defined('MANDALART_REGISTER_RATE_WINDOW_SEC')) {
    define('MANDALART_REGISTER_RATE_WINDOW_SEC', 3600);
}
