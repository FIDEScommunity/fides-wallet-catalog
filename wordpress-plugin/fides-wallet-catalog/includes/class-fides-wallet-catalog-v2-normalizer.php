<?php
/**
 * Wallet catalog schema v2 normalization (submission + legacy v1 prefill).
 *
 * @package fides-wallet-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Wallet_Catalog_V2_Normalizer')) {

    class Fides_Wallet_Catalog_V2_Normalizer {

        const SCHEMA = 'https://fides.community/schemas/wallet-catalog/v2';

        const LIMIT_MEDIA_VIDEOS = 3;
        const LIMIT_MEDIA_IMAGES = 10;
        const LIMIT_CUSTOMER_STORIES = 5;
        const LIMIT_CERTIFICATIONS = 10;
        const LIMIT_AWARDS = 10;
        const LIMIT_ADDITIONAL_DOCUMENTATION = 10;
        const LIMIT_RECOGNITION_TITLE = 100;
        const LIMIT_LICENSE_OTHER = 50;
        const LIMIT_PRICING = 1000;

        /** @var string[] */
        const LICENSE_VALUES = array(
            'MIT',
            'Apache-2.0',
            'GPL-3.0-or-later',
            'AGPL-3.0-or-later',
            'LGPL-3.0-or-later',
            'EUPL-1.2',
            'MPL-2.0',
            'BSD-3-Clause',
            'ISC',
            'proprietary',
            'other',
        );

        /** @var string[] */
        const DEPLOYMENT_MODELS = array('saas', 'on_premises', 'hybrid');

        /** @var array<string, string> */
        const LICENSE_ALIASES = array(
            'AGPL-3.0'       => 'AGPL-3.0-or-later',
            'AGPL-3.0-only'  => 'AGPL-3.0-or-later',
            'GPL-3.0'        => 'GPL-3.0-or-later',
            'GPL-3.0-only'   => 'GPL-3.0-or-later',
            'LGPL-3.0'       => 'LGPL-3.0-or-later',
            'Apache 2.0'     => 'Apache-2.0',
            'Apache-2'       => 'Apache-2.0',
        );

        /**
         * @return array<string, int>
         */
        public static function limits_for_form() {
            return array(
                'mediaVideos'               => self::LIMIT_MEDIA_VIDEOS,
                'mediaImages'               => self::LIMIT_MEDIA_IMAGES,
                'customerStories'           => self::LIMIT_CUSTOMER_STORIES,
                'recognitionsCertifications' => self::LIMIT_CERTIFICATIONS,
                'awardsAndRecognitions'     => self::LIMIT_AWARDS,
                'additionalDocumentation'   => self::LIMIT_ADDITIONAL_DOCUMENTATION,
                'recognitionTitle'          => self::LIMIT_RECOGNITION_TITLE,
                'licenseOther'              => self::LIMIT_LICENSE_OTHER,
                'pricing'                   => self::LIMIT_PRICING,
            );
        }

        /**
         * @return array<string, string>
         */
        public static function deployment_model_labels() {
            return array(
                'saas'         => 'SaaS',
                'on_premises'  => 'On-premises',
                'hybrid'       => 'Hybrid',
            );
        }

        /**
         * Human-readable license labels for submission forms (stored values unchanged).
         *
         * @return array<string, string>
         */
        public static function license_labels() {
            return array(
                'MIT'                 => 'MIT',
                'Apache-2.0'          => 'Apache-2.0',
                'GPL-3.0-or-later'    => 'GPL-3.0 or later',
                'AGPL-3.0-or-later'   => 'AGPL-3.0 or later',
                'LGPL-3.0-or-later'   => 'LGPL-3.0 or later',
                'EUPL-1.2'            => 'EUPL-1.2',
                'MPL-2.0'             => 'MPL-2.0',
                'BSD-3-Clause'        => 'BSD-3-Clause',
                'ISC'                 => 'ISC',
                'proprietary'         => 'Proprietary (closed source)',
                'other'               => 'Other',
            );
        }

        /**
         * @param mixed $raw License string from form or legacy catalog.
         * @return array{license?: string, licenseOther?: string}
         */
        public static function normalize_license($raw) {
            if (! is_string($raw)) {
                return array();
            }
            $trimmed = trim($raw);
            if ($trimmed === '') {
                return array();
            }
            if (in_array($trimmed, self::LICENSE_VALUES, true)) {
                return array('license' => $trimmed);
            }
            if (isset(self::LICENSE_ALIASES[ $trimmed ])) {
                return array('license' => self::LICENSE_ALIASES[ $trimmed ]);
            }
            if (preg_match('/apache/i', $trimmed) && preg_match('/2(\.0)?/i', $trimmed)) {
                return array('license' => 'Apache-2.0');
            }
            if (strcasecmp($trimmed, 'mit') === 0) {
                return array('license' => 'MIT');
            }
            if (preg_match('/proprietary/i', $trimmed)) {
                return array('license' => 'proprietary');
            }
            return array(
                'license'      => 'other',
                'licenseOther' => self::truncate_text($trimmed, self::LIMIT_LICENSE_OTHER),
            );
        }

        /**
         * Normalize wallet payload fields to v2 (idempotent).
         *
         * @param array<string, mixed> $wallet Wallet fields.
         * @return array<string, mixed>
         */
        public static function normalize_wallet(array $wallet) {
            $out = $wallet;

            unset($out['video'], $out['certifications']);

            $media = self::normalize_media($wallet);
            if ($media !== array()) {
                $out['media'] = $media;
            } else {
                unset($out['media']);
            }

            $recognitions = self::normalize_recognitions($wallet);
            if ($recognitions !== array()) {
                $out['recognitions'] = $recognitions;
            } else {
                unset($out['recognitions']);
            }

            $additional_documentation = self::normalize_recognition_items(
                $wallet['additionalDocumentation'] ?? array(),
                self::LIMIT_ADDITIONAL_DOCUMENTATION
            );
            if ($additional_documentation !== array()) {
                $out['additionalDocumentation'] = $additional_documentation;
            } else {
                unset($out['additionalDocumentation']);
            }

            if (array_key_exists('license', $wallet)) {
                $license_other = isset($wallet['licenseOther']) ? (string) $wallet['licenseOther'] : '';
                if ($license_other !== '' && (! isset($wallet['license']) || $wallet['license'] === 'other')) {
                    $out['license'] = 'other';
                    $out['licenseOther'] = self::truncate_text($license_other, self::LIMIT_LICENSE_OTHER);
                } else {
                    $normalized_license = self::normalize_license($wallet['license'] ?? '');
                    if (! empty($normalized_license['license'])) {
                        $out['license'] = $normalized_license['license'];
                        if (($out['license'] ?? '') === 'other') {
                            $other = $license_other !== ''
                                ? $license_other
                                : ( $normalized_license['licenseOther'] ?? '' );
                            if ($other !== '') {
                                $out['licenseOther'] = self::truncate_text($other, self::LIMIT_LICENSE_OTHER);
                            } else {
                                unset($out['licenseOther']);
                            }
                        } else {
                            unset($out['licenseOther']);
                        }
                    } else {
                        unset($out['license'], $out['licenseOther']);
                    }
                }
            }

            if (isset($out['deploymentModel'])) {
                $model = sanitize_key((string) $out['deploymentModel']);
                if (in_array($model, self::DEPLOYMENT_MODELS, true)) {
                    $out['deploymentModel'] = $model;
                } else {
                    unset($out['deploymentModel']);
                }
            }

            if (array_key_exists('slaAvailable', $out)) {
                $out['slaAvailable'] = (bool) $out['slaAvailable'];
                if (! $out['slaAvailable']) {
                    unset($out['slaAvailable']);
                }
            }

            $wallet_type = isset($out['type']) ? sanitize_key((string) $out['type']) : '';
            if ($wallet_type !== 'organizational') {
                unset($out['deploymentModel'], $out['slaAvailable']);
            }

            if (isset($out['pricing'])) {
                $pricing = self::truncate_text(trim((string) $out['pricing']), self::LIMIT_PRICING);
                if ($pricing !== '') {
                    $out['pricing'] = $pricing;
                } else {
                    unset($out['pricing']);
                }
            }

            $out = self::apply_open_source_from_license($out);

            return $out;
        }

        /**
         * Derive openSource from license when license is set.
         *
         * @param array<string, mixed> $wallet Normalized wallet fields.
         * @return array<string, mixed>
         */
        public static function apply_open_source_from_license(array $wallet) {
            if (! isset($wallet['license']) || ! is_string($wallet['license'])) {
                return $wallet;
            }
            $license = trim($wallet['license']);
            if ($license === '') {
                return $wallet;
            }
            if ($license === 'proprietary') {
                $wallet['openSource'] = false;
                return $wallet;
            }
            if ($license === 'other') {
                $other = isset($wallet['licenseOther']) ? (string) $wallet['licenseOther'] : '';
                $wallet['openSource'] = ! preg_match('/proprietary/i', $other);
                return $wallet;
            }
            $wallet['openSource'] = true;
            return $wallet;
        }

        /**
         * @param array<string, mixed> $wallet Wallet fields (may include legacy v1 keys).
         * @return array{videos?: string[], images?: string[]}
         */
        public static function normalize_media(array $wallet) {
            $videos = array();
            $images = array();

            if (isset($wallet['media']) && is_array($wallet['media'])) {
                foreach (array('videos', 'images') as $key) {
                    if (! isset($wallet['media'][ $key ]) || ! is_array($wallet['media'][ $key ])) {
                        continue;
                    }
                    foreach ($wallet['media'][ $key ] as $url) {
                        $clean = esc_url_raw(trim((string) $url));
                        if ($clean === '') {
                            continue;
                        }
                        if ($key === 'videos' && ! in_array($clean, $videos, true)) {
                            $videos[] = $clean;
                        }
                        if ($key === 'images' && ! in_array($clean, $images, true)) {
                            $images[] = $clean;
                        }
                    }
                }
            }

            if (isset($wallet['video'])) {
                $legacy = esc_url_raw(trim((string) $wallet['video']));
                if ($legacy !== '' && ! in_array($legacy, $videos, true)) {
                    array_unshift($videos, $legacy);
                }
            }

            $media = array();
            if ($videos !== array()) {
                $media['videos'] = array_slice($videos, 0, self::LIMIT_MEDIA_VIDEOS);
            }
            if ($images !== array()) {
                $media['images'] = array_slice($images, 0, self::LIMIT_MEDIA_IMAGES);
            }

            return $media;
        }

        /**
         * @param array<string, mixed> $wallet Wallet fields.
         * @return array<string, array<int, array{title: string, url?: string}>>
         */
        public static function normalize_recognitions(array $wallet) {
            $out = array();
            $source = isset($wallet['recognitions']) && is_array($wallet['recognitions'])
                ? $wallet['recognitions']
                : array();

            $customer = self::normalize_recognition_items(
                $source['customerStories'] ?? array(),
                self::LIMIT_CUSTOMER_STORIES
            );
            if ($customer !== array()) {
                $out['customerStories'] = $customer;
            }

            $certs = self::normalize_recognition_items(
                $source['certifications'] ?? array(),
                self::LIMIT_CERTIFICATIONS
            );
            if ($certs === array() && isset($wallet['certifications']) && is_array($wallet['certifications'])) {
                $legacy = array();
                foreach ($wallet['certifications'] as $label) {
                    $legacy[] = array('title' => (string) $label);
                }
                $certs = self::normalize_recognition_items($legacy, self::LIMIT_CERTIFICATIONS);
            }
            if ($certs !== array()) {
                $out['certifications'] = $certs;
            }

            $awards = self::normalize_recognition_items(
                $source['awardsAndRecognitions'] ?? array(),
                self::LIMIT_AWARDS
            );
            if ($awards !== array()) {
                $out['awardsAndRecognitions'] = $awards;
            }

            return $out;
        }

        /**
         * @param mixed  $raw Raw list of recognition items or legacy strings.
         * @param int    $max Max items.
         * @return array<int, array{title: string, url?: string}>
         */
        public static function normalize_recognition_items($raw, $max) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $entry) {
                if (is_string($entry)) {
                    $entry = array('title' => $entry);
                }
                if (! is_array($entry)) {
                    continue;
                }
                $title = isset($entry['title']) ? self::truncate_text(trim((string) $entry['title']), self::LIMIT_RECOGNITION_TITLE) : '';
                if ($title === '') {
                    continue;
                }
                $item = array('title' => $title);
                if (! empty($entry['url'])) {
                    $url = esc_url_raw(trim((string) $entry['url']));
                    if ($url !== '') {
                        $item['url'] = $url;
                    }
                }
                $out[] = $item;
                if (count($out) >= $max) {
                    break;
                }
            }
            return $out;
        }

        /**
         * @param array<string, mixed> $payload Normalized wallet submission payload.
         * @return true|WP_Error
         */
        public static function validate_wallet_v2_rules(array $payload) {
            if (isset($payload['license']) && $payload['license'] === 'other') {
                $other = isset($payload['licenseOther']) ? trim((string) $payload['licenseOther']) : '';
                if ($other === '') {
                    return new WP_Error(
                        'fides_wallet_invalid',
                        __('Please specify the license when "Other" is selected.', 'fides-wallet-catalog')
                    );
                }
            }

            if (isset($payload['media']) && is_array($payload['media'])) {
                $videos = isset($payload['media']['videos']) && is_array($payload['media']['videos'])
                    ? $payload['media']['videos']
                    : array();
                $images = isset($payload['media']['images']) && is_array($payload['media']['images'])
                    ? $payload['media']['images']
                    : array();
                if ($videos === array() && $images === array()) {
                    return new WP_Error(
                        'fides_wallet_invalid',
                        __('Media must include at least one video or image URL.', 'fides-wallet-catalog')
                    );
                }
                if (count($videos) > self::LIMIT_MEDIA_VIDEOS || count($images) > self::LIMIT_MEDIA_IMAGES) {
                    return new WP_Error(
                        'fides_wallet_invalid',
                        __('Too many media items (check video and image limits).', 'fides-wallet-catalog')
                    );
                }
            }

            return true;
        }

        /**
         * @param string $text Text.
         * @param int    $max  Max length.
         * @return string
         */
        private static function truncate_text($text, $max) {
            if (function_exists('mb_substr')) {
                return mb_substr($text, 0, $max);
            }
            return substr($text, 0, $max);
        }
    }
}
