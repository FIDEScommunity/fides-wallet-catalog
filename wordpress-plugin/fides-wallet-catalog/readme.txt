=== FIDES Wallet Catalog ===
Contributors: fidescommunity
Tags: wallet, identity, did, ssi, credentials
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Displays the FIDES Wallet Catalog with search and filter functionality on your WordPress website.

== Description ==

The FIDES Wallet Catalog plugin displays an interactive catalog of digital identity wallets. 
Wallet providers manage their own information via DID documents, ensuring up-to-date and 
reliable data.

**Features:**

* Search by name, description and provider
* Filters by type (personal/organizational), platform and credential format
* Responsive design with dark and light themes
* Simple shortcode integration
* Automatic updates via FIDES API

== Installation ==

1. Upload the `fides-wallet-catalog` folder to `/wp-content/plugins/`
2. Activate the plugin via 'Plugins' in WordPress
3. Go to Settings > FIDES Wallet Catalog to configure the API URL
4. Use the shortcode `[fides_wallet_catalog]` on a page or post

== Shortcode Usage ==

Basic usage:
`[fides_wallet_catalog]`

With options:
`[fides_wallet_catalog type="personal" columns="2" theme="light"]`

**Available options:**

* `type` - Filter by wallet type: personal, organizational, both
* `show_filters` - Show filters: true (default) or false
* `show_search` - Show search bar: true (default) or false
* `columns` - Number of columns: 1, 2, 3 (default), 4
* `theme` - Color theme: dark (default) or light

== Frequently Asked Questions ==

= How is the wallet data updated? =

The plugin fetches data from the FIDES API, which periodically crawls wallet catalogs from 
registered providers. Providers manage their own data via DID documents.

= Can I customize the styling? =

Yes, the plugin uses CSS classes that you can override in your theme's stylesheet.

= Does this work with page builders? =

Yes, the shortcode works with all common page builders like Elementor, Divi and Gutenberg.

== Screenshots ==

1. Wallet catalog with search and filters
2. Wallet card with details
3. Admin settings page

== Changelog ==

= 1.0.0 =
* Initial release
* Search and filters
* Dark and light theme
* Responsive grid layout

== Upgrade Notice ==

= 1.0.0 =
Initial release of the FIDES Wallet Catalog plugin.
