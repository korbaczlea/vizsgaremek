<?php

require_once __DIR__ . '/../config.php';

class JWT
{
    private static function base64url_encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'), true);
    }

    public static function generate_token(string $email): string
    {
        $payload = [
            'iss'   => 'mandalart',
            'aud'   => 'mandalart',
            'iat'   => time(),
            'exp'   => time() + 604800,
            'email' => $email,
            'type'  => 'access',
            'jti'   => bin2hex(random_bytes(16)),
        ];

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $headerB64  = self::base64url_encode(json_encode($header));
        $payloadB64 = self::base64url_encode(json_encode($payload));
        $signature  = hash_hmac('sha256', $headerB64 . '.' . $payloadB64, JWT_SECRET, true);
        $signatureB64 = self::base64url_encode($signature);

        return $headerB64 . '.' . $payloadB64 . '.' . $signatureB64;
    }

    public static function validate_token(string $token): ?object
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }

            $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
            $expected  = self::base64url_encode($signature);
            if (!hash_equals($expected, $parts[2])) {
                return null;
            }

            $payload = json_decode(self::base64url_decode($parts[1]));
            if (!$payload || ($payload->type ?? 'access') !== 'access') {
                return null;
            }
            if (isset($payload->exp) && $payload->exp < time()) {
                return null;
            }

            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function generate_reset_token(string $email): string
    {
        $payload = [
            'iss'   => 'mandalart',
            'aud'   => 'mandalart',
            'iat'   => time(),
            'exp'   => time() + 3600,
            'email' => $email,
            'type'  => 'password_reset',
            'jti'   => bin2hex(random_bytes(16)),
        ];

        $header    = ['typ' => 'JWT', 'alg' => 'HS256'];
        $headerB64  = self::base64url_encode(json_encode($header));
        $payloadB64 = self::base64url_encode(json_encode($payload));
        $signature  = hash_hmac('sha256', $headerB64 . '.' . $payloadB64, JWT_SECRET, true);
        $signatureB64 = self::base64url_encode($signature);

        return $headerB64 . '.' . $payloadB64 . '.' . $signatureB64;
    }

    public static function validate_reset_token(string $token): ?object
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }

            $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
            $expected  = self::base64url_encode($signature);
            if (!hash_equals($expected, $parts[2])) {
                return null;
            }

            $payload = json_decode(self::base64url_decode($parts[1]));
            if (!$payload || ($payload->type ?? '') !== 'password_reset') {
                return null;
            }
            if (isset($payload->exp) && $payload->exp < time()) {
                return null;
            }

            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
}
