<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

$days = (int) MANDALART_WORKSHOP_CALENDAR_DAYS;
$raw = get_workshop_sessions_next_days($days);

$result = [];
foreach ($raw as $s) {
    $id = (int) $s['id'];
    $cap = (int) $s['available_spots'];
    $booked = count_session_bookings($id);
    $remaining = max(0, $cap - $booked);

    $result[] = [
        'id' => $id,
        'workshop_id' => (int) $s['workshop_id'],
        'workshop_title' => $s['workshop_title'],
        'booking_date' => substr((string) $s['start_datetime'], 0, 10),
        'start_time' => substr((string) $s['start_datetime'], 11, 5),
        'end_time' => substr((string) $s['end_datetime'], 11, 5),
        'start_datetime' => $s['start_datetime'],
        'end_datetime' => $s['end_datetime'],
        'capacity' => $cap,
        'booked' => $booked,
        'remaining' => $remaining,
        'is_full' => $remaining <= 0,
    ];
}

send_json('success', 200, [
    'sessions' => $result,
    'change_deadline_hours' => (int) MANDALART_WORKSHOP_CHANGE_DEADLINE_HOURS,
    'calendar_days' => $days,
]);
