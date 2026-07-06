=== FIDES Wallet Catalog ===
Contributors: fideslabs
Tags: wallet, identity, eudi, digital identity, credentials, verifiable credentials
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 2.9.9
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Displays the FIDES Wallet Catalog with search and filter functionality on your WordPress website.

== Description ==

The FIDES Wallet Catalog plugin displays an interactive catalog of 70+ digital identity wallets from around the world, including national EUDI Wallets and commercial solutions.

**Developed and maintained by FIDES Labs BV**

Wallet providers add and update listings on fides.community via WordPress submission forms (recommended), or contribute JSON via GitHub Pull Requests. Published data is aggregated into a community-maintained catalog updated daily.

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
* WordPress submission forms for adding wallets and suggesting updates (requires fides-community-tools-tiles with catalog submissions enabled)

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

**Submission forms (logged-in users only, requires fides-community-tools-tiles):**

* `[fides_wallet_submit_form]` — add a new wallet to the catalog (moderated before publish)
* `[fides_wallet_update_form]` — suggest changes to an existing wallet (`?wallet=` pre-selects the wallet)

Configure the update form page URL under Settings → FIDES Wallet Catalog so the pencil icon in the wallet modal links to your update page.

== Frequently Asked Questions ==

= How is the wallet data updated? =

The plugin loads `data/aggregated.json` from the FIDES Wallet Catalog GitHub repository (https://github.com/FIDEScommunity/fides-wallet-catalog). That file is rebuilt daily by GitHub Actions from community-catalog JSON, including entries published from WordPress submission forms on fides.community.

= How can I add my wallet to the catalog? =

**Recommended:** Sign in on fides.community and use the page with `[fides_wallet_submit_form]` (your organization must already be listed in the organization catalog). Your submission is reviewed in **Tools → Catalog Submissions** before it is published and synced to GitHub.

**Alternative:** Submit a Pull Request to the FIDES Wallet Catalog repository with your `wallet-catalog.json` (schema v2). See the repository README and docs/GITHUB_REPO_STRUCTURE.md.

Need help? Contact catalog@fides.community.

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

= 2.9.9 =
* Wallet modal and grid cards: country flag replaced with globe icon and full country name (bundled fides-catalog-ui from tiles ≥ 1.8.19).

= 2.9.8 =
* Pro listing edit: update form only for linked owner or WP admin when wallet/org listing is Pro. Synced modal library edit-access checks.

= 2.9.7 =
* Fix Pro plan field badges on Community wallet listings (linked badge again). Requires tiles ≥ 1.8.7.

= 2.9.6 =
* Submission form: static Pro plan field badges when the signed-in user owns a linked Pro org (requires tiles ≥ 1.8.6).

= 2.9.5 =
* Submission form: show Pro plan badge on Pro-only field labels for Pro accounts too (static badge, no plans link).

= 2.9.4 =
* Pro listing cards: personal wallets use a blue accent border (grid and list view); business wallets keep purple. Pro badges stay purple on all types.

= 2.9.3 =
* Fix grid card listing badge: pass editAccess to shared badge helper so Pro wallets show Official Listing (was Community on cards while modal was correct).

= 2.9.2 =
* Synced `fides-catalog-ui` from tiles 1.8.5 (Community org contact footer gate in shared modal).

= 2.9.1 =
* Synced `fides-catalog-ui`: wallet modal Contact footer uses mailto from provider `contact.email`.
* Requires fides-community-tools-tiles ≥ 1.8.4.

= 2.9.0 =
* Wallet catalog schema v2: community catalogs migrated to v2 (`media`, structured `recognitions`, `license` enum); CI validates v2 only.
* Submission forms: media (videos/images), recognitions, deployment model, SLA, pricing, and license dropdown with "Other" text.
* Server-side v2 normalizer validates Pro field limits and tier export rules (requires fides-community-tools-tiles ≥ 1.8.0 for wallet v2 Pro export keys: `media`, `recognitions`, `pricing`).
* Grid cards aligned with organization catalog (listing pills, logo/likes layout); list view official badge fix; requires synced `fides-catalog-ui` from tiles ≥ 1.8.3.

= 2.8.3 =
* Respects master switch `fides_catalog_tier_ui_enabled` from fides-community-tools-tiles (default off): Official filter/badges hidden until tier go-live.

= 2.8.2 =
* Mobile detail modal and filter layout aligned with shared `fides-catalog-ui` (requires fides-community-tools-tiles ≥ 1.7.8 when using the bundled UI library).
* Official filter renamed to “Official listings only”; badge hover text uses “managed by the provider”.
* Requires updated `assets/lib/fides-catalog-ui.css` and `.js` in sync with fides-community-tools-tiles 1.7.8.

= 2.8.1 =
* Vocabulary (i) help popups on wallet submit/update forms for technical fields (formats, protocols, identifiers, etc.).
* Human-readable VC format labels in submission forms, aligned with catalog filters.
* Vocabulary popups show option descriptions only when available (no empty list entries).

= 2.8.0 =
* Added WordPress submission flow: `[fides_wallet_submit_form]` and `[fides_wallet_update_form]` shortcodes (shared moderation in fides-community-tools-tiles).
* Modal “Suggest an update” pencil links to the configured update form page with `?wallet=` pre-filled.
* Published submissions export to the community catalog via the GitHub import pipeline (`npm run import-wp-submissions`). See `fides-community-tools-tiles/docs/CATALOG-SUBMISSION-GOVERNANCE.md` (§14–16) for CI workflow, production deploy, and wallet-specific crawl env `FIDES_WALLET_SKIP_GITHUB_CRAWL`.

= 2.7.6 =
* Refined wallet list-view table density: removed "Updated/Added" prefixes from the Updated column and rebalanced column widths to give more space to Provider.

= 2.7.5 =
* Fixed list-view Web platform icon rendering so globe stroke icons keep their shape while linked platform icons remain high-contrast across themes.

= 2.7.4 =
* Fixed production theme CSS override issue where list-view platform icons in clickable buttons could render with dark fill; icons are now force-rendered white for consistent contrast.

= 2.7.3 =
* Added desktop list view toggle (grid/list) for the wallet overview, aligned with issuer/credential catalogs.
* Added wallet list rows with columns for Name, Provider, Platforms and Updated date.
* Platforms in list view now show icon buttons with clear visual distinction between clickable store links and non-clickable icons.
* Improved list layout/alignment (name left align, provider width, compact platforms column) and fixed updated-date overflow at row boundaries.

= 2.7.0 =
* Refactor: `Fides_Wallet_Catalog_SSR` now extends the shared `Fides_Catalog_SSR_Renderer` base class shipped by fides-community-tools-tiles ≥ 1.6.2. The wallet-specific class shrunk by ~270 lines (no behaviour change) — all noscript wrapper, listing grid, detail-block shell and CollectionPage JSON-LD output now live in the base class. The wallet plugin still owns: catalog registration, `type` based URL routing, render-gate per page, JSON-LD enrichment with wallet fields, dl meta rows, app-store + chip sections.
* When the shared core is missing (tiles plugin disabled), the wallet SSR class falls back to a no-op shim with the same public surface so the main plugin file keeps working.
* No deprecations: the static `bootstrap()`, `build_initial_html()` and four `OPTION_* / DEFAULT_*_PATH` constants stay in place.

= 2.6.1 =
* Expanded the SSR detail block so search engines see the full wallet record, not just the basics:
  * New visible sections for Features, Credential formats, Issuance protocols, Presentation protocols, Signing algorithms, Credential status methods, App store links, Repository, Open source, Provider country and Last updated.
  * `SoftwareApplication` JSON-LD enriched with `featureList`, `keywords`, `softwareRequirements`, `installUrl`, `dateModified`, `sameAs` (repository) and a free `offers` block. The JSON-LD now uses the full description (no longer truncated to 160 characters).

= 2.6.0 =
* SEO / SSR integration with the shared FIDES catalog SEO core (requires fides-community-tools-tiles ≥ 1.6.0; gated behind the master `fides_catalog_ssr_enabled` switch).
  * Server-rendered listing fallback: up to 30 wallets are rendered as static HTML inside the shortcode container so search engines (and visitors with JavaScript disabled) see real content immediately. JS replaces the fallback on mount.
  * Server-rendered detail block: when a deeplink such as `?wallet=helix-id-wallet` is present, the matching wallet is rendered as a static `<article>` above the listing.
  * Per-deeplink SEO meta tags: `<title>`, meta description, canonical, Open Graph, Twitter and a `SoftwareApplication` JSON-LD payload with `operatingSystem`, `applicationCategory`, `downloadUrl` and `publisher`.
  * Listing pages emit a `CollectionPage` JSON-LD with the first 50 wallets as `ItemList` entries.
  * Detail SEO is correctly gated per page: an organizational wallet won't render its SEO on `/personal-wallets/` and vice versa.
  * Two new admin settings (Settings → FIDES Wallet Catalog) to override the personal/business page paths if your URL structure differs from the defaults.
* JavaScript safety net: when no wallets can be loaded (e.g. GitHub temporarily unreachable), the server-rendered fallback is preserved instead of being overwritten with an empty interactive UI.

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
