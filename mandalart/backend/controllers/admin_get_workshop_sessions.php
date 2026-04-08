<?php

require_once __DIR__ . '/../models/workshop_session_model.php';

$rows = admin_list_workshop_sessions_with_bookings();

send_json('success', 200, ['sessions' => $rows]);

