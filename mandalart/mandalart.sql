
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `admin_list_contact_messages_proc` ()   BEGIN
    SELECT id, first_name, last_name, email, subject, message, created_at
    FROM contact_messages
    ORDER BY created_at DESC, id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `admin_list_orders_proc` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `create_contact_message_proc` (IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_subject` VARCHAR(255), IN `p_message` TEXT)   BEGIN
    INSERT INTO contact_messages (first_name, last_name, email, subject, message)
    VALUES (p_first_name, p_last_name, p_email, p_subject, p_message);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `gallery_list_images_proc` ()   BEGIN
    SELECT id, filename, title, sort_order, created_at
    FROM gallery_images
    ORDER BY sort_order ASC, id ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_all_products_proc` ()   BEGIN
    SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_workshop_sessions_next3weeks_proc` (IN `p_from` DATETIME, IN `p_to` DATETIME)   BEGIN
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
END$$

DELIMITER ;



CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `guest_name` varchar(200) DEFAULT NULL,
  `guest_email` varchar(150) DEFAULT NULL,
  `guest_phone` varchar(50) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','attended') NOT NULL DEFAULT 'pending',
  `num_participants` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `bookings` (`id`, `user_id`, `session_id`, `guest_name`, `guest_email`, `guest_phone`, `status`, `num_participants`, `total_price`, `created_at`) VALUES
(3, 4, 2, 'Daniel Nemeth', 'daninemeth26@gmail.com', '+36307473300', 'pending', 1, 0.00, '2026-04-01 19:57:38'),
(4, 6, 2, 'Pista Eros', 'eros@gmail.com', '312312312', 'pending', 1, 0.00, '2026-04-01 20:11:46'),
(10, 4, 4, 'Daniel Nemeth', 'daninemeth26@gmail.com', '+36307473300', 'cancelled', 1, 0.00, '2026-04-11 21:10:44');



CREATE TABLE `carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','checked_out','cancelled') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `carts` (`id`, `user_id`, `total_price`, `status`, `created_at`, `updated_at`) VALUES
(3, 4, 100000.00, 'active', '2026-04-01 19:58:14', NULL),
(4, 6, 200000.00, 'active', '2026-04-01 20:12:05', NULL);



CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_per_unit` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `price_per_unit`, `line_total`) VALUES
(3, 3, 1, 2, 50000.00, 100000.00),
(4, 4, 1, 4, 50000.00, 200000.00);



CREATE TABLE `contact_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `contact_messages` (`id`, `first_name`, `last_name`, `email`, `subject`, `message`, `created_at`) VALUES
(5, 'Óra', '', 'daninemeth26@gmail.com', 'Segitség', 'asdasda', '2026-04-11 17:59:12'),
(6, 'Daniel', 'Nemeth', 'daninemeth26@gmail.com', 'Segitség', 'm', '2026-04-11 20:40:53'),
(7, 'Daniel', 'Nemeth', 'daninemeth26@gmail.com', 'Segitség', 'oijk', '2026-04-11 20:41:11');


CREATE TABLE `contact_replies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_message_id` bigint(20) UNSIGNED NOT NULL,
  `admin_email` varchar(150) NOT NULL,
  `reply_message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `contact_replies` (`id`, `contact_message_id`, `admin_email`, `reply_message`, `created_at`, `is_read`) VALUES
(7, 5, 'daninemeth26@gmail.com', 'asdasdasdasd', '2026-04-11 17:59:27', 1),
(8, 5, 'daninemeth26@gmail.com', 'Csáó', '2026-04-11 18:00:00', 1);



CREATE TABLE `contact_user_replies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_message_id` bigint(20) UNSIGNED NOT NULL,
  `user_email` varchar(150) NOT NULL,
  `reply_message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `contact_user_replies` (`id`, `contact_message_id`, `user_email`, `reply_message`, `created_at`) VALUES
(5, 5, 'daninemeth26@gmail.com', 'cső', '2026-04-11 17:59:51');



CREATE TABLE `gallery_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `filename` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `gallery_images` (`id`, `filename`, `title`, `sort_order`, `created_at`, `active`) VALUES
(1, '649258302_2094524568063000_380274164442977288_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(2, '649470995_1863031051042817_6405987227750793513_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(3, '649486281_1243338381312244_4848162390970491272_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(4, '649515623_1426565918965015_3657883528864555149_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(5, '649534024_908047152136332_5821071331719339100_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(6, '649587556_1597663641522779_5576813141914897187_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(7, '649592377_1417900542890106_8940729105793357090_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(8, '649598888_2220941725315594_7760369645744302177_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(9, '649731267_855649910865411_2524941193632485057_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(10, '649772283_1414100613271152_899958418931778459_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(11, '649780789_2238715056654833_476604266797506690_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(12, '649845605_926332563328797_4878822349081143221_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(13, '649852363_25363407480000648_1685367464170552829_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(14, '650031271_2993496320849949_1521892507762391628_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(15, '650048535_981502784542148_6573124550791091248_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(16, '650107597_927061116687571_3276149633075378091_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(17, '650114625_26282476891440570_6639040183083095248_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(18, '650393968_967347539568338_5104482648103238507_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(19, '650489583_1467739751418127_9090689871011435911_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(20, '650972709_768895592687197_664647297777294476_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(21, '650988060_1638980614051709_9168048035053153180_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(22, '651390547_897532069712374_4471730650449500969_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(23, '651698284_1341757677713059_5125986552027286006_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1),
(24, '653893135_1253859589573409_1697785164064590958_n.jpg', NULL, 0, '2026-03-25 19:02:32', 1);


CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_number` varchar(50) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `country` varchar(100) NOT NULL,
  `county` varchar(100) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `street` varchar(150) NOT NULL,
  `house_number` varchar(50) NOT NULL,
  `payment_method` enum('card','paypal','transfer','cash_on_delivery') NOT NULL,
  `order_status` enum('pending','processing','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `orders` (`id`, `user_id`, `cart_id`, `order_number`, `full_name`, `email`, `phone`, `country`, `county`, `city`, `postal_code`, `street`, `house_number`, `payment_method`, `order_status`, `total_amount`, `created_at`, `updated_at`) VALUES
(3, 4, 3, 'ORD-20260401195814-d45ace', 'Daniel Nemeth', 'daninemeth26@gmail.com', '06307473300', 'Magyarország', 'asd', 'Pécs', '7635', 'Csurgó dűlő', '29', 'cash_on_delivery', 'processing', 100000.00, '2026-04-01 19:58:14', '2026-04-01 19:58:33'),
(4, 6, 4, 'ORD-20260401201205-0f311d', 'Daniel Nemeth', 'eros@gmail.com', '06307473300', 'Magyarország', 'gsdfsd', 'Pécs', '7635', 'Csurgó dűlő', '29', 'cash_on_delivery', 'pending', 200000.00, '2026-04-01 20:12:05', NULL);



CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `line_total`) VALUES
(3, 3, 1, 'Óra', 2, 50000.00, 100000.00),
(4, 4, 1, 'Óra', 4, 50000.00, 200000.00);


CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('card','paypal','transfer') NOT NULL,
  `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_id` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `category` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `stock_quantity`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Óra', 'ra', '20cm óra', 50000.00, 50001, 'Óra', 1, '2026-03-25 19:05:52', '2026-04-02 11:31:09'),
(2, 'Mandala', 'mandala', 'Szép', 20000.00, 0, 'Óra', 1, '2026-04-02 11:15:36', '2026-04-02 11:31:16'),
(3, 'Óra', 'ra-2', '30cm', 30000.00, 20, 'Óra', 1, '2026-04-11 18:04:49', NULL),
(4, 'Mandala', 'mandala-2', '20cm', 20000.00, 20, '', 1, '2026-04-11 18:05:24', '2026-04-11 18:05:33'),
(5, 'Mandala', 'mandala-3', '30cm', 35000.00, 20, '', 1, '2026-04-11 18:06:00', NULL),
(6, 'Mandala', 'mandala-4', '20cm', 25000.00, 0, '', 1, '2026-04-11 18:06:25', NULL),
(7, 'Mandala', 'mandala-5', '40', 45000.00, 0, '', 1, '2026-04-11 18:06:48', NULL),
(8, 'Mandala', 'mandala-6', '40cm', 40000.00, 20, '', 1, '2026-04-11 18:07:11', NULL),
(9, 'Mandala', 'mandala-7', '30cm', 30000.00, 20, '', 1, '2026-04-11 18:08:23', NULL),
(10, 'Mandala', 'mandala-8', '20cm', 20000.00, 20, '', 1, '2026-04-11 18:08:50', NULL);


CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `alt_text`, `sort_order`, `created_at`) VALUES
(10, 1, '/gallery_images/649772283_1414100613271152_899958418931778459_n.jpg', NULL, 0, '2026-04-02 11:31:09'),
(11, 2, '/gallery_images/649731267_855649910865411_2524941193632485057_n.jpg', NULL, 0, '2026-04-02 11:31:16'),
(12, 3, '/gallery_images/650988060_1638980614051709_9168048035053153180_n.jpg', NULL, 0, '2026-04-11 18:04:49'),
(13, 4, '/gallery_images/650031271_2993496320849949_1521892507762391628_n.jpg', NULL, 0, '2026-04-11 18:05:33'),
(14, 5, '/gallery_images/650988060_1638980614051709_9168048035053153180_n.jpg', NULL, 0, '2026-04-11 18:06:00'),
(15, 6, '/gallery_images/649598888_2220941725315594_7760369645744302177_n.jpg', NULL, 0, '2026-04-11 18:06:25'),
(16, 7, '/gallery_images/649587556_1597663641522779_5576813141914897187_n.jpg', NULL, 0, '2026-04-11 18:06:48'),
(17, 8, '/gallery_images/649470995_1863031051042817_6405987227750793513_n.jpg', NULL, 0, '2026-04-11 18:07:11'),
(18, 9, '/gallery_images/650393968_967347539568338_5104482648103238507_n.jpg', NULL, 0, '2026-04-11 18:08:23'),
(19, 10, '/gallery_images/650048535_981502784542148_6573124550791091248_n.jpg', NULL, 0, '2026-04-11 18:08:50');


CREATE TABLE `rate_limit_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(32) NOT NULL,
  `ip` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `rate_limit_events` (`id`, `action`, `ip`, `created_at`) VALUES
(1, 'contact_guest', '::1', '2026-04-11 20:41:11');


CREATE TABLE `site_settings` (
  `k` varchar(64) NOT NULL,
  `v` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(4, 'Daniel Nemeth', 'daninemeth26@gmail.com', '$2y$10$m2VAi0Ms/V4vqCZS5IybXuiWq2XOEjkn1RJQIKYueuETdJidL2k0G', '06307473300', 'admin', 1, '2026-04-01 19:44:12', '2026-04-01 19:56:46'),
(6, 'Erős Pista', 'eros@gmail.com', '$2y$10$aDG1n9y03ezEKwGurf2TPeCTt5L8iogYUnEsmHLYsIBB/gOLsZORe', '+36306562255', 'user', 1, '2026-04-01 20:10:41', NULL);



CREATE TABLE `workshops` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 120,
  `max_participants` int(11) NOT NULL DEFAULT 20,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `workshops` (`id`, `title`, `slug`, `description`, `price`, `duration_minutes`, `max_participants`, `is_active`, `created_at`) VALUES
(1, 'Workshop', 'default-workshop', NULL, 0.00, 120, 20, 1, '2026-03-25 19:05:05');



CREATE TABLE `workshop_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `workshop_id` bigint(20) UNSIGNED NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `available_spots` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO `workshop_sessions` (`id`, `workshop_id`, `start_datetime`, `end_datetime`, `available_spots`) VALUES
(2, 1, '2026-04-04 12:00:00', '2026-04-04 18:00:00', 5),
(3, 1, '2026-04-11 10:00:00', '2026-04-11 12:00:00', 5),
(4, 1, '2026-04-18 14:00:00', '2026-04-18 16:00:00', 5),
(5, 1, '2026-04-25 10:00:00', '2026-04-25 12:00:00', 5),
(6, 1, '2026-04-11 13:00:00', '2026-04-11 15:00:00', 5);



CREATE TABLE `workshop_waitlist` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `guest_email` varchar(150) NOT NULL,
  `guest_name` varchar(200) NOT NULL,
  `guest_phone` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_session` (`session_id`);


ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carts_user` (`user_id`);


ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_cart_product` (`cart_id`,`product_id`),
  ADD KEY `fk_cart_items_product` (`product_id`);


ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_email` (`email`),
  ADD KEY `idx_contact_created_at` (`created_at`);


ALTER TABLE `contact_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_replies_message_id` (`contact_message_id`),
  ADD KEY `idx_contact_replies_is_read` (`is_read`),
  ADD KEY `idx_contact_replies_created_at` (`created_at`);


ALTER TABLE `contact_user_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_user_replies_message_id` (`contact_message_id`),
  ADD KEY `idx_contact_user_replies_created_at` (`created_at`);


ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_gallery_filename` (`filename`);


ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_orders_order_number` (`order_number`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_cart` (`cart_id`);


ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`);


ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_user` (`user_id`),
  ADD KEY `fk_payments_order` (`order_id`),
  ADD KEY `fk_payments_booking` (`booking_id`);


ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_products_slug` (`slug`);


ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product` (`product_id`);


ALTER TABLE `rate_limit_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_action_ip_time` (`action`,`ip`,`created_at`);

ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`k`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_email` (`email`);


ALTER TABLE `workshops`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_workshops_slug` (`slug`);

ALTER TABLE `workshop_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ws_workshop` (`workshop_id`);

ALTER TABLE `workshop_waitlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_waitlist_session_email` (`session_id`,`guest_email`),
  ADD KEY `idx_waitlist_session` (`session_id`),
  ADD KEY `idx_waitlist_email` (`guest_email`);

ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;


ALTER TABLE `carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `contact_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;


ALTER TABLE `contact_replies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;


ALTER TABLE `contact_user_replies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;


ALTER TABLE `gallery_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;


ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;


ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;


ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;


ALTER TABLE `rate_limit_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;


ALTER TABLE `workshops`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;


ALTER TABLE `workshop_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;


ALTER TABLE `workshop_waitlist`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_session` FOREIGN KEY (`session_id`) REFERENCES `workshop_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;


ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;


ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);


ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;


ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;


ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;


ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;


ALTER TABLE `workshop_sessions`
  ADD CONSTRAINT `fk_ws_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE;


ALTER TABLE `workshop_waitlist`
  ADD CONSTRAINT `fk_waitlist_session` FOREIGN KEY (`session_id`) REFERENCES `workshop_sessions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
