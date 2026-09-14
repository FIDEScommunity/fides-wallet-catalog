<?php
/**
 * Regression tests for wallet share-URL listing detection.
 *
 * Nested submit/update form paths under personal-wallets must never 301.
 *
 * Run from the repo root:
 *   php tests/php/run.php
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

$plugin = dirname(__DIR__, 2) . '/wordpress-plugin/fides-wallet-catalog';
require $plugin . '/includes/wallet-share-url.php';

$failures = 0;
$passes = 0;

function expect_same($actual, $expected, string $label): void {
    global $failures, $passes;
    if ($actual !== $expected) {
        $failures++;
        fwrite(STDERR, "FAIL {$label}\n  expected: " . var_export($expected, true) . "\n  actual:   " . var_export($actual, true) . "\n");
        return;
    }
    $passes++;
    echo "ok {$label}\n";
}

$aliases = array_merge(
    array(
        '/ecosystem-explorer/personal-wallets/',
        '/ecosystem-explorer/business-wallets/',
        '/ecosystem-explorer/organizational-wallets/',
    ),
    fides_wallet_catalog_default_listing_path_aliases()
);

$listing_paths = array(
    '/ecosystem-explorer/personal-wallets/',
    '/ecosystem-explorer/personal-wallets',
    '/ecosystem-explorer/business-wallets/',
    '/ecosystem-explorer/business-wallets',
    '/ecosystem-explorer/organizational-wallets/',
    '/community-tools/personal-wallets/',
);

foreach ($listing_paths as $path) {
    expect_same(
        fides_wallet_catalog_path_is_exact_listing($path, $aliases),
        true,
        "listing path redirects: {$path}"
    );
}

$form_paths = array(
    '/ecosystem-explorer/personal-wallets/submit-wallet/',
    '/ecosystem-explorer/personal-wallets/submit-wallet',
    '/ecosystem-explorer/personal-wallets/update-wallet/',
    '/ecosystem-explorer/personal-wallets/update-wallet',
    '/ecosystem-explorer/business-wallets/submit-wallet/',
    '/ecosystem-explorer/business-wallets/update-wallet/',
    '/wallets-update/',
    '/wallets-update',
    '/wallet/nl-wallet/',
    '/wallet/nl-wallet',
    '/',
    '',
);

foreach ($form_paths as $path) {
    expect_same(
        fides_wallet_catalog_path_is_exact_listing($path, $aliases),
        false,
        "non-listing path must not redirect: {$path}"
    );
}

expect_same(
    fides_wallet_catalog_is_listing_request_path('/ecosystem-explorer/personal-wallets/'),
    true,
    'default aliases treat personal listing as listing without WP'
);
expect_same(
    fides_wallet_catalog_is_listing_request_path('/ecosystem-explorer/personal-wallets/submit-wallet/'),
    false,
    'nested submit form must not count as listing'
);
expect_same(
    fides_wallet_catalog_is_listing_request_path('/ecosystem-explorer/personal-wallets/update-wallet/'),
    false,
    'nested update form must not count as listing'
);
expect_same(
    fides_wallet_catalog_is_listing_request_path('/ecosystem-explorer/business-wallets/'),
    true,
    'business listing path is an exact listing match'
);
expect_same(
    fides_wallet_catalog_share_path(),
    '/wallet/',
    'share path is singular /wallet/'
);
expect_same(
    fides_wallet_catalog_path_is_share_item('/wallet/nl-wallet/'),
    true,
    'pretty share item path is detected'
);
expect_same(
    fides_wallet_catalog_path_is_share_item('/wallet/'),
    false,
    'bare share prefix is not an item path'
);
expect_same(
    fides_wallet_catalog_path_is_share_item('/ecosystem-explorer/personal-wallets/submit-wallet/'),
    false,
    'submit form is not a share item path'
);

$encoded = rawurlencode('wallet:demo');
expect_same($encoded, 'wallet%3Ademo', 'wallet ids with colon stay encoded, not lowercased');
expect_same(rawurldecode($encoded), 'wallet:demo', 'encoded wallet id round-trips with original case');

echo "\n{$passes} passed, {$failures} failed\n";
exit($failures === 0 ? 0 : 1);
