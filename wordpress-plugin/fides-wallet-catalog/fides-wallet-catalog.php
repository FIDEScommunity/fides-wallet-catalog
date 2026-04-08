<?php
/**
 * Plugin Name: FIDES Wallet Catalog
 * Plugin URI: https://fides.community
 * Description: Displays the FIDES Wallet Catalog with search and filter functionality
 * Version: 2.5.8
 * Author: FIDES Labs BV
 * Author URI: https://fides.community
 * License: Apache-2.0
 * License URI: https://www.apache.org/licenses/LICENSE-2.0
 * 
 * © 2026 FIDES Labs BV
 * Developed and maintained by FIDES Labs BV
 */

if (!defined('ABSPATH')) {
    exit;
}

class FIDES_Wallet_Catalog {
    
    private static $instance = null;
    private const VERSION = '2.5.8';
    private $plugin_url;
    private $plugin_path;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);
        
        add_action('init', array($this, 'register_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'register_assets'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Register the shortcode
     */
    public function register_shortcode() {
        add_shortcode('fides_wallet_catalog', array($this, 'render_shortcode'));
    }
    
    /**
     * Register CSS and JS assets
     */
    public function register_assets() {
        $ui_lib_css_path = $this->plugin_path . 'assets/lib/fides-catalog-ui.css';
        $ui_lib_js_path = $this->plugin_path . 'assets/lib/fides-catalog-ui.js';
        $ui_lib_css_version = file_exists($ui_lib_css_path) ? filemtime($ui_lib_css_path) : self::VERSION;
        $ui_lib_js_version = file_exists($ui_lib_js_path) ? filemtime($ui_lib_js_path) : self::VERSION;

        // Assets are only loaded when the shortcode is used
        wp_register_style(
            'fides-wallet-catalog',
            $this->plugin_url . 'assets/style.css',
            array(),
            self::VERSION
        );
        wp_register_style(
            'fides-wallet-catalog-ui-lib',
            $this->plugin_url . 'assets/lib/fides-catalog-ui.css',
            array(),
            $ui_lib_css_version
        );
        wp_register_script(
            'fides-wallet-catalog-ui-lib',
            $this->plugin_url . 'assets/lib/fides-catalog-ui.js',
            array(),
            $ui_lib_js_version,
            true
        );
        
        wp_register_script(
            'fides-wallet-catalog',
            $this->plugin_url . 'assets/wallet-catalog.js',
            array('fides-wallet-catalog-ui-lib'),
            self::VERSION,
            true
        );
        
        // Pass data to JavaScript
        wp_localize_script('fides-wallet-catalog', 'fidesWalletCatalog', array(
            'pluginUrl' => $this->plugin_url,
            'githubDataUrl' => 'https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json',
            'vocabularyUrl' => 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json',
            'vocabularyFallbackUrl' => $this->plugin_url . 'assets/vocabulary.json',
            'mapPageUrl' => get_option('fides_wallet_catalog_map_url', 'https://fides.community/community-tools/map/'),
            'organizationCatalogUrl' => get_option(
                'fides_wallet_catalog_organization_catalog_url',
                'https://fides.community/ecosystem-explorer/organization-catalog/'
            ),
            'bluePagesUrl' => get_option(
                'fides_wallet_catalog_blue_pages_url',
                'https://fides.community/community-tools/blue-pages'
            ),
        ));
    }
    
    /**
     * Render the shortcode
     */
    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'type' => '', // Filter by type: personal, organizational, both
            'show_filters' => 'true',
            'show_search' => 'true',
            'columns' => '3',
            'theme' => 'fides', // fides, light, or dark
        ), $atts);
        
        // Enqueue assets
        wp_enqueue_style('fides-wallet-catalog');
        wp_enqueue_script('fides-wallet-catalog-ui-lib');
        wp_enqueue_script('fides-wallet-catalog');
        
        // Data attributes for configuration
        $data_attrs = sprintf(
            'data-type="%s" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s"',
            esc_attr($atts['type']),
            esc_attr($atts['show_filters']),
            esc_attr($atts['show_search']),
            esc_attr($atts['columns']),
            esc_attr($atts['theme'])
        );
        
        // Container where React mounts
        return sprintf(
            '<div id="fides-wallet-catalog-root" class="fides-wallet-catalog" %s>
                <div class="fides-loading">
                    <div class="fides-spinner"></div>
                    <p>Loading wallet catalog...</p>
                </div>
            </div>',
            $data_attrs
        );
    }
    
    /**
     * Register options (Settings → FIDES Wallet Catalog)
     */
    public function register_settings() {
        register_setting('fides_wallet_catalog_settings', 'fides_wallet_catalog_map_url', array(
            'type' => 'string',
            'default' => 'https://fides.community/community-tools/map/',
            'sanitize_callback' => 'esc_url_raw',
        ));
        register_setting('fides_wallet_catalog_settings', 'fides_wallet_catalog_organization_catalog_url', array(
            'type' => 'string',
            'default' => 'https://fides.community/ecosystem-explorer/organization-catalog/',
            'sanitize_callback' => 'esc_url_raw',
        ));
        register_setting('fides_wallet_catalog_settings', 'fides_wallet_catalog_blue_pages_url', array(
            'type' => 'string',
            'default' => 'https://fides.community/community-tools/blue-pages',
            'sanitize_callback' => 'esc_url_raw',
        ));
    }

    /**
     * Admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'FIDES Wallet Catalog',
            'FIDES Wallet Catalog',
            'manage_options',
            'fides-wallet-catalog',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * Admin page
     */
    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>FIDES Wallet Catalog</h1>
            
            <p>This plugin displays the FIDES Wallet Catalog on your website. Data is automatically loaded from the <a href="https://github.com/FIDEScommunity/fides-wallet-catalog" target="_blank">FIDES GitHub repository</a>.</p>

            <form method="post" action="options.php">
                <?php settings_fields('fides_wallet_catalog_settings'); ?>
                <h2>Settings</h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="fides_wallet_catalog_map_url">Map page URL</label></th>
                        <td>
                            <input type="url" id="fides_wallet_catalog_map_url" name="fides_wallet_catalog_map_url"
                                   value="<?php echo esc_attr(get_option('fides_wallet_catalog_map_url', 'https://fides.community/community-tools/map/')); ?>"
                                   class="regular-text">
                            <p class="description">URL of the FIDES catalog map page. Used for the &quot;Show on map&quot; link.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fides_wallet_catalog_organization_catalog_url">Organization catalog URL</label></th>
                        <td>
                            <input type="url" id="fides_wallet_catalog_organization_catalog_url" name="fides_wallet_catalog_organization_catalog_url"
                                   value="<?php echo esc_attr(get_option('fides_wallet_catalog_organization_catalog_url', 'https://fides.community/ecosystem-explorer/organization-catalog/')); ?>"
                                   class="regular-text">
                            <p class="description">Page URL of the FIDES Organization Catalog. Used for <code>?org=org:…</code> deep links when opening a wallet modal (provider name). Use the same value as in the RP Catalog settings if both plugins are installed.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fides_wallet_catalog_blue_pages_url">Blue Pages URL</label></th>
                        <td>
                            <input type="url" id="fides_wallet_catalog_blue_pages_url" name="fides_wallet_catalog_blue_pages_url"
                                   value="<?php echo esc_attr(get_option('fides_wallet_catalog_blue_pages_url', 'https://fides.community/community-tools/blue-pages')); ?>"
                                   class="regular-text">
                            <p class="description">Base URL for Blue Pages DID lookups (trailing slash optional).</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>

            <h2>Shortcode Usage</h2>
                <p>Use the following shortcode to display the wallet catalog:</p>
                <code>[fides_wallet_catalog]</code>
                
                <h3>Options</h3>
                <table class="widefat" style="max-width: 800px;">
                    <thead>
                        <tr>
                            <th>Attribute</th>
                            <th>Values</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>type</code></td>
                            <td>personal, organizational, both</td>
                            <td>Filter by wallet type</td>
                        </tr>
                        <tr>
                            <td><code>show_filters</code></td>
                            <td>true, false</td>
                            <td>Show/hide filters</td>
                        </tr>
                        <tr>
                            <td><code>show_search</code></td>
                            <td>true, false</td>
                            <td>Show/hide search bar</td>
                        </tr>
                        <tr>
                            <td><code>columns</code></td>
                            <td>1, 2, 3, 4</td>
                            <td>Number of columns</td>
                        </tr>
                        <tr>
                            <td><code>theme</code></td>
                            <td>fides, light, dark</td>
                            <td>Color theme (fides = FIDES brand colors)</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3>Examples</h3>
                <p><code>[fides_wallet_catalog]</code> - Default with FIDES theme</p>
                <p><code>[fides_wallet_catalog type="personal" columns="2"]</code> - Personal wallets only, 2 columns</p>
                <p><code>[fides_wallet_catalog theme="dark"]</code> - Dark theme variant</p>
        </div>
        <?php
    }
}

// Initialize plugin
FIDES_Wallet_Catalog::get_instance();
