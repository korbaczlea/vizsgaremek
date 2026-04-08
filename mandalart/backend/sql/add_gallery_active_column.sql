-- Run on mandalart database (once)
-- Adds an "active" flag to gallery images so inactive images can be hidden.

ALTER TABLE gallery_images
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;

