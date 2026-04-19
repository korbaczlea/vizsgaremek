<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/user_model.php';

function create_order(array $customer, array $items, float $total, ?string $currentUserEmail = null): bool
{
    $pdo = get_db();

    try {
        $pdo->beginTransaction();

        $guestUserId = 1;
        if ($currentUserEmail) {
            $currentUser = get_user_by_email($currentUserEmail);
            if ($currentUser && !empty($currentUser['id'])) {
                $guestUserId = (int) $currentUser['id'];
            }
        }

        $stmtCart = $pdo->prepare(
            'INSERT INTO carts (user_id, total_price, status, created_at)
             VALUES (:user_id, :total_price, :status, NOW())'
        );
        $stmtCart->execute([
            ':user_id' => $guestUserId,
            ':total_price' => $total,
            ':status' => 'active',
        ]);

        $cartId = (int) $pdo->lastInsertId();

        $stmtItem = $pdo->prepare(
            'INSERT INTO cart_items
             (cart_id, product_id, quantity, price_per_unit, line_total)
             VALUES (:cart_id, :product_id, :quantity, :price_per_unit, :line_total)'
        );

        foreach ($items as $item) {
            $productId = (int) ($item['id'] ?? 0);
            $qty       = (int) ($item['qty'] ?? 1);
            $price     = (float) ($item['price'] ?? 0);

            if ($productId <= 0 || $qty <= 0) {
                continue;
            }

            $lineTotal = $qty * $price;
            $stmtItem->execute([
                ':cart_id'        => $cartId,
                ':product_id'     => $productId,
                ':quantity'       => $qty,
                ':price_per_unit' => $price,
                ':line_total'     => $lineTotal,
            ]);
        }

        $fullName = trim((string) ($customer['fullName'] ?? ''));
        $email = trim((string) ($customer['email'] ?? 'guest@example.com'));
        if ($currentUserEmail) {
            $email = $currentUserEmail;
        }
        if ($email === '') {
            $email = 'guest@example.com';
        }

        $paymentRaw = strtolower(trim((string) ($customer['payment'] ?? 'cash on delivery')));
        $paymentMethod =
            str_contains($paymentRaw, 'cash') ? 'cash_on_delivery' :
            (str_contains($paymentRaw, 'paypal') ? 'paypal' :
            (str_contains($paymentRaw, 'transfer') ? 'transfer' : 'cash_on_delivery'));

        $orderNumber = 'ORD-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);

        $stmtOrder = $pdo->prepare(
            'INSERT INTO orders
             (user_id, cart_id, order_number, full_name, email, phone, country, county, city, postal_code,
              street, house_number, payment_method, order_status, total_amount, created_at)
             VALUES
             (:user_id, :cart_id, :order_number, :full_name, :email, :phone, :country, :county, :city, :postal_code,
              :street, :house_number, :payment_method, :order_status, :total_amount, NOW())'
        );

        $stmtOrder->execute([
            ':user_id' => $guestUserId,
            ':cart_id' => $cartId,
            ':order_number' => $orderNumber,
            ':full_name' => $fullName,
            ':email' => $email,
            ':phone' => (string) ($customer['phone'] ?? ''),
            ':country' => (string) ($customer['country'] ?? ''),
            ':county' => (string) ($customer['county'] ?? ''),
            ':city' => (string) ($customer['city'] ?? ''),
            ':postal_code' => (string) ($customer['postalCode'] ?? ''),
            ':street' => (string) ($customer['street'] ?? ''),
            ':house_number' => (string) ($customer['houseNumber'] ?? ''),
            ':payment_method' => $paymentMethod,
            ':order_status' => 'pending',
            ':total_amount' => $total,
        ]);

        $orderId = (int) $pdo->lastInsertId();

        $stmtOrderItem = $pdo->prepare(
            'INSERT INTO order_items
             (order_id, product_id, product_name, quantity, unit_price, line_total)
             VALUES
             (:order_id, :product_id, :product_name, :quantity, :unit_price, :line_total)'
        );

        foreach ($items as $item) {
            $productId = (int) ($item['id'] ?? 0);
            $qty = (int) ($item['qty'] ?? 1);
            $price = (float) ($item['price'] ?? 0);
            $name = (string) ($item['name'] ?? 'Product');

            if ($qty <= 0 || $price < 0) {
                continue;
            }

            $stmtOrderItem->execute([
                ':order_id' => $orderId,
                ':product_id' => $productId > 0 ? $productId : null,
                ':product_name' => $name,
                ':quantity' => $qty,
                ':unit_price' => $price,
                ':line_total' => $qty * $price,
            ]);
        }

        $pdo->commit();
        return true;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return false;
    }
}

function admin_list_orders(): array
{
    $pdo = get_db();
    try {
        $stmt = $pdo->query('CALL admin_list_orders_proc()');
        $rows = $stmt->fetchAll() ?: [];
        while ($stmt->nextRowset()) {}
        return $rows;
    } catch (Throwable $e) {
        $stmt = $pdo->query(
            'SELECT
                o.id,
                o.order_number,
                o.full_name,
                o.email,
                o.phone,
                o.country,
                o.county,
                o.city,
                o.postal_code,
                o.payment_method,
                o.order_status,
                o.total_amount,
                o.created_at,
                o.user_id
             FROM orders o
             ORDER BY o.created_at DESC, o.id DESC'
        );
        return $stmt->fetchAll() ?: [];
    }
}

function get_order_for_notification(int $orderId): ?array
{
    if ($orderId <= 0) {
        return null;
    }

    $pdo = get_db();
    $stmt = $pdo->prepare(
        'SELECT id, order_number, email, full_name, order_status
         FROM orders
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $orderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function admin_update_order_status(int $orderId, string $status): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'UPDATE orders
         SET order_status = :status
         WHERE id = :id'
    );

    return $stmt->execute([
        ':status' => $status,
        ':id' => $orderId,
    ]);
}


