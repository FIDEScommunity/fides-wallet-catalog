<?php
/**
 * Wallet Catalog SSR — wallet-specific implementation of the shared
 * Fides_Catalog_SSR_Renderer base class shipped by fides-community-tools-tiles.
 *
 * Catalog-specific responsibilities living here:
 *   - Register the 'wallet' catalog type in Fides_Catalog_Registry.
 *   - Route detail URLs to /personal-wallets/ vs /business-wallets/ based on
 *     the wallet's `type` field.
 *   - Veto Detail SEO when the wallet's type doesn't match the current page.
 *   - Enrich the SoftwareApplication JSON-LD with wallet-specific properties
 *     (platforms, app-store install URLs, formats/protocols/algorithms,
 *     publisher organisation, repository, dateModified, free offer).
 *   - Filter shortcode output by `type="personal" | "organizational" | "both"`.
 *   - Provide the dl meta rows and the chip-list / app-store sections for the
 *     SSR detail block; the base class renders the wrapping article.
 *
 * Everything stays gated on fides_catalog_ssr_enabled(); flipping the master
 * switch off in /wp-admin/options-general.php?page=fides-catalog-seo
 * instantly returns the plugin to legacy JS-only behaviour.
 *
 * Backwards compat: the static `bootstrap()` and `build_initial_html()` entry
 * points and the four `OPTION_* / DEFAULT_*_PATH` constants are preserved so
 * the existing main plugin file does not have to change.
 *
 * @package fides-wallet-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Wallet_Catalog_SSR')) {

    /**
     * If the shared base class isn't loaded (e.g. tiles plugin disabled),
     * this class becomes a no-op shim with the same public surface so the
     * main wallet plugin file keeps working without conditional checks.
     */
    if (! class_exists('Fides_Catalog_SSR_Renderer')) {

        class Fides_Wallet_Catalog_SSR {
            const TYPE                  = 'wallet';
            const DEFAULT_PERSONAL_PATH = '/ecosystem-explorer/personal-wallets/';
            const DEFAULT_BUSINESS_PATH = '/ecosystem-explorer/organizational-wallets/';
            const OPTION_PERSONAL_URL   = 'fides_wallet_catalog_personal_url';
            const OPTION_BUSINESS_URL   = 'fides_wallet_catalog_business_url';
            const MAX_LISTING_ITEMS     = 30;
            public static function bootstrap() { /* no-op without base */ }
            public static function build_initial_html(array $atts) { return ''; }
        }

    } else {

        class Fides_Wallet_Catalog_SSR extends Fides_Catalog_SSR_Renderer {

            const TYPE                  = 'wallet';
            const DEFAULT_PERSONAL_PATH = '/ecosystem-explorer/personal-wallets/';
            const DEFAULT_BUSINESS_PATH = '/ecosystem-explorer/organizational-wallets/';
            const OPTION_PERSONAL_URL   = 'fides_wallet_catalog_personal_url';
            const OPTION_BUSINESS_URL   = 'fides_wallet_catalog_business_url';
            const MAX_LISTING_ITEMS     = 30;

            /** @var self|null */
            private static $instance = null;

            /* --------------------------------------------------------------
             * Static facade preserved for the main plugin file.
             * -------------------------------------------------------------- */

            public static function bootstrap(): void {
                if (self::$instance === null) {
                    self::$instance = new self();
                    self::$instance->bootstrap_renderer();
                    add_action('admin_init', array(__CLASS__, 'register_settings'));
                }
            }

            public static function build_initial_html(array $atts): string {
                self::bootstrap();
                return self::$instance->render_initial_html($atts);
            }

            /* --------------------------------------------------------------
             * Required overrides
             * -------------------------------------------------------------- */

            protected function type(): string             { return self::TYPE; }
            protected function text_domain(): string      { return 'fides-wallet-catalog'; }
            protected function shortcode_root_id(): string { return 'fides-wallet-catalog-root'; }
            protected function loading_label(): string    { return __('Loading wallet catalog…', 'fides-wallet-catalog'); }
            protected function max_listing_items(): int   { return self::MAX_LISTING_ITEMS; }

            public function register_with_core(): void {
                if (! class_exists('Fides_Catalog_Registry')) {
                    return;
                }
                Fides_Catalog_Registry::register(self::TYPE, array(
                    'label'             => __('Wallets', 'fides-wallet-catalog'),
                    'json_url'          => 'https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json',
                    'collection_key'    => 'wallets',
                    'id_field'          => 'id',
                    'name_field'        => 'name',
                    'description_field' => 'description',
                    'logo_field'        => 'logo',
                    'detail_param'      => 'wallet',
                    'pages'             => array(
                        'personal' => self::personal_path(),
                        'business' => self::business_path(),
                    ),
                    'jsonld_type'       => 'SoftwareApplication',
                ));
            }

            /* --------------------------------------------------------------
             * Settings (admin paths for personal / business listing pages)
             * -------------------------------------------------------------- */

            public static function register_settings(): void {
                register_setting('fides_wallet_catalog_settings', self::OPTION_PERSONAL_URL, array(
                    'type'              => 'string',
                    'default'           => self::DEFAULT_PERSONAL_PATH,
                    'sanitize_callback' => array(__CLASS__, 'sanitize_path'),
                ));
                register_setting('fides_wallet_catalog_settings', self::OPTION_BUSINESS_URL, array(
                    'type'              => 'string',
                    'default'           => self::DEFAULT_BUSINESS_PATH,
                    'sanitize_callback' => array(__CLASS__, 'sanitize_path'),
                ));
            }

            public static function sanitize_path($value): string {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '') {
                    return '';
                }
                $path = wp_parse_url($value, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return '';
                }
                if ($path[0] !== '/') {
                    $path = '/' . $path;
                }
                return user_trailingslashit($path);
            }

            /* --------------------------------------------------------------
             * Filters into the SEO core
             * -------------------------------------------------------------- */

            public function filter_detail_url_base($base, $type, $item) {
                if ($type !== self::TYPE) {
                    return $base;
                }
                $wallet_type = (is_array($item) && isset($item['type'])) ? (string) $item['type'] : '';
                return $wallet_type === 'organizational'
                    ? self::business_path()
                    : self::personal_path();
            }

            public function filter_detail_render_gate($render, $type, $item, $page_slug) {
                if ($type !== self::TYPE) {
                    return $render;
                }
                $wallet_type = (is_array($item) && isset($item['type'])) ? (string) $item['type'] : '';
                if ($page_slug === 'personal' && $wallet_type === 'organizational') {
                    return false;
                }
                if ($page_slug === 'business' && $wallet_type === 'personal') {
                    return false;
                }
                return $render;
            }

            protected function enrich_jsonld(array $jsonld, array $item): array {
                if (! empty($item['platforms']) && is_array($item['platforms'])) {
                    $platforms = array_values(array_filter(array_map('strval', $item['platforms'])));
                    if (! empty($platforms)) {
                        $jsonld['operatingSystem'] = implode(', ', $platforms);
                    }
                }

                $jsonld['applicationCategory'] = 'SecurityApplication';

                if (! empty($item['description']) && is_string($item['description'])) {
                    $jsonld['description'] = (string) $item['description'];
                }

                if (! empty($item['appStoreLinks']) && is_array($item['appStoreLinks'])) {
                    $download_urls = array_values(array_filter(array_map('strval', $item['appStoreLinks'])));
                    if (count($download_urls) === 1) {
                        $jsonld['downloadUrl'] = $download_urls[0];
                        $jsonld['installUrl']  = $download_urls[0];
                    } elseif (count($download_urls) > 1) {
                        $jsonld['downloadUrl'] = $download_urls;
                        $jsonld['installUrl']  = $download_urls;
                    }
                }

                if (! empty($item['provider']) && is_array($item['provider'])) {
                    $publisher = array('@type' => 'Organization');
                    if (! empty($item['provider']['name'])) {
                        $publisher['name'] = (string) $item['provider']['name'];
                    }
                    if (! empty($item['provider']['website'])) {
                        $publisher['url'] = (string) $item['provider']['website'];
                    }
                    if (count($publisher) > 1) {
                        $jsonld['publisher'] = $publisher;
                    }
                }

                $features = $this->list_field($item, 'features');
                if (! empty($features)) {
                    $jsonld['featureList'] = $features;
                }

                $keyword_pool = array_merge(
                    $this->list_field($item, 'credentialFormats'),
                    $this->list_field($item, 'issuanceProtocols'),
                    $this->list_field($item, 'presentationProtocols'),
                    $this->list_field($item, 'signingAlgorithms'),
                    $this->list_field($item, 'credentialStatusMethods')
                );
                if (! empty($keyword_pool)) {
                    $jsonld['keywords'] = implode(', ', array_unique($keyword_pool));
                }

                $requirements = array_unique(array_merge(
                    $this->list_field($item, 'issuanceProtocols'),
                    $this->list_field($item, 'presentationProtocols')
                ));
                if (! empty($requirements)) {
                    $jsonld['softwareRequirements'] = implode(', ', $requirements);
                }

                if (! empty($item['updatedAt']) && is_string($item['updatedAt'])) {
                    $ts = strtotime($item['updatedAt']);
                    if ($ts) {
                        $jsonld['dateModified'] = gmdate('Y-m-d', $ts);
                    }
                }

                $same_as = array();
                if (! empty($item['repository']) && is_string($item['repository'])) {
                    $same_as[] = (string) $item['repository'];
                }
                if (! empty($same_as)) {
                    $jsonld['sameAs'] = $same_as;
                }

                $jsonld['offers'] = array(
                    '@type'         => 'Offer',
                    'price'         => '0',
                    'priceCurrency' => 'USD',
                );
                $jsonld['isAccessibleForFree'] = true;

                return $jsonld;
            }

            /* --------------------------------------------------------------
             * Detail block content (meta rows + chip / app-store sections)
             * -------------------------------------------------------------- */

            protected function detail_meta_rows(array $item): array {
                $rows        = array();
                $wallet_type = isset($item['type']) ? (string) $item['type'] : '';
                $status      = isset($item['status']) ? (string) $item['status'] : '';
                $platforms   = $this->list_field($item, 'platforms');
                $provider    = (isset($item['provider']) && is_array($item['provider'])) ? $item['provider'] : array();
                $country     = (! empty($provider['country']) && is_string($provider['country']))
                    ? strtoupper(trim($provider['country']))
                    : '';
                $open_source = ! empty($item['openSource']);
                $website     = (isset($item['website']) && is_string($item['website']))
                    ? trim($item['website'])
                    : '';
                $repository  = (isset($item['repository']) && is_string($item['repository']))
                    ? trim($item['repository'])
                    : '';
                $updated_at  = (isset($item['updatedAt']) && is_string($item['updatedAt']))
                    ? $item['updatedAt']
                    : '';

                if ($wallet_type !== '') {
                    $rows[] = array(
                        'label' => __('Type', 'fides-wallet-catalog'),
                        'html'  => esc_html(self::format_wallet_type($wallet_type)),
                    );
                }
                if ($status !== '') {
                    $rows[] = array(
                        'label' => __('Status', 'fides-wallet-catalog'),
                        'html'  => esc_html(ucfirst($status)),
                    );
                }
                if (! empty($platforms)) {
                    $rows[] = array(
                        'label' => __('Platforms', 'fides-wallet-catalog'),
                        'html'  => esc_html(implode(', ', $platforms)),
                    );
                }
                if ($country !== '') {
                    $rows[] = array(
                        'label' => __('Provider country', 'fides-wallet-catalog'),
                        'html'  => esc_html($country),
                    );
                }
                $rows[] = array(
                    'label' => __('Open source', 'fides-wallet-catalog'),
                    'html'  => $open_source
                        ? esc_html__('Yes', 'fides-wallet-catalog')
                        : esc_html__('No', 'fides-wallet-catalog'),
                );
                if ($website !== '') {
                    $rows[] = array(
                        'label' => __('Website', 'fides-wallet-catalog'),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($website),
                            esc_html($website)
                        ),
                    );
                }
                if ($repository !== '') {
                    $rows[] = array(
                        'label' => __('Repository', 'fides-wallet-catalog'),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($repository),
                            esc_html($repository)
                        ),
                    );
                }
                if ($updated_at !== '') {
                    $ts = strtotime($updated_at);
                    if ($ts) {
                        $rows[] = array(
                            'label' => __('Last updated', 'fides-wallet-catalog'),
                            'html'  => sprintf(
                                '<time datetime="%1$s">%1$s</time>',
                                esc_attr(gmdate('Y-m-d', $ts))
                            ),
                        );
                    }
                }
                return $rows;
            }

            protected function detail_extra_sections(array $item): string {
                $app_links = (isset($item['appStoreLinks']) && is_array($item['appStoreLinks']))
                    ? $item['appStoreLinks']
                    : array();

                ob_start();

                if (! empty($app_links)) :
                    ?>
                    <section class="fides-ssr-detail__section">
                        <h2 class="fides-ssr-detail__section-title"><?php esc_html_e('Get the app', 'fides-wallet-catalog'); ?></h2>
                        <ul class="fides-ssr-detail__app-links">
                            <?php foreach ($app_links as $store => $url) :
                                if (! is_string($url) || $url === '') {
                                    continue;
                                }
                                ?>
                                <li>
                                    <a href="<?php echo esc_url($url); ?>" rel="nofollow noopener" target="_blank">
                                        <?php echo esc_html(self::format_store_label($store)); ?>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </section>
                <?php endif;

                $td = 'fides-wallet-catalog';
                echo $this->render_chip_section($this->list_field($item, 'features'),                __('Features', $td));
                echo $this->render_chip_section($this->list_field($item, 'credentialFormats'),       __('Credential formats', $td));
                echo $this->render_chip_section($this->list_field($item, 'issuanceProtocols'),       __('Issuance protocols', $td));
                echo $this->render_chip_section($this->list_field($item, 'presentationProtocols'),   __('Presentation protocols', $td));
                echo $this->render_chip_section($this->list_field($item, 'signingAlgorithms'),       __('Signing algorithms', $td));
                echo $this->render_chip_section($this->list_field($item, 'credentialStatusMethods'), __('Credential status methods', $td));

                return (string) ob_get_clean();
            }

            /* --------------------------------------------------------------
             * Listing item filters + page detection
             * -------------------------------------------------------------- */

            protected function filter_items_for_listing(array $items, array $atts): array {
                $type_filter = isset($atts['type']) ? trim((string) $atts['type']) : '';
                if ($type_filter === '' || $type_filter === 'both') {
                    return $items;
                }
                return array_values(array_filter($items, function ($item) use ($type_filter) {
                    return isset($item['type']) && $item['type'] === $type_filter;
                }));
            }

            protected function filter_items_for_listing_jsonld(array $items, string $page_slug): array {
                $needle = $page_slug === 'business' ? 'organizational' : 'personal';
                return array_values(array_filter($items, function ($item) use ($needle) {
                    return isset($item['type']) && $item['type'] === $needle;
                }));
            }

            protected function current_page_slug(): string {
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $request_uri = isset($_SERVER['REQUEST_URI']) ? esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'])) : '';
                if ($request_uri === '') {
                    return '';
                }
                $path = wp_parse_url($request_uri, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return '';
                }
                $path = trailingslashit($path);
                if ($path === trailingslashit(self::personal_path())) {
                    return 'personal';
                }
                if ($path === trailingslashit(self::business_path())) {
                    return 'business';
                }
                return '';
            }

            protected function listing_page_name(string $page_slug): string {
                return $page_slug === 'business'
                    ? __('Business Wallet Catalog', 'fides-wallet-catalog')
                    : __('Personal Wallet Catalog', 'fides-wallet-catalog');
            }

            protected function listing_page_url(string $page_slug): string {
                return home_url($page_slug === 'business' ? self::business_path() : self::personal_path());
            }

            /* --------------------------------------------------------------
             * Helpers
             * -------------------------------------------------------------- */

            private static function personal_path(): string {
                $opt = (string) get_option(self::OPTION_PERSONAL_URL, '');
                return $opt !== '' ? $opt : self::DEFAULT_PERSONAL_PATH;
            }

            private static function business_path(): string {
                $opt = (string) get_option(self::OPTION_BUSINESS_URL, '');
                return $opt !== '' ? $opt : self::DEFAULT_BUSINESS_PATH;
            }

            private static function format_wallet_type($type): string {
                switch ($type) {
                    case 'organizational':
                        return __('Organizational / business', 'fides-wallet-catalog');
                    case 'personal':
                        return __('Personal', 'fides-wallet-catalog');
                    default:
                        return ucfirst((string) $type);
                }
            }

            private static function format_store_label($key): string {
                $map = array(
                    'iOS'     => __('App Store (iOS)', 'fides-wallet-catalog'),
                    'ios'     => __('App Store (iOS)', 'fides-wallet-catalog'),
                    'android' => __('Google Play (Android)', 'fides-wallet-catalog'),
                    'huawei'  => __('Huawei AppGallery', 'fides-wallet-catalog'),
                    'web'     => __('Web app', 'fides-wallet-catalog'),
                    'desktop' => __('Desktop', 'fides-wallet-catalog'),
                );
                return isset($map[$key]) ? $map[$key] : ucfirst((string) $key);
            }
        }
    }
}
