FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

# Large gallery batches (total request body); align with nginx client_max_body_size.
RUN printf '%s\n' \
  'upload_max_filesize = 500M' \
  'post_max_size = 500M' \
  'max_file_uploads = 300' \
  'memory_limit = 512M' \
  > /usr/local/etc/php/conf.d/mandalart-uploads.ini

COPY apache-vhost.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

WORKDIR /var/www/html
COPY . /var/www/html/backend
