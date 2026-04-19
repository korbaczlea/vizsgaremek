<?php

require_once __DIR__ . '/../models/site_settings_model.php';

function site_pages_default_home(): array
{
    return [
        'slides' => [
            ['src' => '/images/workshop.png', 'alt' => 'MandalArt workshop'],
            ['src' => '/images/festes.png', 'alt' => 'Hand-painted mandala process'],
            ['src' => '/images/alkotas.png', 'alt' => 'Creating mandala art'],
        ],
        'kicker'              => 'Handmade • Premium paints • Gift-ready',
        'headline'            => 'Hand-painted mandalas for calm & beauty',
        'subhead'             => 'Unique mandalas, coasters, decorations and wall clocks — crafted with care. Custom requests are welcome.',
        'trust'               => [
            ['title' => 'Handmade', 'text' => 'Created with care, one by one.'],
            ['title' => 'Premium paints', 'text' => 'Durable, vibrant colors.'],
            ['title' => 'Gift-ready', 'text' => 'Perfect for mindful homes.'],
        ],
        'featured_section_title' => 'Featured products',
        'featured'            => [
            [
                'name'  => 'Mandala – 12 cm',
                'price' => '5 500 HUF',
                'image' => '/images/little_mandala.png',
                'desc'  => 'Small, calm accent for shelves and desks.',
            ],
            [
                'name'  => 'Mandala – 22 cm',
                'price' => '15 000 HUF',
                'image' => '/images/medium_mandala.png',
                'desc'  => 'A detailed centerpiece with premium paints.',
            ],
            [
                'name'  => 'Mandala Wall Clock – 30 cm',
                'price' => '25 500 HUF',
                'image' => '/images/clock_mandala.png',
                'desc'  => 'Decorative + functional statement piece.',
            ],
        ],
        'why_title'    => 'Why mandalas?',
        'why_body'     => 'Mandalas are loved worldwide as mindful decorations. They can support a calm atmosphere, help with relaxation, and bring harmony into your space. Many people use mandalas as a visual focus during meditation.',
        'why_bullets'  => [
            'Calm, balanced atmosphere',
            'Unique handcrafted decor',
            'A thoughtful gift idea',
        ],
        'process_title' => 'How it’s made',
        'process_body'  => 'Each piece is painted step-by-step with patience and precision. I use quality paints and carefully selected surfaces to make the artwork durable and detailed.',
        'steps'         => [
            ['num' => '1', 'text' => 'Design & color planning'],
            ['num' => '2', 'text' => 'Hand painting dot-by-dot'],
            ['num' => '3', 'text' => 'Finishing & careful packaging'],
        ],
    ];
}

function site_pages_default_about(): array
{
    return [
        'title'  => 'About Mandalart',
        'tagline' => 'From Hungary · Since 2024',
        'paragraphs' => [
            'Since 2024, I have been creating mandala paintings. I have always been interested in art, and I found myself through mandala painting. I create custom mandalas, coasters, decorations and wall clocks upon request. I work with high-quality Pentart paints and the mandalas are made on glass plates.',
            'If you’d like a custom piece, head to the Contact page and send your preferences (colors, template, size).',
        ],
    ];
}

function site_pages_merge_home(array $defaults, $saved): array
{
    if (!is_array($saved)) {
        return $defaults;
    }
    $out = array_replace_recursive($defaults, $saved);
    if (!isset($out['slides']) || !is_array($out['slides']) || count($out['slides']) === 0) {
        $out['slides'] = $defaults['slides'];
    }
    if (!isset($out['trust']) || !is_array($out['trust']) || count($out['trust']) === 0) {
        $out['trust'] = $defaults['trust'];
    }
    if (!isset($out['featured']) || !is_array($out['featured']) || count($out['featured']) === 0) {
        $out['featured'] = $defaults['featured'];
    }
    if (!isset($out['why_bullets']) || !is_array($out['why_bullets']) || count($out['why_bullets']) === 0) {
        $out['why_bullets'] = $defaults['why_bullets'];
    }
    if (!isset($out['steps']) || !is_array($out['steps']) || count($out['steps']) === 0) {
        $out['steps'] = $defaults['steps'];
    }

    return $out;
}

function site_pages_merge_about(array $defaults, $saved): array
{
    if (!is_array($saved)) {
        return $defaults;
    }
    $out = array_replace_recursive($defaults, $saved);
    if (!isset($out['paragraphs']) || !is_array($out['paragraphs']) || count($out['paragraphs']) === 0) {
        $out['paragraphs'] = $defaults['paragraphs'];
    }

    return $out;
}

function home_page_get_public(): array
{
    site_settings_ensure_tables();
    $homeD = site_pages_default_home();
    $hj    = site_setting_get('page_home', null);

    return site_pages_merge_home($homeD, $hj ? json_decode($hj, true) : null);
}

function about_page_get_public(): array
{
    site_settings_ensure_tables();
    $abD = site_pages_default_about();
    $aj  = site_setting_get('page_about', null);

    return site_pages_merge_about($abD, $aj ? json_decode($aj, true) : null);
}

function site_pages_get_admin(): array
{
    return [
        'home'  => home_page_get_public(),
        'about' => about_page_get_public(),
    ];
}

function site_pages_apply_admin_update(array $data): array
{
    if (isset($data['home'])) {
        if (!is_array($data['home'])) {
            return ['ok' => false, 'error' => 'home must be an object'];
        }
        $merged = site_pages_merge_home(site_pages_default_home(), $data['home']);
        site_setting_set('page_home', json_encode($merged, JSON_UNESCAPED_UNICODE));
    }
    if (isset($data['about'])) {
        if (!is_array($data['about'])) {
            return ['ok' => false, 'error' => 'about must be an object'];
        }
        $merged = site_pages_merge_about(site_pages_default_about(), $data['about']);
        site_setting_set('page_about', json_encode($merged, JSON_UNESCAPED_UNICODE));
    }

    return ['ok' => true];
}
