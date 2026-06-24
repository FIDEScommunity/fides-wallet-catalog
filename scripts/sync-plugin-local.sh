#!/usr/bin/env bash
# Sync WordPress plugin to Local (utrecht-demo). Override with WALLET_CATALOG_PLUGIN_SRC / WALLET_CATALOG_PLUGIN_DEST.
set -euo pipefail
SRC="${WALLET_CATALOG_PLUGIN_SRC:-/Users/victorvanderhulst/Projects/wallet-catalog/wordpress-plugin/fides-wallet-catalog/}"
DEST="${WALLET_CATALOG_PLUGIN_DEST:-/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public/wp-content/plugins/fides-wallet-catalog/}"
rsync -av --delete "$SRC" "$DEST"
