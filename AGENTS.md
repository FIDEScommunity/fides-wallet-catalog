# Agent notes

## Cursor Cloud specific instructions

Plugin code lives in `wordpress-plugin/fides-wallet-catalog`. The shared SSR and modal core lives in the separate repo `fides-community-tools-tiles`, not in this one.

- Open a pull request. Do not merge it. Do not deploy. Do not SSH to any server.
- Do not change `fides-community-tools-tiles` unless the task says tiles may change.
- Extend `Fides_Catalog_SSR_Renderer`. Do not rebuild the listing grid, chip sections, or CollectionPage JSON-LD in this plugin.
- Open and close modals only through `FidesCatalogUI`. Keep deeplinks `?wallet=` and `/wallet/{id}/` working.
- Comments and user-facing strings are English.
- Check changed files with `php -l` and `node --check`. Do not boot WordPress unless the task asks for it and `wp-env` is already installed.
