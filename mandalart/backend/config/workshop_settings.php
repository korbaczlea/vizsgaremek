<?php

if (!defined('MANDALART_WORKSHOP_CHANGE_DEADLINE_HOURS')) {
    define('MANDALART_WORKSHOP_CHANGE_DEADLINE_HOURS', 48);
}

if (!defined('MANDALART_WORKSHOP_CALENDAR_DAYS')) {
    define('MANDALART_WORKSHOP_CALENDAR_DAYS', 56);
}

function workshop_hours_until_start(?string $startDatetime): float
{
    if ($startDatetime === null || $startDatetime === '') {
        return -1.0;
    }
    $start = new DateTimeImmutable($startDatetime);
    $now = new DateTimeImmutable('now');
    return ($start->getTimestamp() - $now->getTimestamp()) / 3600.0;
}

function workshop_user_may_change_booking(string $status, ?string $startDatetime): bool
{
    if ($status === 'cancelled') {
        return false;
    }
    return workshop_hours_until_start($startDatetime) >= (float) MANDALART_WORKSHOP_CHANGE_DEADLINE_HOURS;
}
