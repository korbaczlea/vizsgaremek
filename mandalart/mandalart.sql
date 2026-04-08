-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 02. 12:23
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `mandalart`
--

--
-- Tárolt eljárások nem részei ennek a dumpnak (duplikáció elkerülése).
-- Telepítés: futtasd a `backend/sql/stored_procedures.sql` fájlt az adatbázison.
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `bookings`
--

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

--
-- A tábla adatainak kiíratása `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `session_id`, `guest_name`, `guest_email`, `guest_phone`, `status`, `num_participants`, `total_price`, `created_at`) VALUES
(3, 4, 2, 'Daniel Nemeth', 'daninemeth26@gmail.com', '+36307473300', 'pending', 1, 0.00, '2026-04-01 19:57:38'),
(4, 6, 2, 'Pista Eros', 'eros@gmail.com', '312312312', 'pending', 1, 0.00, '2026-04-01 20:11:46');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','checked_out','cancelled') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `total_price`, `status`, `created_at`, `updated_at`) VALUES
(3, 4, 100000.00, 'active', '2026-04-01 19:58:14', NULL),
(4, 6, 200000.00, 'active', '2026-04-01 20:12:05', NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_per_unit` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `price_per_unit`, `line_total`) VALUES
(3, 3, 1, 2, 50000.00, 100000.00),
(4, 4, 1, 4, 50000.00, 200000.00);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `first_name`, `last_name`, `email`, `subject`, `message`, `created_at`) VALUES
(3, 'Pist', '', 'eros@gmail.com', 'Help', 'Kéene segitség', '2026-04-02 12:12:00');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `contact_replies`
--

CREATE TABLE `contact_replies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_message_id` bigint(20) UNSIGNED NOT NULL,
  `admin_email` varchar(150) NOT NULL,
  `reply_message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `contact_replies`
--

INSERT INTO `contact_replies` (`id`, `contact_message_id`, `admin_email`, `reply_message`, `created_at`, `is_read`) VALUES
(4, 3, 'daninemeth26@gmail.com', 'Szia miben segithetek?', '2026-04-02 12:13:37', 1),
(5, 3, 'daninemeth26@gmail.com', 'éklékl', '2026-04-02 12:19:25', 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `contact_user_replies`
--

CREATE TABLE `contact_user_replies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_message_id` bigint(20) UNSIGNED NOT NULL,
  `user_email` varchar(150) NOT NULL,
  `reply_message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `gallery_images`
--

CREATE TABLE `gallery_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `filename` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `gallery_images`
--

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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `orders`
--

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

--
-- A tábla adatainak kiíratása `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `cart_id`, `order_number`, `full_name`, `email`, `phone`, `country`, `county`, `city`, `postal_code`, `street`, `house_number`, `payment_method`, `order_status`, `total_amount`, `created_at`, `updated_at`) VALUES
(3, 4, 3, 'ORD-20260401195814-d45ace', 'Daniel Nemeth', 'daninemeth26@gmail.com', '06307473300', 'Magyarország', 'asd', 'Pécs', '7635', 'Csurgó dűlő', '29', 'cash_on_delivery', 'processing', 100000.00, '2026-04-01 19:58:14', '2026-04-01 19:58:33'),
(4, 6, 4, 'ORD-20260401201205-0f311d', 'Daniel Nemeth', 'eros@gmail.com', '06307473300', 'Magyarország', 'gsdfsd', 'Pécs', '7635', 'Csurgó dűlő', '29', 'cash_on_delivery', 'pending', 200000.00, '2026-04-01 20:12:05', NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `line_total`) VALUES
(3, 3, 1, 'Óra', 2, 50000.00, 100000.00),
(4, 4, 1, 'Óra', 4, 50000.00, 200000.00);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `payments`
--

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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `products`
--

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

--
-- A tábla adatainak kiíratása `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `stock_quantity`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Óra', 'ra', '20cm óra', 50000.00, 50001, 'Óra', 1, '2026-03-25 19:05:52', '2026-04-02 11:31:09'),
(2, 'Mandala', 'mandala', 'Szép', 20000.00, 0, 'Óra', 1, '2026-04-02 11:15:36', '2026-04-02 11:31:16');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `alt_text`, `sort_order`, `created_at`) VALUES
(10, 1, '/gallery_images/649772283_1414100613271152_899958418931778459_n.jpg', NULL, 0, '2026-04-02 11:31:09'),
(11, 2, '/gallery_images/649731267_855649910865411_2524941193632485057_n.jpg', NULL, 0, '2026-04-02 11:31:16');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `rate_limit_events`
--

CREATE TABLE `rate_limit_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(32) NOT NULL,
  `ip` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `site_settings`
--

CREATE TABLE `site_settings` (
  `k` varchar(64) NOT NULL,
  `v` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

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

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(4, 'Daniel Nemeth', 'daninemeth26@gmail.com', '$2y$10$m2VAi0Ms/V4vqCZS5IybXuiWq2XOEjkn1RJQIKYueuETdJidL2k0G', '06307473300', 'admin', 1, '2026-04-01 19:44:12', '2026-04-01 19:56:46'),
(6, 'Erős Pista', 'eros@gmail.com', '$2y$10$aDG1n9y03ezEKwGurf2TPeCTt5L8iogYUnEsmHLYsIBB/gOLsZORe', '+36306562255', 'user', 1, '2026-04-01 20:10:41', NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `workshops`
--

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

--
-- A tábla adatainak kiíratása `workshops`
--

INSERT INTO `workshops` (`id`, `title`, `slug`, `description`, `price`, `duration_minutes`, `max_participants`, `is_active`, `created_at`) VALUES
(1, 'Workshop', 'default-workshop', NULL, 0.00, 120, 20, 1, '2026-03-25 19:05:05');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `workshop_sessions`
--

CREATE TABLE `workshop_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `workshop_id` bigint(20) UNSIGNED NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `available_spots` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `workshop_sessions`
--

INSERT INTO `workshop_sessions` (`id`, `workshop_id`, `start_datetime`, `end_datetime`, `available_spots`) VALUES
(2, 1, '2026-04-04 12:00:00', '2026-04-04 18:00:00', 5);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_session` (`session_id`);

--
-- A tábla indexei `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carts_user` (`user_id`);

--
-- A tábla indexei `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_cart_product` (`cart_id`,`product_id`),
  ADD KEY `fk_cart_items_product` (`product_id`);

--
-- A tábla indexei `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_email` (`email`),
  ADD KEY `idx_contact_created_at` (`created_at`);

--
-- A tábla indexei `contact_replies`
--
ALTER TABLE `contact_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_replies_message_id` (`contact_message_id`),
  ADD KEY `idx_contact_replies_is_read` (`is_read`),
  ADD KEY `idx_contact_replies_created_at` (`created_at`);

--
-- A tábla indexei `contact_user_replies`
--
ALTER TABLE `contact_user_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_user_replies_message_id` (`contact_message_id`),
  ADD KEY `idx_contact_user_replies_created_at` (`created_at`);

--
-- A tábla indexei `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_gallery_filename` (`filename`);

--
-- A tábla indexei `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_orders_order_number` (`order_number`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_cart` (`cart_id`);

--
-- A tábla indexei `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`);

--
-- A tábla indexei `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_user` (`user_id`),
  ADD KEY `fk_payments_order` (`order_id`),
  ADD KEY `fk_payments_booking` (`booking_id`);

--
-- A tábla indexei `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_products_slug` (`slug`);

--
-- A tábla indexei `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product` (`product_id`);

--
-- A tábla indexei `rate_limit_events`
--
ALTER TABLE `rate_limit_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_action_ip_time` (`action`,`ip`,`created_at`);

--
-- A tábla indexei `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`k`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_email` (`email`);

--
-- A tábla indexei `workshops`
--
ALTER TABLE `workshops`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_workshops_slug` (`slug`);

--
-- A tábla indexei `workshop_sessions`
--
ALTER TABLE `workshop_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ws_workshop` (`workshop_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `contact_replies`
--
ALTER TABLE `contact_replies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `contact_user_replies`
--
ALTER TABLE `contact_user_replies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `gallery_images`
--
ALTER TABLE `gallery_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT a táblához `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT a táblához `rate_limit_events`
--
ALTER TABLE `rate_limit_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT a táblához `workshops`
--
ALTER TABLE `workshops`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT a táblához `workshop_sessions`
--
ALTER TABLE `workshop_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_session` FOREIGN KEY (`session_id`) REFERENCES `workshop_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Megkötések a táblához `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Megkötések a táblához `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `workshop_sessions`
--
ALTER TABLE `workshop_sessions`
  ADD CONSTRAINT `fk_ws_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


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
