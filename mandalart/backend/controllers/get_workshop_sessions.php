<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

$sessions = array_values(array_filter(
    get_workshop_sessions_next3weeks(),
    static function (array $s): bool {
        return ((int) ($s['available_spots'] ?? 0)) > 0;
    }
));

// Frontend elvárás: id, booking_date, start_time, end_time, available_spots, workshop_title
$result = array_map(
    static function (array $s): array {
        return [
            'id' => (int) $s['id'],
            'workshop_id' => (int) $s['workshop_id'],
            'workshop_title' => $s['workshop_title'],
            'booking_date' => substr((string) $s['start_datetime'], 0, 10),
            'start_time' => substr((string) $s['start_datetime'], 11, 5),
            'end_time' => substr((string) $s['end_datetime'], 11, 5),
            'available_spots' => (int) $s['available_spots'],
        ];
    },
    $sessions
);

send_json('success', 200, ['sessions' => $result]);

