<?php

require_once __DIR__ . '/../models/admin_product_model.php';

$rows = admin_list_products();
send_json('success', 200, ['products' => $rows]);

