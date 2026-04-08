<?php

require_once __DIR__ . '/../config.php';

/** `products.slug` is VARCHAR(160); reserve space for "-2", "-3", … suffixes. */
function admin_fit_product_slug(string $slug, int $maxLen = 160): string
{
    $slug = trim($slug);
    if ($slug === '') {
        $slug = 'product';
    }
    if (strlen($slug) <= $maxLen) {
        return $slug;
    }

    return substr($slug, 0, $maxLen);
}

function admin_slug_exists(PDO $pdo, string $slug, ?int $excludeId): bool
{
    if ($excludeId !== null) {
        $stmt = $pdo->prepare('SELECT 1 FROM products WHERE slug = :slug AND id <> :id LIMIT 1');
        $stmt->execute([':slug' => $slug, ':id' => $excludeId]);
    } else {
        $stmt = $pdo->prepare('SELECT 1 FROM products WHERE slug = :slug LIMIT 1');
        $stmt->execute([':slug' => $slug]);
    }

    return (bool) $stmt->fetchColumn();
}

function admin_make_unique_product_slug(PDO $pdo, string $baseSlug, ?int $excludeId = null): string
{
    $base = admin_fit_product_slug($baseSlug, 160);
    if (!admin_slug_exists($pdo, $base, $excludeId)) {
        return $base;
    }

    $suffix = 2;
    while ($suffix < 1000000) {
        $suffixStr = '-' . $suffix;
        $maxBase = 160 - strlen($suffixStr);
        if ($maxBase < 1) {
            $maxBase = 1;
        }
        $trimmedBase = substr($base, 0, $maxBase);
        $candidate = admin_fit_product_slug($trimmedBase . $suffixStr, 160);
        if (!admin_slug_exists($pdo, $candidate, $excludeId)) {
            return $candidate;
        }
        $suffix++;
    }

    throw new RuntimeException('Could not generate a unique product slug.');
}

function admin_list_products(): array
{
    $pdo = get_db();
    $stmt = $pdo->query(
        'SELECT
            p.id,
            p.name,
            p.slug,
            p.description,
            p.price,
            p.stock_quantity,
            p.category,
            (SELECT pi.image_path
             FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.sort_order ASC, pi.id ASC
             LIMIT 1) AS image_url,
            p.is_active,
            p.created_at,
            p.updated_at
         FROM products p
         ORDER BY p.id DESC'
    );
    return $stmt->fetchAll() ?: [];
}

function admin_create_product(array $p): int
{
    $pdo = get_db();
    $pdo->beginTransaction();
    try {
        $uniqueSlug = admin_make_unique_product_slug($pdo, (string) ($p['slug'] ?? 'product'));

        $stmt = $pdo->prepare(
            'INSERT INTO products (name, slug, description, price, stock_quantity, category, is_active, created_at)
             VALUES (:name, :slug, :description, :price, :stock_quantity, :category, :is_active, NOW())'
        );
        $stmt->execute([
            ':name'           => $p['name'],
            ':slug'           => $uniqueSlug,
            ':description'    => $p['description'],
            ':price'          => $p['price'],
            ':stock_quantity' => $p['stock_quantity'],
            ':category'       => $p['category'],
            ':is_active'      => $p['is_active'],
        ]);

        $productId = (int) $pdo->lastInsertId();

        $imageUrl = trim((string) ($p['image_url'] ?? ''));
        if (strlen($imageUrl) > 255) {
            $imageUrl = substr($imageUrl, 0, 255);
        }
        if ($imageUrl !== '') {
            $stmtImg = $pdo->prepare(
                'INSERT INTO product_images (product_id, image_path, alt_text, sort_order, created_at)
                 VALUES (:product_id, :image_path, :alt_text, :sort_order, NOW())'
            );
            $stmtImg->execute([
                ':product_id' => $productId,
                ':image_path' => $imageUrl,
                ':alt_text'   => null,
                ':sort_order' => 0,
            ]);
        }

        $pdo->commit();
        return $productId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function admin_update_product(int $id, array $p): bool
{
    $pdo = get_db();
    $pdo->beginTransaction();

    try {
        $uniqueSlug = admin_make_unique_product_slug($pdo, (string) ($p['slug'] ?? 'product'), $id);

        $stmt = $pdo->prepare(
            'UPDATE products
             SET name=:name,
                 slug=:slug,
                 description=:description,
                 price=:price,
                 stock_quantity=:stock_quantity,
                 category=:category,
                 is_active=:is_active,
                 updated_at=NOW()
             WHERE id=:id'
        );

        $ok = $stmt->execute([
            ':id'             => $id,
            ':name'           => $p['name'],
            ':slug'           => $uniqueSlug,
            ':description'    => $p['description'],
            ':price'          => $p['price'],
            ':stock_quantity' => $p['stock_quantity'],
            ':category'       => $p['category'],
            ':is_active'      => $p['is_active'],
        ]);

        $imageUrl = trim((string) ($p['image_url'] ?? ''));

        // Egy termékhez csak 1 "fő" képet kezelünk az admin felületen: product_images törlés + beszúrás.
        $pdo->prepare('DELETE FROM product_images WHERE product_id = :id')
            ->execute([':id' => $id]);

        if ($imageUrl !== '') {
            $stmtImg = $pdo->prepare(
                'INSERT INTO product_images (product_id, image_path, alt_text, sort_order, created_at)
                 VALUES (:product_id, :image_path, :alt_text, :sort_order, NOW())'
            );
            $stmtImg->execute([
                ':product_id' => $id,
                ':image_path' => $imageUrl,
                ':alt_text'   => null,
                ':sort_order' => 0,
            ]);
        }

        $pdo->commit();
        return $ok;
    } catch (Throwable $e) {
        $pdo->rollBack();
        return false;
    }
}

function admin_delete_product(int $id): bool
{
    $pdo = get_db();
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

