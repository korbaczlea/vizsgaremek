<?php

require_once __DIR__ . '/../models/contact_model.php';

$rows = admin_list_contact_messages();
send_json('success', 200, ['messages' => $rows]);
