<?php

require_once __DIR__ . '/../models/workshop_booking_model.php';

$rows = admin_list_workshop_bookings();
send_json('success', 200, ['bookings' => $rows]);

