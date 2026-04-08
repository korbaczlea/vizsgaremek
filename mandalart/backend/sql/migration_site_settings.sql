-- Run once in phpMyAdmin or mysql CLI (database: mandalart).
-- Tables are also auto-created on first API use, but you can run this for explicit setup.

CREATE TABLE IF NOT EXISTS site_settings (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v MEDIUMTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(32) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_action_ip_time (action, ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
