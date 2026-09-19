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
                    self::$instance->bootstrap_share_metadata();
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
            protected function supports_standalone_detail_page(): bool { return true; }

            public function register_with_core(): void {
                if (! class_exists('Fides_Catalog_Registry')) {
                    return;
                }
                Fides_Catalog_Registry::register(self::TYPE, array(
                    'label'             => __('Wallets', 'fides-wallet-catalog'),
                    'json_url'          => 'https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json',
                    'local_json_path'   => dirname(__DIR__) . '/data/aggregated.json',
                    'collection_key'    => 'wallets',
                    'id_field'          => 'id',
                    'name_field'        => 'name',
                    'description_field' => 'description',
                    'logo_field'        => 'logo',
                    'detail_param'      => 'wallet',
                    'pretty_path'       => fides_wallet_catalog_share_path(),
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
                $request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash((string) $_SERVER['REQUEST_URI']) : '';
                $path = wp_parse_url($request_uri, PHP_URL_PATH);
                if (function_exists('fides_wallet_catalog_path_is_share_item') && fides_wallet_catalog_path_is_share_item($path)) {
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

            /**
             * Share metadata: wallet name as OG title, logo when present, otherwise
             * the branded 1200×627 card (LinkedIn ignores listing ?wallet= and
             * prefers a landscape image).
             */
            private function bootstrap_share_metadata(): void {
                add_filter('fides_catalog_seo_logo_for', array($this, 'filter_seo_share_image'), 20, 3);
                add_filter('fides_catalog_seo_og_title_for', array($this, 'filter_seo_og_title'), 20, 3);
                add_filter('wpseo_opengraph_image', array($this, 'filter_yoast_share_image'), 100);
                add_filter('wpseo_twitter_image', array($this, 'filter_yoast_share_image'), 100);
                add_filter('wpseo_opengraph_title', array($this, 'filter_yoast_share_title'), 1000);
                add_filter('wpseo_twitter_title', array($this, 'filter_yoast_share_title'), 1000);
                add_filter('wpseo_twitter_card_type', array($this, 'filter_yoast_twitter_card'), 100);
                add_filter('wpseo_frontend_presenter_classes', array($this, 'filter_yoast_presenter_classes'), 99);
                add_filter('wpseo_frontend_presenters', array($this, 'filter_yoast_presenters'), 99);
                add_filter('oembed_response_data', array($this, 'filter_oembed_share_title'), 100, 4);
                add_action('wp_head', array($this, 'render_share_image_fallbacks'), 100);
            }

            public static function og_image_url(): string {
                return FIDES_WALLET_CATALOG_URL . 'assets/og-wallet.jpg';
            }

            /**
             * @param mixed                $name
             * @param string               $type
             * @param array<string, mixed> $item
             * @return mixed
             */
            public function filter_seo_og_title($name, $type, $item) {
                if ($type !== self::TYPE || ! is_array($item)) {
                    return $name;
                }
                $formatted = self::share_title_for_item($item);
                return $formatted !== '' ? $formatted : $name;
            }

            /**
             * @param mixed                $logo
             * @param string               $type
             * @param array<string, mixed> $item
             * @return mixed
             */
            public function filter_seo_share_image($logo, $type, $item) {
                if ($type !== self::TYPE) {
                    return $logo;
                }
                if (is_string($logo) && trim($logo) !== '' && strpos($logo, 'google.com/s2/favicons') === false) {
                    return $logo;
                }
                unset($item);
                return self::og_image_url();
            }

            public function filter_yoast_share_image($image) {
                $item = $this->current_share_item();
                if (! $item) {
                    return $image;
                }
                return self::share_image_url($item);
            }

            public function filter_yoast_share_title($title) {
                $item = $this->current_share_item();
                if (! $item) {
                    return $title;
                }
                $formatted = self::share_title_for_item($item);
                return $formatted !== '' ? $formatted : $title;
            }

            /**
             * LinkedIn prefers oEmbed title over og:title.
             *
             * @param array        $data
             * @param WP_Post|null $post
             * @param int          $width
             * @param int          $height
             * @return array
             */
            public function filter_oembed_share_title($data, $post, $width, $height) {
                unset($post, $width, $height);
                if (! is_array($data)) {
                    return $data;
                }
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $item_url = isset($_GET['url']) ? esc_url_raw(wp_unslash((string) $_GET['url'])) : '';
                $item = $this->current_share_item($item_url);
                if (! $item) {
                    return $data;
                }
                $formatted = self::share_title_for_item($item);
                if ($formatted !== '') {
                    $data['title'] = $formatted;
                }
                return $data;
            }

            /**
             * @param array<string, mixed> $item
             */
            private static function share_title_for_item(array $item): string {
                $name = isset($item['name']) ? trim(wp_strip_all_tags((string) $item['name'])) : '';
                if ($name === '') {
                    return '';
                }
                return $name . ' - FIDES Trust Explorer';
            }

            public function filter_yoast_twitter_card($type) {
                return $this->current_share_item() ? 'summary_large_image' : $type;
            }

            /**
             * @param array<int, string> $classes
             * @return array<int, string>
             */
            public function filter_yoast_presenter_classes($classes) {
                if (! $this->current_share_item() || ! is_array($classes)) {
                    return $classes;
                }
                return array_values(
                    array_filter(
                        $classes,
                        static function ($class) {
                            return is_string($class) && strpos($class, 'Image_Dimensions') === false;
                        }
                    )
                );
            }

            /**
             * @param array<int, object|string> $presenters
             * @return array<int, object|string>
             */
            public function filter_yoast_presenters($presenters) {
                if (! $this->current_share_item() || ! is_array($presenters)) {
                    return $presenters;
                }
                return array_values(
                    array_filter(
                        $presenters,
                        static function ($presenter) {
                            $class = is_object($presenter) ? get_class($presenter) : (string) $presenter;
                            return strpos($class, 'Image_Dimensions') === false;
                        }
                    )
                );
            }

            /**
             * Prefer a real logo; Google favicons are too small for LinkedIn.
             *
             * @param array<string, mixed> $item
             */
            private static function share_image_url(array $item): string {
                $url = isset($item['logo']) ? trim((string) $item['logo']) : '';
                if ($url === '' || strpos($url, 'google.com/s2/favicons') !== false) {
                    return self::og_image_url();
                }
                return $url;
            }

            public function render_share_image_fallbacks(): void {
                $item = $this->current_share_item();
                if (! $item) {
                    return;
                }
                if (self::share_image_url($item) !== self::og_image_url()) {
                    return;
                }
                echo '<meta property="og:image:width" content="1200" />' . "\n";
                echo '<meta property="og:image:height" content="627" />' . "\n";
            }

            /**
             * @param string $item_url Optional absolute URL (oEmbed `url` query).
             * @return array<string, mixed>|null
             */
            private function current_share_item($item_url = '') {
                if (! function_exists('fides_catalog_ssr_enabled') || ! fides_catalog_ssr_enabled()) {
                    return null;
                }
                if (! class_exists('Fides_Catalog_Registry') || ! class_exists('Fides_Catalog_Source')) {
                    return null;
                }
                $detected = ($item_url !== '' && method_exists('Fides_Catalog_Registry', 'detect_detail_request_from_url'))
                    ? Fides_Catalog_Registry::detect_detail_request_from_url($item_url)
                    : Fides_Catalog_Registry::detect_current_detail_request();
                if (! is_array($detected) || ($detected['type'] ?? '') !== self::TYPE) {
                    return null;
                }
                $source = Fides_Catalog_Source::for(self::TYPE);
                if (! $source) {
                    return null;
                }
                $item = $source->find_by_id((string) $detected['item_id']);
                return is_array($item) ? $item : null;
            }

            private static function item_has_full_listing(array $item): bool {
                if (! class_exists('Fides_Catalog_Org_Tier') || ! Fides_Catalog_Org_Tier::tier_ui_enabled()) {
                    return true;
                }
                if (
                    isset($item['catalogListingDepth'])
                    && strtolower(trim((string) $item['catalogListingDepth'])) === 'full'
                ) {
                    return true;
                }
                if (isset($item['catalogTier'])) {
                    $tier = strtolower(trim((string) $item['catalogTier']));
                    if ($tier !== '' && $tier !== 'community' && $tier !== 'gratis') {
                        return true;
                    }
                }
                $org_id = isset($item['orgId']) ? trim((string) $item['orgId']) : '';
                if (
                    $org_id === ''
                    && isset($item['provider'])
                    && is_array($item['provider'])
                    && isset($item['provider']['orgId'])
                ) {
                    $org_id = trim((string) $item['provider']['orgId']);
                }
                return $org_id !== '' && Fides_Catalog_Org_Tier::has_full_listing($org_id);
            }

            protected function enrich_jsonld(array $jsonld, array $item): array {
                $full_listing = self::item_has_full_listing($item);
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

                if ($full_listing && ! empty($item['appStoreLinks']) && is_array($item['appStoreLinks'])) {
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

                $features = $full_listing ? $this->list_field($item, 'features') : array();
                if (! empty($features)) {
                    $jsonld['featureList'] = $features;
                }

                $keyword_pool = array_merge(
                    $this->list_field($item, 'vcFormat'),
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
                if ($full_listing && ! empty($item['repository']) && is_string($item['repository'])) {
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
                if ($website !== '' && self::item_has_full_listing($item)) {
                    $rows[] = array(
                        'label' => __('Website', 'fides-wallet-catalog'),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($website),
                            esc_html($website)
                        ),
                    );
                }
                if ($repository !== '' && self::item_has_full_listing($item)) {
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
                $full_listing = self::item_has_full_listing($item);
                $app_links = (isset($item['appStoreLinks']) && is_array($item['appStoreLinks']))
                    ? $item['appStoreLinks']
                    : array();
                if (! $full_listing) {
                    $app_links = array();
                }

                if (
                    isset($item['type']) && $item['type'] === 'personal'
                    && self::item_has_web_platform($item)
                ) {
                    $web_url = isset($app_links['web']) && is_string($app_links['web'])
                        ? trim($app_links['web'])
                        : '';
                    if ($web_url === '' && isset($item['website']) && is_string($item['website'])) {
                        $web_url = trim($item['website']);
                    }
                    if ($web_url !== '') {
                        $app_links['web'] = $web_url;
                    }
                }

                ob_start();

                echo $this->render_provider_organization_link($item);

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
                if ($full_listing) {
                    echo $this->render_chip_section($this->list_field($item, 'features'), __('Features', $td));
                }
                echo $this->render_chip_section($this->list_field($item, 'vcFormat'),       __('VC formats', $td));
                echo $this->render_chip_section($this->list_field($item, 'issuanceProtocols'),       __('Issuance protocols', $td));
                echo $this->render_chip_section($this->list_field($item, 'presentationProtocols'),   __('Presentation protocols', $td));
                echo $this->render_chip_section($this->list_field($item, 'signingAlgorithms'),       __('Signing algorithms', $td));
                echo $this->render_chip_section($this->list_field($item, 'credentialStatusMethods'), __('Credential status methods', $td));

                if (! empty($item['eudiTracker']) && is_array($item['eudiTracker'])) {
                    echo $this->render_eudi_landscape_ssr_section($item['eudiTracker']);
                }

                return (string) ob_get_clean();
            }

            private function render_provider_organization_link(array $item): string {
                $org_id = isset($item['orgId']) ? trim((string) $item['orgId']) : '';
                if (
                    $org_id === ''
                    && isset($item['provider'])
                    && is_array($item['provider'])
                    && isset($item['provider']['orgId'])
                ) {
                    $org_id = trim((string) $item['provider']['orgId']);
                }
                if ($org_id === '') {
                    return '';
                }
                $name = '';
                if (isset($item['provider']) && is_array($item['provider']) && ! empty($item['provider']['name'])) {
                    $name = (string) $item['provider']['name'];
                } elseif (! empty($item['providerName'])) {
                    $name = (string) $item['providerName'];
                } else {
                    $name = $org_id;
                }
                $url = class_exists('Fides_Catalog_Registry')
                    ? Fides_Catalog_Registry::detail_url_for('organization', array('id' => $org_id))
                    : null;
                if (! $url) {
                    $url = home_url('/organization/' . rawurlencode($org_id) . '/');
                }
                ob_start();
                ?>
                <section class="fides-ssr-detail__section">
                    <h2 class="fides-ssr-detail__section-title"><?php echo esc_html__('Organization', 'fides-wallet-catalog'); ?></h2>
                    <p class="fides-ssr-detail__related">
                        <a href="<?php echo esc_url($url); ?>"><?php echo esc_html($name); ?></a>
                    </p>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /**
             * SSR block for crawl-time iGrant EUDI landscape overlay.
             *
             * @param array<string, mixed> $tracker
             */
            private function render_eudi_landscape_ssr_section(array $tracker): string {
                $status = isset($tracker['status']) ? (string) $tracker['status'] : '';
                if ($status === '') {
                    return '';
                }

                $badge_class = $this->eudi_landscape_status_badge_class($status);

                ob_start();
                ?>
                <section class="fides-ssr-detail__section fides-ssr-detail__section--eudi-landscape">
                    <h2 class="fides-ssr-detail__section-title"><?php esc_html_e('EUDI landscape status', 'fides-wallet-catalog'); ?></h2>
                    <dl class="fides-ssr-detail__meta">
                        <dt><?php esc_html_e('Landscape status', 'fides-wallet-catalog'); ?></dt>
                        <dd><span class="fides-eudi-landscape-badge <?php echo esc_attr($badge_class); ?>"><?php echo esc_html($status); ?></span></dd>
                        <?php if (! empty($tracker['assuranceLevel'])) : ?>
                            <dt><?php esc_html_e('Assurance level', 'fides-wallet-catalog'); ?></dt>
                            <dd><?php echo esc_html($this->format_eudi_assurance_level_display((string) $tracker['assuranceLevel'])); ?></dd>
                        <?php endif; ?>
                        <?php if (! empty($tracker['qtspPartner'])) : ?>
                            <dt><?php esc_html_e('QTSP partner', 'fides-wallet-catalog'); ?></dt>
                            <dd><?php echo esc_html((string) $tracker['qtspPartner']); ?></dd>
                        <?php endif; ?>
                    </dl>
                    <?php if (! empty($tracker['notes'])) : ?>
                        <p><?php echo esc_html((string) $tracker['notes']); ?></p>
                    <?php endif; ?>
                    <p class="fides-ssr-detail__attribution">
                        <?php
                        esc_html_e('Data from the iGrant EUDI Wallet Tracker.', 'fides-wallet-catalog');
                        if (! empty($tracker['sourceLastUpdated'])) {
                            echo ' ';
                            printf(
                                /* translators: %s: ISO date from iGrant tracker */
                                esc_html__('Last updated %s.', 'fides-wallet-catalog'),
                                esc_html((string) $tracker['sourceLastUpdated'])
                            );
                        }
                        ?>
                    </p>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /**
             * CSS modifier for iGrant landscape status pills (matches modal JS mapping).
             */
            private function eudi_landscape_status_badge_class(string $status): string {
                $map = array(
                    'Production (EU Notified)'             => 'fides-eudi-landscape-badge--prod-notified',
                    'Production (EU Notification Pending)'   => 'fides-eudi-landscape-badge--prod-pending',
                    'Public Pilot'                         => 'fides-eudi-landscape-badge--public-pilot',
                    'Closed Pilot / LSP'                   => 'fides-eudi-landscape-badge--closed-pilot',
                    'Planned for Production'               => 'fides-eudi-landscape-badge--planned',
                    'No plans'                             => 'fides-eudi-landscape-badge--no-plans',
                );

                return $map[ $status ] ?? 'fides-eudi-landscape-badge--unknown';
            }

            /**
             * Display label for iGrant assurance level (e.g. high → High).
             */
            private function format_eudi_assurance_level_display(string $value): string {
                $trimmed = trim($value);
                if ($trimmed === '') {
                    return '';
                }

                return ucfirst(strtolower($trimmed));
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

            protected function related_listing_title(): string {
                return __('More wallets', 'fides-wallet-catalog');
            }

            protected function catalog_index_label(): string {
                return __('View wallet catalog', 'fides-wallet-catalog');
            }

            protected function related_listing_url(): string {
                $id = $this->current_detail_id();
                if ($id !== '' && class_exists('Fides_Catalog_Source')) {
                    $source = Fides_Catalog_Source::for(self::TYPE);
                    $item   = $source ? $source->find_by_id($id) : null;
                    if (is_array($item) && isset($item['type']) && $item['type'] === 'organizational') {
                        return home_url(self::business_path());
                    }
                }
                return home_url(self::personal_path());
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

            private static function item_has_web_platform(array $item): bool {
                if (! isset($item['platforms']) || ! is_array($item['platforms'])) {
                    return false;
                }
                foreach ($item['platforms'] as $platform) {
                    if (is_string($platform) && strcasecmp($platform, 'Web') === 0) {
                        return true;
                    }
                }
                return false;
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
