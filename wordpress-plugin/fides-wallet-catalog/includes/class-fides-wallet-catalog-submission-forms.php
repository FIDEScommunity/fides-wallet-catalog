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

        const VERSION = '2.8.3';

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
            'website'               => 'Landing page or product website.',
            'logo'                  => 'URL to a logo image.',
            'video'                 => 'Optional demo or promotional video URL.',
            'documentation'         => 'Link to technical or product documentation.',
            'openSource'            => 'Whether the wallet implementation is open source.',
            'license'               => 'SPDX or other license identifier when open source.',
            'repository'            => 'Source code repository URL.',
            'releaseDate'           => 'When the wallet was first publicly released (optional). Not the same as catalog sync timestamps.',
            'vcFormat'              => 'Supported verifiable credential formats.',
            'issuanceProtocols'     => 'Protocols used to issue credentials.',
            'presentationProtocols' => 'Protocols used to present credentials.',
            'supportedIdentifiers'  => 'DID or identifier methods this wallet supports (used by catalog filters).',
            'keyStorage'            => 'Where keys are stored on device or in the cloud.',
            'signingAlgorithms'     => 'Supported signing algorithms (used by catalog filters).',
            'credentialStatusMethods' => 'Credential status / revocation methods (used by catalog filters).',
            'certifications'        => 'Certification labels (comma-separated).',
            'interoperabilityProfiles' => 'Interop profiles the wallet supports.',
            'standards'             => 'Standards compliance labels (comma-separated).',
            'features'              => 'Notable product features (comma-separated).',
            'capabilities'          => 'Business wallet roles (holder, issuer, verifier).',
            'appStoreLinks'         => 'App store or web install links.',
            'contactEmail'          => 'Taken from your FIDES account.',
        );

        public static function bootstrap(): void {
            add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
            add_shortcode('fides_wallet_submit_form', array(__CLASS__, 'render_submit_shortcode'));
            add_shortcode('fides_wallet_update_form', array(__CLASS__, 'render_update_shortcode'));
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

            wp_enqueue_style('fides-wallet-form');
            wp_enqueue_script('fides-wallet-form');

            $user = wp_get_current_user();
            $config = array_merge(
                array(
                    'mode'              => $mode === 'update' ? 'update' : 'create',
                    'apiBase'           => esc_url_raw(rest_url('fides-catalog/v1')),
                    'restNonce'         => wp_create_nonce('wp_rest'),
                    'contactEmail'      => sanitize_email((string) $user->user_email),
                    'enums'             => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? Fides_Wallet_Catalog_Submission_Adapter::form_enums()
                        : array(),
                    'enumLabels'        => class_exists('Fides_Wallet_Catalog_Submission_Adapter')
                        ? Fides_Wallet_Catalog_Submission_Adapter::form_enum_labels()
                        : array(),
                    'fieldHelp'         => self::FIELD_HELP,
                    'sectionIntro'      => self::section_intro_for_mode($mode),
                    'preselectWalletId' => '',
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
    }
}
