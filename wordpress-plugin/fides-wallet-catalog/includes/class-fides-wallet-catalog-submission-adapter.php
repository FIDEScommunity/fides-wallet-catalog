<?php
/**
 * Registers the wallet catalog with the shared submission core.
 *
 * @package fides-wallet-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Wallet_Catalog_Submission_Adapter')) {

    class Fides_Wallet_Catalog_Submission_Adapter {

        const TYPE = 'wallet';

        const SCHEMA = 'https://fides.community/schemas/wallet-catalog/v1';

        /** @var string[] */
        const WALLET_TYPES = array('personal', 'organizational');

        /** @var string[] */
        const STATUSES = array('development', 'beta', 'production', 'deprecated');

        /** @var string[] */
        const PLATFORMS = array('iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux', 'CLI');

        /** @var string[] */
        const VC_FORMATS = array(
            'sd_jwt_vc',
            'mdoc',
            'jwt_vc',
            'vcdm_1_1',
            'vcdm_2_0',
            'anoncreds',
            'idemix',
            'apple_wallet_pass',
            'google_wallet_pass',
            'acdc',
        );

        /** @var string[] */
        const ISSUANCE_PROTOCOLS = array(
            'OpenID4VCI',
            'DIDComm Issue Credential v1',
            'DIDComm Issue Credential v2',
            'ISO 18013-5 (Device Retrieval)',
        );

        /** @var string[] */
        const PRESENTATION_PROTOCOLS = array(
            'OpenID4VP',
            'DIDComm Present Proof v1',
            'DIDComm Present Proof v2',
            'ISO 18013-5',
            'SIOPv2',
        );

        /** @var string[] */
        const INTEROP_PROFILES = array(
            'DIIP v4',
            'DIIP v5',
            'EWC v3',
            'EUDI Wallet ARF',
            'HAIP v1',
        );

        /** @var string[] */
        const CAPABILITIES = array('holder', 'issuer', 'verifier');

        /** @var string[] */
        const KEY_STORAGE = array(
            'Software',
            'Secure Enclave (iOS)',
            'StrongBox (Android)',
            'TEE',
            'HSM',
            'Cloud KMS',
            'Smart Card',
            'FIDO2/WebAuthn',
        );

        /** @var string[] Aligns with wallet catalog identifier filters + common catalog values. */
        const SUPPORTED_IDENTIFIERS = array(
            'did:web',
            'did:key',
            'did:jwk',
            'did:peer',
            'did:ebsi',
            'did:ion',
            'did:cheqd',
            'did:webvh',
            'did:indy',
            'did:ethr',
            'did:polygon',
            'did:dock',
            'did:eth',
            'did:gatc',
            'did:isbe',
            'did:kscirc',
            'x509',
        );

        /** @var string[] Aligns with wallet catalog signing-algorithm filters. */
        const SIGNING_ALGORITHMS = array(
            'ES256',
            'ES384',
            'ES512',
            'ES256K',
            'EdDSA',
            'RS256',
            'PS256',
            'BBS+',
            'ML-DSA (FIPS 204)',
        );

        /** @var string[] Canonical credential status labels for the submission form. */
        const CREDENTIAL_STATUS_METHODS = array(
            'StatusList2021',
            'RevocationList2020',
            'OCSP',
            'CRL',
            'IETF Token Status List',
            'Bitstring Status List',
        );

        /** @var string[] Wallet object keys editable via the submission form. */
        const WALLET_PAYLOAD_KEYS = array(
            'id',
            'name',
            'description',
            'logo',
            'website',
            'video',
            'type',
            'platforms',
            'openSource',
            'license',
            'repository',
            'vcFormat',
            'issuanceProtocols',
            'presentationProtocols',
            'supportedIdentifiers',
            'keyStorage',
            'signingAlgorithms',
            'credentialStatusMethods',
            'certifications',
            'interoperabilityProfiles',
            'standards',
            'features',
            'documentation',
            'appStoreLinks',
            'status',
            'releaseDate',
            'capabilities',
        );

        public static function bootstrap(): void {
            add_action('init', array(__CLASS__, 'register'), 6);
            add_filter('fides_catalog_submission_public_item_url', array(__CLASS__, 'filter_public_item_url'), 10, 4);
        }

        public static function register(): void {
            if (! class_exists('Fides_Catalog_Submission_Registry')) {
                return;
            }

            Fides_Catalog_Submission_Registry::register(
                self::TYPE,
                array(
                    'label'                   => __('Wallets', 'fides-wallet-catalog'),
                    'catalog_type'            => self::TYPE,
                    'id_pattern'              => '/^[a-z0-9-]+$/',
                    'community_filename'      => 'wallet-catalog.json',
                    'slug_from_item_id'       => array(__CLASS__, 'slug_from_item_id'),
                    'slug_from_payload'       => array(__CLASS__, 'slug_from_payload'),
                    'validate_payload'        => array(__CLASS__, 'validate_payload'),
                    'payload_to_export'       => array(__CLASS__, 'payload_to_export'),
                    'catalog_item_to_payload' => array(__CLASS__, 'catalog_item_to_payload'),
                    'prepare_payload_for_diff' => array(__CLASS__, 'prepare_payload_for_diff'),
                    'diff_field_labels'       => array(
                        'id'                         => 'Wallet id',
                        'orgId'                      => 'Organization',
                        'name'                       => 'Wallet name',
                        'type'                       => 'Wallet type',
                        'status'                     => 'Status',
                        'description'                => 'Description',
                        'platforms'                  => 'Platforms',
                        'website'                    => 'Website',
                        'logo'                       => 'Logo URL',
                        'video'                      => 'Video URL',
                        'documentation'            => 'Documentation',
                        'openSource'                 => 'Open source',
                        'license'                    => 'License',
                        'repository'                 => 'Repository',
                        'releaseDate'                => 'Release date',
                        'vcFormat'                   => 'VC formats',
                        'issuanceProtocols'          => 'Issuance protocols',
                        'presentationProtocols'      => 'Presentation protocols',
                        'supportedIdentifiers'       => 'Supported identifiers',
                        'keyStorage'                 => 'Key storage',
                        'signingAlgorithms'          => 'Signing algorithms',
                        'credentialStatusMethods'    => 'Credential status methods',
                        'certifications'             => 'Certifications',
                        'interoperabilityProfiles'   => 'Interop profiles',
                        'standards'                  => 'Standards',
                        'features'                   => 'Features',
                        'capabilities'               => 'Capabilities',
                        'appStoreLinks.iOS'          => 'iOS App Store',
                        'appStoreLinks.android'      => 'Google Play',
                        'appStoreLinks.web'          => 'Web install URL',
                    ),
                )
            );
        }

        /**
         * Deep link for published-notification emails.
         *
         * @param string               $url          Current URL.
         * @param string               $catalog_type Catalog type slug.
         * @param string               $item_id      Wallet id.
         * @param array<string, mixed> $payload      Published payload.
         * @return string
         */
        public static function filter_public_item_url($url, $catalog_type, $item_id, $payload) {
            if ($catalog_type !== self::TYPE) {
                return $url;
            }
            $item_id = trim((string) $item_id);
            if ($item_id === '' || ! class_exists('Fides_Wallet_Catalog_SSR')) {
                return $url;
            }
            $wallet_type = is_array($payload) && isset($payload['type'])
                ? sanitize_key((string) $payload['type'])
                : 'personal';
            $path = $wallet_type === 'organizational'
                ? get_option(Fides_Wallet_Catalog_SSR::OPTION_BUSINESS_URL, Fides_Wallet_Catalog_SSR::DEFAULT_BUSINESS_PATH)
                : get_option(Fides_Wallet_Catalog_SSR::OPTION_PERSONAL_URL, Fides_Wallet_Catalog_SSR::DEFAULT_PERSONAL_PATH);
            $path = trim((string) $path);
            if ($path === '') {
                return $url;
            }
            return add_query_arg('wallet', rawurlencode($item_id), home_url($path));
        }

        /**
         * @return array<string, array<int, string>>
         */
        public static function form_enums(): array {
            return array(
                'walletType'              => self::WALLET_TYPES,
                'platforms'                 => self::PLATFORMS,
                'status'                    => self::STATUSES,
                'vcFormat'                  => self::VC_FORMATS,
                'issuanceProtocols'         => self::ISSUANCE_PROTOCOLS,
                'presentationProtocols'     => self::PRESENTATION_PROTOCOLS,
                'interoperabilityProfiles'  => self::INTEROP_PROFILES,
                'capabilities'            => self::CAPABILITIES,
                'keyStorage'                => self::KEY_STORAGE,
                'supportedIdentifiers'      => self::SUPPORTED_IDENTIFIERS,
                'signingAlgorithms'         => self::SIGNING_ALGORITHMS,
                'credentialStatusMethods'   => self::CREDENTIAL_STATUS_METHODS,
            );
        }

        /**
         * Human-readable labels for enum values in the submission form (stored values unchanged).
         *
         * @return array<string, array<string, string>>
         */
        public static function form_enum_labels(): array {
            return array(
                'walletType' => array(
                    'personal'       => 'Personal',
                    'organizational' => 'Business',
                ),
                'credentialStatusMethods' => array(
                    'StatusList2021'         => 'W3C Status List 2021',
                    'RevocationList2020'     => 'W3C Revocation List 2020',
                    'OCSP'                   => 'OCSP (Online Certificate Status Protocol)',
                    'CRL'                    => 'Certificate Revocation List',
                    'IETF Token Status List' => 'IETF Token Status List',
                    'Bitstring Status List'  => 'W3C Bitstring Status List',
                ),
            );
        }

        /**
         * Fallback export slug when payload has no orgId (should not happen after validation).
         *
         * @param string $item_id Wallet id.
         * @return string
         */
        public static function slug_from_item_id($item_id) {
            return sanitize_title((string) $item_id);
        }

        /**
         * @param array<string, mixed> $payload Normalized payload.
         * @param string               $item_id Wallet id.
         * @return string
         */
        public static function slug_from_payload(array $payload, $item_id) {
            unset($item_id);
            $org_id = isset($payload['orgId']) ? sanitize_text_field((string) $payload['orgId']) : '';
            if ($org_id !== '' && strpos($org_id, 'org:') === 0) {
                return sanitize_title(substr($org_id, 4));
            }
            return '';
        }

        /**
         * @param array<string, mixed> $payload Raw request payload.
         * @param array<string, mixed> $context action, type, optional item_id.
         * @return array<string, mixed>|WP_Error
         */
        public static function validate_payload(array $payload, array $context) {
            $action = isset($context['action']) ? sanitize_key((string) $context['action']) : 'create';

            $org_id = isset($payload['orgId']) ? sanitize_text_field((string) $payload['orgId']) : '';
            if ($org_id === '' || ! preg_match('/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/', $org_id)) {
                return new WP_Error('fides_wallet_invalid', __('A valid organization (org:…) is required.', 'fides-wallet-catalog'));
            }

            if ($action === 'update') {
                $item_id = isset($context['item_id']) ? sanitize_text_field((string) $context['item_id']) : '';
                if ($item_id === '' || ! Fides_Catalog_Submission_Registry::is_valid_item_id(self::TYPE, $item_id)) {
                    return new WP_Error('fides_wallet_invalid', __('Invalid wallet id.', 'fides-wallet-catalog'));
                }
            } else {
                $item_id = isset($payload['id']) ? sanitize_text_field((string) $payload['id']) : '';
                if ($item_id === '' || ! preg_match('/^[a-z0-9-]+$/', $item_id)) {
                    return new WP_Error('fides_wallet_invalid', __('Wallet id is required (lowercase letters, numbers, hyphens).', 'fides-wallet-catalog'));
                }
            }

            $name = isset($payload['name']) ? sanitize_text_field((string) $payload['name']) : '';
            if ($name === '') {
                return new WP_Error('fides_wallet_invalid', __('Wallet name is required.', 'fides-wallet-catalog'));
            }

            $type = isset($payload['type']) ? sanitize_key((string) $payload['type']) : '';
            if (! in_array($type, self::WALLET_TYPES, true)) {
                return new WP_Error('fides_wallet_invalid', __('Select a wallet type (personal or organizational).', 'fides-wallet-catalog'));
            }

            $description = isset($payload['description']) ? trim(wp_kses_post((string) $payload['description'])) : '';
            if ($description === '') {
                return new WP_Error('fides_wallet_invalid', __('Description is required.', 'fides-wallet-catalog'));
            }

            $status = isset($payload['status']) ? sanitize_key((string) $payload['status']) : '';
            if (! in_array($status, self::STATUSES, true)) {
                return new WP_Error('fides_wallet_invalid', __('Select a wallet status.', 'fides-wallet-catalog'));
            }

            $platforms = self::normalize_enum_list($payload['platforms'] ?? array(), self::PLATFORMS);
            if (empty($platforms)) {
                return new WP_Error('fides_wallet_invalid', __('Select at least one platform.', 'fides-wallet-catalog'));
            }

            if ($action === 'update') {
                $existing = self::find_catalog_item($item_id);
                if (is_array($existing) && isset($existing['orgId']) && (string) $existing['orgId'] !== $org_id) {
                    return new WP_Error('fides_wallet_invalid', __('Organization cannot be changed when updating a wallet.', 'fides-wallet-catalog'));
                }
                $payload_id = isset($payload['id']) ? sanitize_text_field((string) $payload['id']) : '';
                if ($payload_id !== '' && $payload_id !== $item_id) {
                    return new WP_Error('fides_wallet_invalid', __('Wallet id cannot be changed on update.', 'fides-wallet-catalog'));
                }
            } elseif (self::find_catalog_item($item_id)) {
                return new WP_Error('fides_wallet_invalid', __('This wallet id already exists in the catalog.', 'fides-wallet-catalog'));
            }

            if (! self::organization_exists($org_id)) {
                return new WP_Error('fides_wallet_invalid', __('The selected organization was not found in the organization catalog.', 'fides-wallet-catalog'));
            }

            $normalized = array(
                'item_id' => $item_id,
                'orgId'   => $org_id,
                'id'      => $item_id,
                'name'    => $name,
                'type'    => $type,
                'description' => $description,
                'status'  => $status,
                'platforms' => $platforms,
            );

            foreach (array('logo', 'website', 'video', 'documentation', 'license', 'repository', 'releaseDate') as $key) {
                $value = self::optional_string_or_url($payload, $key);
                if ($value !== '') {
                    $normalized[ $key ] = $value;
                }
            }

            if (isset($payload['openSource'])) {
                $normalized['openSource'] = (bool) $payload['openSource'];
            }

            $normalized['vcFormat'] = self::normalize_enum_list($payload['vcFormat'] ?? array(), self::VC_FORMATS);
            $normalized['issuanceProtocols'] = self::normalize_enum_list($payload['issuanceProtocols'] ?? array(), self::ISSUANCE_PROTOCOLS);
            $normalized['presentationProtocols'] = self::normalize_enum_list($payload['presentationProtocols'] ?? array(), self::PRESENTATION_PROTOCOLS);
            $normalized['interoperabilityProfiles'] = self::normalize_enum_list($payload['interoperabilityProfiles'] ?? array(), self::INTEROP_PROFILES);
            $normalized['capabilities'] = self::normalize_enum_list($payload['capabilities'] ?? array(), self::CAPABILITIES);
            $normalized['keyStorage'] = self::normalize_enum_list($payload['keyStorage'] ?? array(), self::KEY_STORAGE);
            $normalized['supportedIdentifiers'] = self::normalize_canonical_enum_list(
                $payload['supportedIdentifiers'] ?? array(),
                self::identifier_aliases(),
                self::SUPPORTED_IDENTIFIERS
            );
            $normalized['signingAlgorithms'] = self::normalize_enum_list($payload['signingAlgorithms'] ?? array(), self::SIGNING_ALGORITHMS);
            $normalized['credentialStatusMethods'] = self::normalize_canonical_enum_list(
                $payload['credentialStatusMethods'] ?? array(),
                self::credential_status_aliases(),
                self::CREDENTIAL_STATUS_METHODS
            );
            $normalized['certifications'] = self::normalize_string_list($payload['certifications'] ?? array());
            $normalized['standards'] = self::normalize_string_list($payload['standards'] ?? array());
            $normalized['features'] = self::normalize_string_list($payload['features'] ?? array());

            $app_links = self::normalize_app_store_links($payload['appStoreLinks'] ?? array());
            if (! empty($app_links)) {
                $normalized['appStoreLinks'] = $app_links;
            }

            return self::strip_empty_wallet_fields($normalized);
        }

        /**
         * @param array<string, mixed> $payload Normalized payload.
         * @return array<string, mixed>
         */
        public static function payload_to_export(array $payload) {
            if (isset($payload['item_id'])) {
                unset($payload['item_id']);
            }

            $org_id = isset($payload['orgId']) ? sanitize_text_field((string) $payload['orgId']) : '';
            $wallet = array();
            foreach (self::WALLET_PAYLOAD_KEYS as $key) {
                if (! array_key_exists($key, $payload)) {
                    continue;
                }
                $value = $payload[ $key ];
                if ($value === '' || $value === array() || $value === null) {
                    continue;
                }
                $wallet[ $key ] = $value;
            }

            if (! isset($wallet['id']) && isset($payload['id'])) {
                $wallet['id'] = sanitize_text_field((string) $payload['id']);
            }

            return array(
                '$schema'     => self::SCHEMA,
                'orgId'       => $org_id,
                'wallets'     => array($wallet),
                'lastUpdated' => gmdate(DATE_ATOM),
            );
        }

        /**
         * @param array<string, mixed> $item Aggregated wallet item.
         * @return array<string, mixed>
         */
        public static function catalog_item_to_payload(array $item) {
            $payload = array(
                'orgId' => isset($item['orgId']) ? (string) $item['orgId'] : '',
                'id'    => isset($item['id']) ? (string) $item['id'] : '',
            );

            foreach (self::WALLET_PAYLOAD_KEYS as $key) {
                if (in_array($key, array('id'), true) || ! array_key_exists($key, $item)) {
                    continue;
                }
                $value = $item[ $key ];
                if ($value === '' || $value === array() || $value === null) {
                    continue;
                }
                $payload[ $key ] = $value;
            }

            if (
                empty($payload['supportedIdentifiers'])
                && isset($item['didMethods'])
                && is_array($item['didMethods'])
            ) {
                $payload['supportedIdentifiers'] = $item['didMethods'];
            }

            if (isset($payload['supportedIdentifiers'])) {
                $payload['supportedIdentifiers'] = self::normalize_canonical_enum_list(
                    $payload['supportedIdentifiers'],
                    self::identifier_aliases(),
                    self::SUPPORTED_IDENTIFIERS
                );
            }
            if (isset($payload['credentialStatusMethods'])) {
                $payload['credentialStatusMethods'] = self::normalize_canonical_enum_list(
                    $payload['credentialStatusMethods'],
                    self::credential_status_aliases(),
                    self::CREDENTIAL_STATUS_METHODS
                );
            }
            if (isset($payload['signingAlgorithms'])) {
                $payload['signingAlgorithms'] = self::normalize_enum_list(
                    $payload['signingAlgorithms'],
                    self::SIGNING_ALGORITHMS
                );
            }
            if (isset($payload['platforms'])) {
                $payload['platforms'] = self::normalize_enum_list($payload['platforms'], self::PLATFORMS);
            }

            return self::prepare_payload_for_diff($payload);
        }

        /**
         * Normalize wallet payloads before admin diff comparison.
         *
         * @param array<string, mixed> $payload Submission or catalog payload.
         * @return array<string, mixed>
         */
        public static function prepare_payload_for_diff(array $payload) {
            if (isset($payload['appStoreLinks'])) {
                $links = self::normalize_app_store_links($payload['appStoreLinks']);
                if ($links === array()) {
                    unset($payload['appStoreLinks']);
                } else {
                    $payload['appStoreLinks'] = $links;
                }
            }
            if (array_key_exists('openSource', $payload)) {
                $payload['openSource'] = (bool) $payload['openSource'];
            }
            return self::strip_empty_wallet_fields($payload);
        }

        /**
         * @param string $wallet_id Wallet catalog id.
         * @return array<string, mixed>|null
         */
        private static function find_catalog_item($wallet_id) {
            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $wallet_id);
                if (is_array($item)) {
                    return $item;
                }
            }
            return null;
        }

        /**
         * @param string $org_id org:slug.
         * @return bool
         */
        private static function organization_exists($org_id) {
            if (! class_exists('Fides_Catalog_Source') || ! class_exists('Fides_Catalog_Registry')) {
                return true;
            }
            if (! Fides_Catalog_Registry::exists('organization')) {
                return true;
            }
            $source = Fides_Catalog_Source::for('organization');
            if (! $source) {
                return true;
            }
            return is_array($source->find_by_id($org_id));
        }

        /**
         * @return array<string, string>
         */
        private static function identifier_aliases() {
            return array(
                'X.509' => 'x509',
                'X509'  => 'x509',
                'jwk'   => 'did:jwk',
            );
        }

        /**
         * @return array<string, string>
         */
        private static function credential_status_aliases() {
            return array(
                'W3C Verifiable Credentials Status List v2021' => 'StatusList2021',
                'Token Status List'                           => 'IETF Token Status List',
                'BitstringStatusList v1.0'                    => 'Bitstring Status List',
            );
        }

        /**
         * @param mixed        $raw     Raw list.
         * @param array<string, string> $aliases Legacy label → canonical value.
         * @param string[]     $allowed Canonical allowed values.
         * @return string[]
         */
        private static function normalize_canonical_enum_list($raw, array $aliases, array $allowed) {
            $values = is_array($raw) ? $raw : explode(',', (string) $raw);
            $out    = array();
            foreach ($values as $value) {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '') {
                    continue;
                }
                if (isset($aliases[ $value ])) {
                    $value = $aliases[ $value ];
                }
                if ($value === '' || ! in_array($value, $allowed, true) || in_array($value, $out, true)) {
                    continue;
                }
                $out[] = $value;
            }
            return $out;
        }

        /**
         * @param mixed        $raw     Raw list.
         * @param string[]     $allowed Allowed values.
         * @return string[]
         */
        private static function normalize_enum_list($raw, array $allowed) {
            $values = is_array($raw) ? $raw : explode(',', (string) $raw);
            $out    = array();
            foreach ($values as $value) {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '' || ! in_array($value, $allowed, true) || in_array($value, $out, true)) {
                    continue;
                }
                $out[] = $value;
            }
            return $out;
        }

        /**
         * @param mixed $raw Raw list or comma-separated string.
         * @return string[]
         */
        private static function normalize_string_list($raw) {
            $values = is_array($raw) ? $raw : explode(',', (string) $raw);
            $out    = array();
            foreach ($values as $value) {
                $value = sanitize_text_field(trim((string) $value));
                if ($value === '' || in_array($value, $out, true)) {
                    continue;
                }
                $out[] = $value;
            }
            return $out;
        }

        /**
         * @param mixed $raw App store links object.
         * @return array<string, string>
         */
        private static function normalize_app_store_links($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach (array('iOS', 'android', 'web') as $key) {
                if (empty($raw[ $key ])) {
                    continue;
                }
                $url = esc_url_raw((string) $raw[ $key ]);
                if ($url !== '') {
                    $out[ $key ] = $url;
                }
            }
            return $out;
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @param string               $key     Field key.
         * @return string
         */
        private static function optional_string_or_url(array $payload, $key) {
            if (! isset($payload[ $key ])) {
                return '';
            }
            $raw = trim((string) $payload[ $key ]);
            if ($raw === '') {
                return '';
            }
            if (in_array($key, array('website', 'logo', 'video', 'documentation', 'repository'), true)) {
                return esc_url_raw($raw);
            }
            if ($key === 'releaseDate') {
                return sanitize_text_field($raw);
            }
            return sanitize_text_field($raw);
        }

        /**
         * @param array<string, mixed> $payload Payload with metadata keys.
         * @return array<string, mixed>
         */
        private static function strip_empty_wallet_fields(array $payload) {
            foreach (array('vcFormat', 'issuanceProtocols', 'presentationProtocols', 'interoperabilityProfiles', 'capabilities', 'keyStorage', 'supportedIdentifiers', 'signingAlgorithms', 'credentialStatusMethods', 'certifications', 'standards', 'features') as $list_key) {
                if (isset($payload[ $list_key ]) && $payload[ $list_key ] === array()) {
                    unset($payload[ $list_key ]);
                }
            }
            return $payload;
        }
    }
}
