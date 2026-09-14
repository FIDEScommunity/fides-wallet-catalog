<?php
/**
 * Share-URL helpers. LinkedIn crawlers ignore ?wallet= on the listing page,
 * so listing query URLs 301 to /wallet/{id}/. Update/submit forms also use
 * ?wallet= and must never be redirected.
 *
 * Listing detection is an exact path match (not a prefix). Nested or sibling
 * form paths such as /ecosystem-explorer/personal-wallets/submit-wallet/ and
 * /ecosystem-explorer/personal-wallets/update-wallet/ must stay unmatched.
 *
 * @package fides-wallet-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * @return array<int, string>
 */
function fides_wallet_catalog_default_listing_path_aliases(): array {
    return array(
        '/ecosystem-explorer/personal-wallets/',
        '/ecosystem-explorer/business-wallets/',
        '/ecosystem-explorer/organizational-wallets/',
        '/community-tools/personal-wallets/',
    );
}

function fides_wallet_catalog_normalize_path($path): string {
    if (! is_string($path) || $path === '') {
        return '';
    }
    $path = '/' . ltrim($path, '/');
    if ($path !== '/') {
        $path = rtrim($path, '/') . '/';
    }
    return $path;
}

/**
 * True only when $path is exactly one of the listing aliases.
 *
 * @param mixed             $path    Request path (query string already stripped).
 * @param array<int, mixed> $aliases Listing path aliases.
 */
function fides_wallet_catalog_path_is_exact_listing($path, array $aliases): bool {
    $normalized = fides_wallet_catalog_normalize_path(is_string($path) ? $path : '');
    if ($normalized === '' || $normalized === '/') {
        return false;
    }
    foreach ($aliases as $alias) {
        if (! is_string($alias) || $alias === '') {
            continue;
        }
        if ($normalized === fides_wallet_catalog_normalize_path($alias)) {
            return true;
        }
    }
    return false;
}

function fides_wallet_catalog_share_path(): string {
    $path = '/wallet/';
    if (function_exists('apply_filters')) {
        $path = (string) apply_filters('fides_wallet_catalog_share_path', $path);
    }
    $normalized = fides_wallet_catalog_normalize_path($path);
    return $normalized !== '' ? $normalized : '/wallet/';
}

function fides_wallet_catalog_personal_listing_path(): string {
    $default = '/ecosystem-explorer/personal-wallets/';
    if (class_exists('Fides_Wallet_Catalog_SSR')) {
        $default = Fides_Wallet_Catalog_SSR::DEFAULT_PERSONAL_PATH;
        if (function_exists('get_option')) {
            $opt = trim((string) get_option(Fides_Wallet_Catalog_SSR::OPTION_PERSONAL_URL, ''));
            if ($opt !== '') {
                $default = $opt;
            }
        }
    }
    if (function_exists('apply_filters')) {
        $default = (string) apply_filters('fides_wallet_catalog_personal_path', $default);
    }
    $normalized = fides_wallet_catalog_normalize_path($default);
    return $normalized !== '' ? $normalized : '/ecosystem-explorer/personal-wallets/';
}

function fides_wallet_catalog_business_listing_path(): string {
    $default = '/ecosystem-explorer/organizational-wallets/';
    if (class_exists('Fides_Wallet_Catalog_SSR')) {
        $default = Fides_Wallet_Catalog_SSR::DEFAULT_BUSINESS_PATH;
        if (function_exists('get_option')) {
            $opt = trim((string) get_option(Fides_Wallet_Catalog_SSR::OPTION_BUSINESS_URL, ''));
            if ($opt !== '') {
                $default = $opt;
            }
        }
    }
    if (function_exists('apply_filters')) {
        $default = (string) apply_filters('fides_wallet_catalog_business_path', $default);
    }
    $normalized = fides_wallet_catalog_normalize_path($default);
    return $normalized !== '' ? $normalized : '/ecosystem-explorer/organizational-wallets/';
}

/**
 * @return array<int, string>
 */
function fides_wallet_catalog_listing_path_aliases(): array {
    $aliases = fides_wallet_catalog_default_listing_path_aliases();
    array_unshift($aliases, fides_wallet_catalog_business_listing_path());
    array_unshift($aliases, fides_wallet_catalog_personal_listing_path());
    return $aliases;
}

function fides_wallet_catalog_is_listing_request_path($path): bool {
    return fides_wallet_catalog_path_is_exact_listing($path, fides_wallet_catalog_listing_path_aliases());
}

/**
 * True when $path is /wallet/{id}/ (one extra segment).
 *
 * @param mixed $path
 */
function fides_wallet_catalog_path_is_share_item($path): bool {
    $normalized = fides_wallet_catalog_normalize_path(is_string($path) ? $path : '');
    $share = fides_wallet_catalog_share_path();
    if ($normalized === '' || $normalized === '/' || $share === '') {
        return false;
    }
    if (! str_starts_with($normalized, $share)) {
        return false;
    }
    $rest = trim(substr($normalized, strlen($share)), '/');
    return $rest !== '' && strpos($rest, '/') === false;
}
