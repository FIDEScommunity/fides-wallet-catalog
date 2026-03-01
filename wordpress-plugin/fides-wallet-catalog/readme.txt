=== FIDES Wallet Catalog ===
Contributors: fideslabs
Tags: wallet, identity, eudi, digital identity, credentials, verifiable credentials
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 2.1.9
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Displays the FIDES Wallet Catalog with search and filter functionality on your WordPress website.

== Description ==

The FIDES Wallet Catalog plugin displays an interactive catalog of 70+ digital identity wallets from around the world, including national EUDI Wallets and commercial solutions.

**Developed and maintained by FIDES Labs BV**

Wallet providers contribute their wallet information via GitHub Pull Requests to a community-maintained repository, ensuring up-to-date and reliable data.

**Features:**

* 70+ wallets from national governments and commercial providers
* Advanced search by name, description and provider
* Extensive filters: type, platform, credential format, issuance/presentation protocols, interoperability profiles, and more
* Filter option counters: each option shows how many wallets match (e.g. Personal (52), SD-JWT-VC (48))
* Sort options including "Last updated" and A-Z
* Quick filters including "Added last 30 days" and "Includes video"
* Key figure tiles for total wallets, recently added, recently updated, and countries
* Responsive design with dark and light themes
* Simple shortcode integration: `[fides_wallet_catalog]`
* Automatic daily updates from GitHub repository
* Detailed wallet information including app store links, certifications, and technical specs
* Semantic date display on cards ("Added" for new wallets, "Updated" otherwise)

== Installation ==

1. Upload the `fides-wallet-catalog` folder to `/wp-content/plugins/`
2. Activate the plugin via 'Plugins' in WordPress
3. (Optional) Go to Settings > FIDES Wallet Catalog to configure a custom data source
4. Use the shortcode `[fides_wallet_catalog]` on any page or post

The plugin automatically fetches wallet data from the FIDES Community GitHub repository.

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

The plugin fetches data from the FIDES Community GitHub repository (https://github.com/FIDEScommunity/fides-wallet-catalog), where wallet providers contribute their information via Pull Requests. The aggregated data is automatically updated daily via GitHub Actions.

= How can I add my wallet to the catalog? =

Submit a Pull Request to the FIDES Wallet Catalog repository with your wallet information in JSON format. See the repository documentation for the full schema and examples.

= Can I customize the styling? =

Yes, the plugin uses CSS classes (prefixed with `fides-`) that you can override in your theme's stylesheet.

= Does this work with page builders? =

Yes, the shortcode works with all common page builders like Elementor, Divi, Gutenberg, and others.

= What types of wallets are included? =

The catalog includes both personal wallets (for citizens/consumers) and organizational wallets (for enterprises). This includes national EUDI Wallets from EU member states and commercial wallets from vendors worldwide.

= Is this plugin free? =

Yes, this plugin is open source under the Apache-2.0 license and completely free to use.

== Screenshots ==

1. Wallet catalog with search and filters
2. Wallet card with details
3. Admin settings page

== Changelog ==

= 1.8.0 =
* Added deep link support: wallets can now be opened directly via URL parameter (e.g., `?wallet=sphereon-wallet`)
* Enables linking from RP Catalog to specific wallets
* Minor code optimizations

= 2.1.9 =
* Added filter option counters: each sidebar filter shows how many wallets match (e.g. Personal (52), SD-JWT-VC (48))
* Counts are computed over the visible dataset (respects shortcode type when set)

= 2.1.8 =
* Added sort dropdown in results controls with "Last updated" default
* Added quick filters for "Added last 30 days" and "Includes video"
* Added key figure row above results
* Improved date semantics in UI by using `updatedAt` / `firstSeenAt` from aggregated data
* Updated card activity label to show "Added <date>" for new wallets and "Updated <date>" for others

= 1.7.8 =
* Updated credential format filters (Apple Wallet Pass, Google Wallet Pass)
* Improved mobile search functionality
* Enhanced platform tag styling for app store links
* UI/UX improvements for wallet cards and modal popups
* Bug fixes and performance improvements

= 1.7.0 =
* Added signing algorithms filter
* Added interoperability profiles filter
* Improved filter UI consistency
* Enhanced organizational wallet display

= 1.0.0 =
* Initial release
* Search and filters
* Dark and light theme
* Responsive grid layout

== Upgrade Notice ==

= 2.1.9 =
Adds filter option counters so you can see how many wallets match each filter at a glance.

= 2.1.8 =
Adds sorting, quick filters, key figures and improved update visibility in wallet cards.

= 1.7.8 =
Enhanced UI/UX and support for new credential formats. Recommended update.

== Developer ==

Developed and maintained by **FIDES Labs BV**
Website: https://fides.community
GitHub: https://github.com/FIDEScommunity/fides-wallet-catalog

© 2026 FIDES Labs BV - Licensed under Apache-2.0
