<?php
/**
 * Public submission forms (add wallet / suggest update).
 *
 * @package fides-wallet-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Wallet_Catalog_Submission_Forms')) {

    class Fides_Wallet_Catalog_Submission_Forms {

        const VERSION = '2.9.2';

        /**
         * @param string $mode create|update.
         */
        private static function section_intro_for_mode($mode): string {
            if ($mode === 'update') {
                return __('Search for your wallet, then review and edit the fields below.', 'fides-wallet-catalog');
            }
            return __('Select the organization, then enter the wallet details for the FIDES Wallet Catalog.', 'fides-wallet-catalog');
        }

        /** @var array<string, string> */
        const FIELD_HELP = array(
            'orgSearch'             => 'Search the organization catalog and select the provider for this wallet.',
            'walletSearch'          => 'Search by wallet name or id, then select the correct entry.',
            'id'                    => 'Stable catalog id (lowercase, hyphens). Used in deep links (?wallet=…).',
            'name'                  => 'Display name of the wallet product.',
            'type'                  => 'Personal wallets are for individuals; business wallets serve business use cases.',
            'status'                => 'Deployment maturity of the wallet.',
            'description'           => 'Short description of the wallet and its purpose.',
            'platforms'             => 'Where the wallet is available.',
            'website'               => 'Official landing page where visitors can learn about the product, sign up, or download the wallet.',
            'logo'                  => 'Direct URL to a logo image (PNG, SVG, or JPG) shown on catalog cards and the wallet detail page.',
            'mediaVideos'           => 'Short product demos embedded on your public listing. Paste YouTube or Vimeo links — one per row (max 3).',
            'mediaImages'           => 'Screenshots or product images visitors see on your wallet page. Upload a file or paste a URL — one per row (max 10).',
            'documentation'         => 'Link to technical or product documentation — API references, integration guides, or user manuals.',
            'openSource'            => 'Whether the wallet implementation is open source.',
            'license'               => 'Software license under which the wallet is distributed. The catalog shows open vs closed source based on this choice.',
            'licenseOther'          => 'Exact license name when none of the standard options apply. Required if you selected Other (max 50 characters).',
            'deploymentModel'       => 'How business customers run this wallet: vendor-hosted cloud (SaaS), fully on-premises, or a hybrid of both.',
            'slaAvailable'          => 'Check if you offer a formal service level agreement (uptime, support response times, etc.) to business customers.',
            'pricing'               => 'Explain how this wallet is priced — free, subscription tiers, per-seat, enterprise quotes, and so on. Shown on your public listing to help evaluators compare options (max 1000 characters).',
            'repository'            => 'Public source code repository, if applicable — for example GitHub or GitLab.',
            'releaseDate'           => 'Date this wallet product was first shipped or made publicly available (optional). Not when the catalog entry was last updated.',
            'vcFormat'              => 'Supported verifiable credential formats.',
            'issuanceProtocols'     => 'Protocols used to issue credentials.',
            'presentationProtocols' => 'Protocols used to present credentials.',
            'supportedIdentifiers'  => 'DID or identifier methods this wallet supports (used by catalog filters).',
            'keyStorage'            => 'Where keys are stored on device or in the cloud.',
            'signingAlgorithms'     => 'Supported signing algorithms (used by catalog filters).',
            'credentialStatusMethods' => 'Credential status / revocation methods (used by catalog filters).',
            'eidasTrustServices'    => 'Qualified eIDAS trust services this wallet integrates with or relies on. Shown as checkboxes in the Specifications section of the wallet modal.',
            'recognitionsCustomerStories' => 'Organizations or programmes using this wallet — enter a short title and optionally link to a case study or pilot announcement.',
            'recognitionsCertifications'  => 'Certifications that apply to this wallet product — e.g. EUDI Wallet LSP, Common Criteria evaluation, or national eIDAS wallet conformity. Title required; link to the certificate optional.',
            'recognitionsAwards'          => 'Awards or analyst recognition for this wallet product. Title required; link to the announcement optional.',
            'additionalDocumentation'       => 'Extra documentation links shown in the wallet modal — e.g. API reference, integration guide, or developer docs. Title required; link optional.',
            'interoperabilityProfiles' => 'Interop profiles the wallet supports.',
            'standards'             => 'Standards or frameworks the wallet complies with (comma-separated), e.g. ARF 1.4 or eIDAS.',
            'features'              => 'Stand-out product capabilities not covered elsewhere (comma-separated), e.g. biometric unlock or offline presentation.',
            'capabilities'          => 'Roles this business wallet can perform: store credentials (holder), issue them (issuer), or verify them (verifier).',
            'appStoreLinks'         => 'Links to download native apps or open the web wallet in a browser.',
            'appStoreWeb'           => 'URL where users access this wallet in a browser — for personal or business web wallets. Use Website for your general product or marketing page.',
            'contactEmail'          => 'Taken from your FIDES account; used for submission review only, not published as the wallet contact.',
        );

        public static function bootstrap(): void {
            add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
            add_action('rest_api_init', array(__CLASS__, 'register_rest_routes'));
            add_shortcode('fides_wallet_submit_form', array(__CLASS__, 'render_submit_shortcode'));
            add_shortcode('fides_wallet_update_form', array(__CLASS__, 'render_update_shortcode'));
        }

        public static function register_rest_routes(): void {
            register_rest_route(
                'fides-catalog/v1',
                '/submissions/card-image',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'rest_upload_card_image'),
                    'permission_callback' => function () {
                        return is_user_logged_in();
                    },
                )
            );
        }

        /**
         * @param WP_REST_Request $request Request.
         * @return WP_REST_Response
         */
        public static function rest_upload_card_image($request) {
            $files = $request->get_file_params();
            if (empty($files['file']) || ! is_array($files['file'])) {
                return new WP_REST_Response(array('message' => 'No image file uploaded.'), 400);
            }

            $file = $files['file'];
            if (! empty($file['error'])) {
                return new WP_REST_Response(array('message' => 'Image upload failed.'), 400);
            }

            $allowed_types = array('image/jpeg', 'image/png', 'image/webp', 'image/gif');
            $mime          = isset($file['type']) ? (string) $file['type'] : '';
            if (! in_array($mime, $allowed_types, true)) {
                return new WP_REST_Response(array('message' => 'Use JPEG, PNG, WebP, or GIF.'), 400);
            }

            $max_bytes = 2 * 1024 * 1024;
            $size      = isset($file['size']) ? (int) $file['size'] : 0;
            if ($size <= 0 || $size > $max_bytes) {
                return new WP_REST_Response(array('message' => 'Image must be between 1 byte and 2 MB.'), 400);
            }

            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';

            $upload = wp_handle_upload(
                $file,
                array(
                    'test_form' => false,
                    'mimes'     => array(
                        'jpg|jpeg|jpe' => 'image/jpeg',
                        'png'          => 'image/png',
                        'webp'         => 'image/webp',
                        'gif'          => 'image/gif',
                    ),
                )
            );

            if (isset($upload['error'])) {
                return new WP_REST_Response(array('message' => (string) $upload['error']), 400);
            }

            $url = isset($upload['url']) ? esc_url_raw((string) $upload['url']) : '';
            if ($url === '') {
                return new WP_REST_Response(array('message' => 'Upload succeeded but no URL was returned.'), 500);
            }

            return rest_ensure_response(array('url' => $url));
        }

        public static function register_assets(): void {
            $base = plugin_dir_path(dirname(__FILE__));
            $url  = plugin_dir_url(dirname(__FILE__));

            $css_path = $base . 'assets/wallet-form.css';
            $js_path  = $base . 'assets/wallet-form.js';
            $css_ver  = file_exists($css_path) ? (string) filemtime($css_path) : self::VERSION;
            $js_ver   = file_exists($js_path) ? (string) filemtime($js_path) : self::VERSION;

            wp_register_style(
                'fides-wallet-form',
                $url . 'assets/wallet-form.css',
                array(),
                $css_ver
            );
            wp_register_script(
                'fides-wallet-form',
                $url . 'assets/wallet-form.js',
                array(),
                $js_ver,
                true
            );
        }

        /**
         * @param array<string, mixed> $atts Shortcode attributes.
         */
        public static function render_submit_shortcode($atts = array()): string {
            return self::render_form_shortcode('create', $atts);
        }

        /**
         * @param array<string, mixed> $atts Shortcode attributes.
         */
        public static function render_update_shortcode($atts = array()): string {
            $atts = shortcode_atts(
                array(
                    'wallet' => '',
                ),
                $atts,
                'fides_wallet_update_form'
            );
            $preselect = self::normalize_wallet_query_param((string) $atts['wallet']);
            if ($preselect === '' && isset($_GET['wallet'])) {
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $preselect = self::normalize_wallet_query_param((string) wp_unslash($_GET['wallet']));
            }
            return self::render_form_shortcode('update', array('preselectWalletId' => $preselect));
        }

        /**
         * @param string               $mode create|update.
         * @param array<string, mixed> $extra Extra config for inline script.
         */
        private static function render_form_shortcode($mode, array $extra = array()): string {
            if (! class_exists('Fides_Catalog_Submission_Registry')
                || ! Fides_Catalog_Submission_Registry::exists('wallet')) {
                return '<div class="fides-use-case-card"><p>' . esc_html__(
                    'Wallet submissions are unavailable (missing submission core or adapter).',
                    'fides-wallet-catalog'
                ) . '</p></div>';
            }

            if (! is_user_logged_in()) {
                wp_enqueue_style('fides-wallet-form');
                $login_url = self::form_login_url();
                return sprintf(
                    '<div class="fides-use-case-card"><p>%s</p><p><a class="fides-org-form-login-link" href="%s">%s</a></p></div>',
                    esc_html__('You must be signed in to submit wallet catalog changes.', 'fides-wallet-catalog'),
                    esc_url($login_url),
                    esc_html__('Sign in to continue', 'fides-wallet-catalog')
                );
            }

            $user = wp_get_current_user();
            if ($mode === 'update' && ! empty($extra['preselectWalletId'])
                && class_exists('Fides_Catalog_Org_Tier')) {
                $wallet_id = (string) $extra['preselectWalletId'];
                $existing  = class_exists('Fides_Catalog_Submission_Lookups')
                    ? Fides_Catalog_Submission_Lookups::find_item_by_id('wallet', $wallet_id)
                    : null;
                if (! Fides_Catalog_Org_Tier::user_can_edit_item(
                    'wallet',
                    $wallet_id,
                    (int) $user->ID,
                    is_array($existing) ? $existing : null
                )) {
                    return '<div class="fides-use-case-card"><p>' . esc_html__(
                        'This wallet belongs to a Pro organization. Only the linked owner can suggest updates.',
                        'fides-wallet-catalog'
                    ) . '</p></div>';
                }
            }

            wp_enqueue_style('fides-wallet-form');
            wp_enqueue_script('fides-wallet-form');

            $plugin_url = plugin_dir_url(dirname(__FILE__));
            $config = array_merge(
                array(
                    'mode'                  => $mode === 'update' ? 'update' : 'create',
                    'apiBase'               => esc_url_raw(rest_url('fides-catalog/v1')),
                    'restNonce'             => wp_create_nonce('wp_rest'),
                    'vocabularyUrl'         => 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json',
                    'vocabularyFallbackUrl' => $plugin_url . 'assets/vocabulary.json',
                    'contactEmail'          => sanitize_email((string) $user->user_email),
                    'enums'             => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? Fides_Wallet_Catalog_Submission_Adapter::form_enums()
                        : array(),
                    'enumLabels'        => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? Fides_Wallet_Catalog_Submission_Adapter::form_enum_labels()
                        : array(),
                    'enumTitles'        => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? array(
                            'eidasTrustServices' => Fides_Wallet_Catalog_Submission_Adapter::form_eidas_trust_service_full_labels(),
                        )
                        : array(),
                    'eidasTrustServicesByType' => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? Fides_Wallet_Catalog_Submission_Adapter::form_eidas_trust_services_by_type()
                        : array(),
                    'fieldHelp'         => self::FIELD_HELP,
                    'sectionIntro'      => self::section_intro_for_mode($mode),
                    'v2Limits'          => class_exists('Fides_Wallet_Catalog_V2_Normalizer')
                        ? Fides_Wallet_Catalog_V2_Normalizer::limits_for_form()
                        : array(),
                    'preselectWalletId' => '',
                    'planTier'          => class_exists('Fides_Catalog_Org_Tier')
                        ? Fides_Catalog_Org_Tier::form_config(self::plan_org_id_for_form($mode, $extra))
                        : array(
                            'tierUiEnabled'        => false,
                            'tier'                 => 'Community',
                            'isPro'                => false,
                            'plansUrl'             => home_url('/plans/'),
                            'descriptionMaxLength' => 2000,
                        ),
                ),
                $extra
            );

            wp_add_inline_script(
                'fides-wallet-form',
                'window.FIDES_WALLET_FORM_CONFIG = ' . wp_json_encode($config) . ';',
                'before'
            );

            $root_id = $mode === 'update' ? 'fides-wallet-update-form-root' : 'fides-wallet-submit-form-root';
            return '<div id="' . esc_attr($root_id) . '" class="fides-wallet-submission-root fides-org-submission-root"></div>';
        }

        public static function form_login_url(): string {
            $current_request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
            $current_host        = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'])) : '';
            $current_url         = $current_host !== ''
                ? ((is_ssl() ? 'https://' : 'http://') . $current_host . $current_request_uri)
                : home_url('/');

            $oid4vp_options = get_option('universal_openid4vp_options', array());
            if (is_array($oid4vp_options) && ! empty($oid4vp_options['loginUrl'])) {
                return esc_url_raw(
                    add_query_arg('return_to', $current_url, (string) $oid4vp_options['loginUrl'])
                );
            }
            return wp_login_url($current_url);
        }

        private static function normalize_wallet_query_param($raw): string {
            $raw = sanitize_text_field(trim((string) $raw));
            if ($raw === '') {
                return '';
            }
            return Fides_Catalog_Submission_Registry::is_valid_item_id('wallet', $raw) ? $raw : '';
        }

        /**
         * Resolve organization id for planTier / org-tier REST on wallet forms.
         *
         * @param string               $mode create|update.
         * @param array<string, mixed> $extra Shortcode config (preselectWalletId).
         */
        private static function plan_org_id_for_form($mode, array $extra = array()): string {
            if ($mode !== 'update' || empty($extra['preselectWalletId'])) {
                return '';
            }
            if (! class_exists('Fides_Catalog_Submission_Lookups')) {
                return '';
            }
            $wallet = Fides_Catalog_Submission_Lookups::find_item_by_id('wallet', (string) $extra['preselectWalletId']);
            if (! is_array($wallet)) {
                return '';
            }
            $org_id = trim((string) ($wallet['orgId'] ?? ''));
            if ($org_id !== '') {
                return $org_id;
            }
            if (isset($wallet['provider']) && is_array($wallet['provider'])) {
                return trim((string) ($wallet['provider']['orgId'] ?? ''));
            }
            return '';
        }
    }
}
