# FIDES Wallet Catalog

**Developed and maintained by FIDES Labs BV**

A comprehensive, community-driven catalog of 70+ digital identity wallets from around the world, including national EUDI Wallets and commercial solutions.

## 🎯 Concept

The FIDES Wallet Catalog is a standardized, searchable database of digital identity wallets. Providers can contribute and update listings in two ways:

1. **WordPress forms** on [fides.community](https://fides.community) (recommended) — submit and update forms with moderation, then automatic sync to GitHub
2. **GitHub Pull Requests** — edit `community-catalogs/*/wallet-catalog.json` directly (schema **v2**)

Shared properties:

1. **Standardized format** — unified JSON schema (v2)
2. **Community-maintained** — providers own their data
3. **Automatic aggregation** — crawler builds `data/aggregated.json`
4. **Always up-to-date** — daily crawl plus WP publish sync
5. **Open source** — Apache-2.0 license

The catalog is available as:
- **Website** - Interactive catalog at fides.community
- **WordPress plugin** - Embed the catalog on your own site
- **API** - JSON data at `data/aggregated.json`, optional [HTTP API](docs/API.md) on Vercel

## 📁 Project Structure

```
wallet-catalog/
├── CONCEPT.md                    # Conceptual design
├── lib/
│   ├── walletPublicApi.ts        # Shared list/filter (Express + Vercel; outside api/ — see file comment)
│   └── httpWalletTypes.ts        # Types for the HTTP API helpers
├── api/
│   └── public/                   # Vercel serverless routes only (each *.ts is an endpoint)
│       ├── wallet/               # index + [orgId]/[walletId] (logic inlined for Vercel)
│       └── api-docs.ts
├── public/                       # Static landing + Swagger UI for the API
├── vercel.json
├── schemas/
│   └── wallet-catalog.schema.json  # JSON Schema for wallet descriptors
├── community-catalogs/           # All wallet catalogs (add yours here!)
│   ├── animo/
│   │   ├── did.json              # Example DID document (optional)
│   │   └── wallet-catalog.json   # Wallet catalog descriptor
│   ├── sphereon/
│   ├── google/
│   ├── apple/
│   ├── france/                   # Country folders for government wallets
│   ├── germany/
│   ├── italy/
│   └── ...                       # 70+ wallet providers
├── src/
│   ├── types/wallet.ts           # TypeScript types
│   ├── crawler/index.ts          # Crawler service
│   ├── server/index.ts           # API server
│   ├── App.tsx                   # Frontend application
│   └── ...
├── wordpress-plugin/             # WordPress plugin
│   └── fides-wallet-catalog/
├── data/
│   ├── aggregated.json           # Aggregated wallet data (used by UI/API)
│   ├── wallet-history-state.json # Stable first-seen state across crawler runs
│   └── did-registry.json         # Registered DIDs for automatic crawling
└── docs/                         # Documentation
    ├── API.md                    # Public HTTP API (Vercel)
    ├── DID_REGISTRATION.md       # How to register your DID
    ├── GITHUB_REPO_STRUCTURE.md  # Repository structure
    ├── DESIGN_DECISIONS.md       # Architecture and design choices
    └── LESSONS_LEARNED.md        # Lessons from update visibility & filter counters
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Run Crawler

This crawls the wallet catalogs and generates `data/aggregated.json`:

```bash
npm run crawl
```

### Backfill first-seen dates (one-time / when needed)

To initialize historical `firstSeenAt` values from git history:

```bash
npm run backfill:first-seen
```

After backfill, run the crawler again:

```bash
npm run crawl
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Start API Server (optional)

```bash
npm run serve
```

The API runs on http://localhost:3001 — same data and filters as `GET /api/public/wallet` on Vercel (see [docs/API.md](docs/API.md)).

## 🌍 Data Sources

Wallet data lives in `community-catalogs/` and is aggregated into `data/aggregated.json`. Sources include:

- **WordPress submissions** — published entries from `[fides_wallet_submit_form]` / `[fides_wallet_update_form]` on fides.community (synced via GitHub Actions)
- **Community Pull Requests** — direct JSON contributions to this repo
- **National & commercial wallets** — 70+ providers (EUDI member states, government apps, vendors, tech giants)

Organization metadata (`provider` name, logo, country, etc.) is merged from the [FIDES Organization Catalog](https://github.com/FIDEScommunity/fides-organization-catalog) at crawl time using `orgId`.

### DID-based auto-discovery (optional)

Advanced: host a catalog on your domain and register a DID for automatic crawling. See [docs/DID_REGISTRATION.md](docs/DID_REGISTRATION.md).

## 📋 Add or Update Your Wallet

### Option A — WordPress forms (recommended)

1. Ensure your organization exists in the [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) (`orgId` e.g. `org:your-org`).
2. Sign in on **fides.community** and open the **submit** or **update** wallet form page.
3. Complete the form and submit. A maintainer reviews under **Tools → Catalog Submissions**.
4. After **Publish**, data syncs to this repo and the public catalog updates.

Shortcodes (site operators): `[fides_wallet_submit_form]`, `[fides_wallet_update_form]`. Requires **fides-community-tools-tiles** with catalog submissions enabled.

**Governance:** [fides-community-tools-tiles/docs/CATALOG-SUBMISSION-GOVERNANCE.md](https://github.com/FIDEScommunity/fides-community-tools-tiles/blob/main/docs/CATALOG-SUBMISSION-GOVERNANCE.md) — §14 (CI), §15 (deploy).

**Pro listings:** organizations with a linked WordPress account can publish richer fields (media, recognitions, pricing, store links, etc.) on export. See [schemas/README.md](schemas/README.md#v2-tier-notes-export).

### Option B — GitHub Pull Request

1. **Fork** this repository
2. **Create** a folder in `community-catalogs/` (lowercase, hyphenated slug)
3. **Add** `wallet-catalog.json` with `"$schema": "https://fides.community/schemas/wallet-catalog/v2"`
4. **Open a Pull Request**

Full contributor guide: [docs/GITHUB_REPO_STRUCTURE.md](docs/GITHUB_REPO_STRUCTURE.md).

### Minimal example (schema v2)

Organization details (name, DID, website, logo, country) live in the [FIDES Organization Catalog](https://github.com/FIDEScommunity/fides-organization-catalog). Your `wallet-catalog.json` only references that record via `orgId` (for example `org:your-org` — the same id as in the organization catalog).

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v2",
  "orgId": "org:your-org",
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal",
      "platforms": ["iOS", "Android"],
      "vcFormat": ["sd_jwt_vc", "mdoc"],
      "appStoreLinks": {
        "iOS": "https://apps.apple.com/app/...",
        "android": "https://play.google.com/store/apps/..."
      }
    }
  ]
}
```

Schema reference (v2 fields, limits, tier export): [schemas/README.md](schemas/README.md).

### Validation

PRs and community JSON are validated in CI. Locally:

```bash
npm run validate
```

## 🔍 Using the Catalog Data

### Date Semantics in `aggregated.json`

Each wallet in `data/aggregated.json` now includes:

- `orgId` - organization catalog id (`org:…`); `provider` on each wallet is merged from the [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) at crawl time
- `updatedAt` - semantic update timestamp used for "Last updated" sorting
- `firstSeenAt` - stable first time this wallet was seen in the FIDES catalog
- `fetchedAt` - technical crawl timestamp (still present for backwards compatibility)

`updatedAt` fallback order:
1. wallet-level `updatedAt` / `updated` from provider data
2. catalog-level `lastUpdated`
3. git last commit date of the provider's `wallet-catalog.json`
4. `fetchedAt` (last resort)

`firstSeenAt` is persisted in `data/wallet-history-state.json`, so it does not reset on each crawl.

### Direct JSON Access

The aggregated catalog is available at:
```
https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json
```

Updated daily via GitHub Actions.

### API Server (Optional)

For development, you can run a local API server:

```bash
npm run serve
```

| Endpoint | Description |
|----------|-------------|
| `GET /api/wallets` | Paginated list (`content`, `totalElements`, `page`/`number`, `size`) + filters |
| `GET /api/wallets/:orgId/:walletId` | One wallet (`orgId` URL-encoded, e.g. `org%3Aanimo`) |

Example with filters:
```
GET /api/wallets?search=paradym&type=personal&platforms=iOS,Android&vcFormat=sd_jwt_vc&page=0&size=20
```

### Public HTTP API (Vercel)

Deploy this repository to Vercel (root = repo root; settings from `vercel.json`) to expose `GET /api/public/wallet`, wallet detail, and OpenAPI — see **[docs/API.md](docs/API.md)**. For a single hostname with other FIDES catalogs, use the [FIDES API Gateway](https://github.com/FIDEScommunity/fides-api-gateway) and set `FIDES_WALLET_CATALOG_ORIGIN` to this project’s `*.vercel.app` URL.

## 📊 Wallet Properties (schema v2)

The schema supports extensive metadata. Highlights:

- **General**: name, description, logo, website, documentation, repository
- **Commercial (Pro export)**: `media` (videos/images), `recognitions`, `pricing`, `features`, `appStoreLinks`
- **Deployment**: `deploymentModel` (`saas`, `on_premises`, `hybrid`), `slaAvailable`, `license` enum + `licenseOther`
- **Type**: `personal` or `organizational`
- **Platforms**: iOS, Android, Web, Windows, macOS, Linux, CLI
- **VC formats** (`vcFormat`): `sd_jwt_vc`, `mdoc`, `apple_wallet_pass`, etc.
- **Protocols**: OpenID4VCI, OpenID4VP, SIOPv2, ISO 18013-5, …
- **Technical**: identifiers, key storage, signing algorithms, credential status, interoperability profiles
- **Status**: development, beta, production, deprecated

**Removed in v2:** top-level `video`, string-array `certifications` — use `media.videos` and `recognitions.certifications`.

Full reference: [schemas/README.md](schemas/README.md) and [schemas/wallet-catalog.schema.json](schemas/wallet-catalog.schema.json).

## 🔌 WordPress Integration

A WordPress plugin is included in `wordpress-plugin/fides-wallet-catalog/`. 

### Installation

1. Copy the plugin folder to `wp-content/plugins/`
2. Activate the plugin in WordPress Admin
3. (Optional) Configure a custom data source in Settings > FIDES Wallet Catalog
4. Use the shortcode on any page:

```
[fides_wallet_catalog]
```

### Shortcode Options

| Option | Values | Description |
|--------|--------|-------------|
| `type` | personal, organizational, both | Filter by wallet type |
| `show_filters` | true, false | Show/hide filters (default: true) |
| `show_search` | true, false | Show/hide search bar (default: true) |
| `columns` | 1, 2, 3, 4 | Number of columns (default: 3) |
| `theme` | dark, light | Color theme (default: dark) |

Each filter option shows a count of how many wallets match (e.g. "Personal (52)", "SD-JWT-VC (48)") so you can see the dataset distribution at a glance. Counts are computed over the visible set (e.g. when using `type="personal"`, only personal wallets are counted).

The plugin fetches data from GitHub (`data/aggregated.json`) and supports on-site contributions when **fides-community-tools-tiles** is installed.

### Contributor forms (logged-in users)

| Shortcode | Purpose |
|-----------|---------|
| `[fides_wallet_submit_form]` | Add a new wallet (moderated) |
| `[fides_wallet_update_form]` | Suggest changes (`?wallet=` pre-selects from modal pencil) |

Configure the update form URL under **Settings → FIDES Wallet Catalog**. Moderation: **Tools → Catalog Submissions** in tiles. Published rows sync to GitHub via `.github/workflows/wp-submissions-sync.yml`.

**Docs:** [CATALOG-SUBMISSION-GOVERNANCE.md](https://github.com/FIDEScommunity/fides-community-tools-tiles/blob/main/docs/CATALOG-SUBMISSION-GOVERNANCE.md) (§14–16).

### Plugin data fallback (local)

The WordPress plugin tries GitHub first and falls back to:

`wordpress-plugin/fides-wallet-catalog/data/aggregated.json`

For local testing with the latest generated data, copy:

`data/aggregated.json` -> `wordpress-plugin/fides-wallet-catalog/data/aggregated.json`

## 📄 License

This project is licensed under the **Apache License 2.0**.

```
Copyright 2026 FIDES Labs BV

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 🏢 About

**Developed and maintained by FIDES Labs BV**

- Website: [https://fides.community](https://fides.community)
- GitHub: [https://github.com/FIDEScommunity](https://github.com/FIDEScommunity)
- Catalog contributions: WordPress forms on [fides.community](https://fides.community) (recommended) or a Pull Request in this repo
- Questions: [catalog@fides.community](mailto:catalog@fides.community) or open an issue in this repository

---

**© 2026 FIDES Labs BV** - All rights reserved

