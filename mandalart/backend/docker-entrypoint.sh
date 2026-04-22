#!/bin/sh
set -e
# Named Docker volumes are often root-owned; PHP runs as www-data and must write uploads here.
GALLERY_DIR=/var/www/html/public/gallery_images
mkdir -p /var/www/html/public
mkdir -p "$GALLERY_DIR"
chown -R www-data:www-data "$GALLERY_DIR"
chmod 775 "$GALLERY_DIR"
exec "$@"
