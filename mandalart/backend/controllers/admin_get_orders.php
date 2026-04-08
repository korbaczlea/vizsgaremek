<?php

require_once __DIR__ . '/../models/order_model.php';

$rows = admin_list_orders();
send_json('success', 200, ['orders' => $rows]);

