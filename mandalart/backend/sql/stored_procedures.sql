USE mandalart;

DROP PROCEDURE IF EXISTS get_all_products_proc;
DROP PROCEDURE IF EXISTS gallery_list_images_proc;
DROP PROCEDURE IF EXISTS get_workshop_sessions_next3weeks_proc;
DROP PROCEDURE IF EXISTS admin_list_orders_proc;
DROP PROCEDURE IF EXISTS create_contact_message_proc;
DROP PROCEDURE IF EXISTS admin_list_contact_messages_proc;
DROP PROCEDURE IF EXISTS create_product;
DROP PROCEDURE IF EXISTS update_product;
DROP PROCEDURE IF EXISTS delete_product;
DROP PROCEDURE IF EXISTS list_products;
DROP PROCEDURE IF EXISTS get_product;
DROP PROCEDURE IF EXISTS set_product_active;
DROP PROCEDURE IF EXISTS create_gallery_image;
DROP PROCEDURE IF EXISTS update_gallery_image;
DROP PROCEDURE IF EXISTS delete_gallery_image;
DROP PROCEDURE IF EXISTS list_orders;
DROP PROCEDURE IF EXISTS update_order_status;
DROP PROCEDURE IF EXISTS list_workshop_sessions;
DROP PROCEDURE IF EXISTS create_workshop_session;
DROP PROCEDURE IF EXISTS update_workshop_session;
DROP PROCEDURE IF EXISTS delete_workshop_session;

DELIMITER //

CREATE PROCEDURE get_all_products_proc()
BEGIN
    SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.stock_quantity,
        (
            SELECT pi.image_path
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
        ) AS image_url,
        p.is_active
    FROM products p
    WHERE p.is_active = 1
    ORDER BY p.id ASC;
END //

CREATE PROCEDURE gallery_list_images_proc()
BEGIN
    SELECT id, filename, title, sort_order, created_at
    FROM gallery_images
    ORDER BY sort_order ASC, id ASC;
END //

CREATE PROCEDURE get_workshop_sessions_next3weeks_proc(IN p_from DATETIME, IN p_to DATETIME)
BEGIN
    SELECT
        ws.id,
        ws.workshop_id,
        ws.start_datetime,
        ws.end_datetime,
        ws.available_spots,
        w.title AS workshop_title
    FROM workshop_sessions ws
    JOIN workshops w ON w.id = ws.workshop_id
    WHERE w.is_active = 1
      AND ws.start_datetime >= p_from
      AND ws.start_datetime < p_to
      AND WEEKDAY(ws.start_datetime) = 5
    ORDER BY ws.start_datetime ASC;
END //

CREATE PROCEDURE admin_list_orders_proc()
BEGIN
    SELECT
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
    ORDER BY o.created_at DESC, o.id DESC;
END //

CREATE PROCEDURE create_contact_message_proc(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_subject VARCHAR(255),
    IN p_message TEXT
)
BEGIN
    INSERT INTO contact_messages (first_name, last_name, email, subject, message)
    VALUES (p_first_name, p_last_name, p_email, p_subject, p_message);
END //

CREATE PROCEDURE admin_list_contact_messages_proc()
BEGIN
    SELECT id, first_name, last_name, email, subject, message, created_at
    FROM contact_messages
    ORDER BY created_at DESC, id DESC;
END //

CREATE PROCEDURE create_product(
    IN p_name VARCHAR(150),
    IN p_slug VARCHAR(160),
    IN p_description TEXT,
    IN p_price DECIMAL(10,2),
    IN p_stock_quantity INT,
    IN p_category VARCHAR(100),
    IN p_image_url VARCHAR(255),
    IN p_is_active TINYINT(1)
)
BEGIN
    DECLARE v_product_id BIGINT UNSIGNED;

    START TRANSACTION;

    INSERT INTO products (name, slug, description, price, stock_quantity, category, is_active, created_at)
    VALUES (p_name, p_slug, p_description, p_price, p_stock_quantity, p_category, p_is_active, NOW());

    SET v_product_id = LAST_INSERT_ID();

    IF p_image_url IS NOT NULL AND TRIM(p_image_url) <> '' THEN
        INSERT INTO product_images (product_id, image_path, alt_text, sort_order, created_at)
        VALUES (v_product_id, TRIM(p_image_url), NULL, 0, NOW());
    END IF;

    COMMIT;

    SELECT v_product_id AS id;
END //

CREATE PROCEDURE update_product(
    IN p_id BIGINT UNSIGNED,
    IN p_name VARCHAR(150),
    IN p_slug VARCHAR(160),
    IN p_description TEXT,
    IN p_price DECIMAL(10,2),
    IN p_stock_quantity INT,
    IN p_category VARCHAR(100),
    IN p_image_url VARCHAR(255),
    IN p_is_active TINYINT(1)
)
BEGIN
    START TRANSACTION;

    UPDATE products
    SET name = p_name,
        slug = p_slug,
        description = p_description,
        price = p_price,
        stock_quantity = p_stock_quantity,
        category = p_category,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;

    DELETE FROM product_images WHERE product_id = p_id;

    IF p_image_url IS NOT NULL AND TRIM(p_image_url) <> '' THEN
        INSERT INTO product_images (product_id, image_path, alt_text, sort_order, created_at)
        VALUES (p_id, TRIM(p_image_url), NULL, 0, NOW());
    END IF;

    COMMIT;

    SELECT ROW_COUNT() >= 0 AS ok;
END //

CREATE PROCEDURE delete_product(IN p_id BIGINT UNSIGNED)
BEGIN
    DELETE FROM products WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE list_products()
BEGIN
    SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock_quantity,
        p.category,
        p.is_active,
        (
            SELECT pi.image_path
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
        ) AS image_url,
        p.created_at,
        p.updated_at
    FROM products p
    ORDER BY p.id DESC;
END //

CREATE PROCEDURE get_product(IN p_id BIGINT UNSIGNED)
BEGIN
    SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock_quantity,
        p.category,
        p.is_active,
        (
            SELECT pi.image_path
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
        ) AS image_url,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE p.id = p_id
    LIMIT 1;
END //

CREATE PROCEDURE set_product_active(IN p_id BIGINT UNSIGNED, IN p_is_active TINYINT(1))
BEGIN
    UPDATE products
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE create_gallery_image(
    IN p_filename VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_sort_order INT,
    IN p_active TINYINT(1)
)
BEGIN
    INSERT INTO gallery_images (filename, title, sort_order, active, created_at)
    VALUES (p_filename, p_title, p_sort_order, p_active, NOW());
    SELECT LAST_INSERT_ID() AS id;
END //

CREATE PROCEDURE update_gallery_image(
    IN p_id BIGINT UNSIGNED,
    IN p_title VARCHAR(255),
    IN p_sort_order INT,
    IN p_active TINYINT(1)
)
BEGIN
    UPDATE gallery_images
    SET title = p_title,
        sort_order = p_sort_order,
        active = p_active
    WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE delete_gallery_image(IN p_id BIGINT UNSIGNED)
BEGIN
    DELETE FROM gallery_images WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE list_orders()
BEGIN
    SELECT
        id,
        order_number,
        full_name,
        email,
        phone,
        country,
        county,
        city,
        postal_code,
        payment_method,
        order_status,
        total_amount,
        created_at,
        user_id
    FROM orders
    ORDER BY created_at DESC, id DESC;
END //

CREATE PROCEDURE update_order_status(IN p_id BIGINT UNSIGNED, IN p_order_status VARCHAR(50))
BEGIN
    UPDATE orders
    SET order_status = p_order_status
    WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE list_workshop_sessions()
BEGIN
    SELECT
        ws.id,
        ws.workshop_id,
        ws.start_datetime,
        ws.end_datetime,
        ws.available_spots,
        w.title AS workshop_title
    FROM workshop_sessions ws
    JOIN workshops w ON w.id = ws.workshop_id
    ORDER BY ws.start_datetime ASC, ws.id ASC;
END //

CREATE PROCEDURE create_workshop_session(
    IN p_workshop_id BIGINT UNSIGNED,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_available_spots INT
)
BEGIN
    INSERT INTO workshop_sessions (workshop_id, start_datetime, end_datetime, available_spots)
    VALUES (p_workshop_id, p_start_datetime, p_end_datetime, p_available_spots);
    SELECT LAST_INSERT_ID() AS id;
END //

CREATE PROCEDURE update_workshop_session(
    IN p_id BIGINT UNSIGNED,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_available_spots INT
)
BEGIN
    UPDATE workshop_sessions
    SET start_datetime = p_start_datetime,
        end_datetime = p_end_datetime,
        available_spots = p_available_spots
    WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

CREATE PROCEDURE delete_workshop_session(IN p_id BIGINT UNSIGNED)
BEGIN
    DELETE FROM workshop_sessions WHERE id = p_id;
    SELECT ROW_COUNT() > 0 AS ok;
END //

DELIMITER ;
