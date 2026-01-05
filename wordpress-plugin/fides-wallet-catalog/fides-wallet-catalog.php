<?php
/**
 * Plugin Name: FIDES Wallet Catalog
 * Plugin URI: https://fides.community
 * Description: Displays the FIDES Wallet Catalog with search and filter functionality
 * Version: 1.0.0
 * Author: FIDES Community
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

class FIDES_Wallet_Catalog {
    
    private static $instance = null;
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
        // Assets are only loaded when the shortcode is used
        wp_register_style(
            'fides-wallet-catalog',
            $this->plugin_url . 'assets/style.css',
            array(),
            '1.0.0'
        );
        
        wp_register_script(
            'fides-wallet-catalog',
            $this->plugin_url . 'assets/wallet-catalog.js',
            array(),
            '1.0.0',
            true
        );
        
        // Pass data to JavaScript
        wp_localize_script('fides-wallet-catalog', 'fidesWalletCatalog', array(
            'apiUrl' => get_option('fides_api_url', 'https://api.fides.community'),
            'pluginUrl' => $this->plugin_url,
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
            'theme' => 'dark', // dark or light
        ), $atts);
        
        // Enqueue assets
        wp_enqueue_style('fides-wallet-catalog');
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
        if (isset($_POST['fides_save_settings']) && check_admin_referer('fides_settings')) {
            update_option('fides_api_url', sanitize_url($_POST['fides_api_url']));
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        $api_url = get_option('fides_api_url', 'https://api.fides.community');
        ?>
        <div class="wrap">
            <h1>FIDES Wallet Catalog Settings</h1>
            
            <form method="post">
                <?php wp_nonce_field('fides_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">API URL</th>
                        <td>
                            <input type="url" name="fides_api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text">
                            <p class="description">URL to the FIDES Wallet Catalog API</p>
                        </td>
                    </tr>
                </table>
                
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
                            <td>dark, light</td>
                            <td>Color theme</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3>Examples</h3>
                <p><code>[fides_wallet_catalog type="personal" columns="2"]</code> - Personal wallets only, 2 columns</p>
                <p><code>[fides_wallet_catalog show_filters="false" theme="light"]</code> - Without filters, light theme</p>
                
                <p class="submit">
                    <input type="submit" name="fides_save_settings" class="button-primary" value="Save Settings">
                </p>
            </form>
        </div>
        <?php
    }
}

// Initialize plugin
FIDES_Wallet_Catalog::get_instance();
