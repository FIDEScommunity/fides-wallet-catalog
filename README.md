# FIDES Wallet Catalog

**Developed and maintained by FIDES Labs BV**

A comprehensive, community-driven catalog of 70+ digital identity wallets from around the world, including national EUDI Wallets and commercial solutions.

## 🎯 Concept

The FIDES Wallet Catalog provides a standardized, searchable database of digital identity wallets. Wallet providers contribute their wallet information via GitHub Pull Requests, ensuring:

1. **Standardized format** - All wallets follow a unified JSON schema
2. **Community-maintained** - Providers manage their own information via PR
3. **Automatic aggregation** - GitHub Actions daily aggregates all catalogs
4. **Always up-to-date** - Changes are immediately reflected in the catalog
5. **Open source** - Apache-2.0 license, fully transparent

The catalog is available as:
- **Website** - Interactive catalog at fides.community
- **WordPress plugin** - Embed the catalog on your own site
- **API** - JSON data at `data/aggregated.json`

## 📁 Project Structure

```
wallet-catalog/
├── CONCEPT.md                    # Conceptual design
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
    ├── DID_REGISTRATION.md       # How to register your DID
    └── GITHUB_REPO_STRUCTURE.md  # Repository structure
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

The API runs on http://localhost:3001

## 🌍 Data Sources

The FIDES Wallet Catalog aggregates wallet data from the `community-catalogs/` directory:

### Community Contributions (Primary)
Wallet providers submit their own `wallet-catalog.json` files via GitHub Pull Requests. The catalog includes:
- **National EUDI Wallets** - 20+ EU member state wallets (Austria, Finland, Germany, Netherlands, Spain, etc.)
- **Government Digital ID Apps** - France Identité, mObywatel, Diia, IT Wallet, etc.
- **Commercial Wallet Providers** - 50+ vendors worldwide (Animo, Sphereon, Procivis, Lissi, etc.)
- **Tech Giants** - Apple Wallet, Google Wallet

### DID-based Auto-discovery (Optional)
Advanced feature: Wallet providers with DID infrastructure can host their catalog on their own domain and register their DID for automatic crawling. See [docs/DID_REGISTRATION.md](docs/DID_REGISTRATION.md).

## 📋 Add Your Wallet to the Catalog

### Quick Start (Recommended)

1. **Fork** this repository
2. **Create** a folder in `community-catalogs/` with your organization/wallet name
3. **Add** your `wallet-catalog.json` following the schema
4. **Submit** a Pull Request

See [docs/GITHUB_REPO_STRUCTURE.md](docs/GITHUB_REPO_STRUCTURE.md) for detailed instructions and examples.

### Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "website": "https://yourdomain.com",
    "country": "NL"
  },
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal",
      "platforms": ["iOS", "Android"],
      "credentialFormats": ["SD-JWT-VC", "mDL/mDoc"],
      "appStoreLinks": {
        "iOS": "https://apps.apple.com/app/...",
        "android": "https://play.google.com/store/apps/..."
      }
    }
  ]
}
```

### Validation

Your PR will be automatically validated against the schema. To validate locally:

```bash
npm run validate
```

## 🔍 Using the Catalog Data

### Date Semantics in `aggregated.json`

Each wallet in `data/aggregated.json` now includes:

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
| `GET /api/wallets` | All wallets, with optional filters |
| `GET /api/wallets/:providerId/:walletId` | Specific wallet |
| `GET /api/providers` | All providers |
| `GET /api/stats` | Statistics |

Example with filters:
```
GET /api/wallets?search=paradym&type=personal&platforms=iOS,Android&credentialFormats=SD-JWT-VC
```

## 📊 Wallet Properties

The schema supports extensive wallet metadata:

- **General**: name, description, logo, website, app store links
- **Type**: personal or organizational
- **Platforms**: iOS, Android, Web, Windows, macOS, Linux, CLI
- **Credential Formats**: SD-JWT-VC, mDL/mDoc, AnonCreds, JWT-VC, Apple Wallet Pass, Google Wallet Pass, etc.
- **Protocols**: OpenID4VCI, OpenID4VP, DIDComm, ISO 18013-5, SIOPv2
- **Identifiers**: did:web, did:key, did:jwk, did:peer, X.509, etc.
- **Key Storage**: Secure Enclave, StrongBox, HSM, TEE, Cloud KMS, FIDO2/WebAuthn
- **Signing Algorithms**: ES256, ES384, EdDSA, RS256, etc.
- **Certifications**: EUDI Wallet LSP, ISO 27001, SOC 2, Common Criteria
- **Interoperability**: DIIP v4, EWC v3, EUDI Wallet ARF
- **Status**: development, beta, production, deprecated

See the full schema: [schemas/wallet-catalog.schema.json](schemas/wallet-catalog.schema.json)

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

The plugin automatically fetches data from the FIDES Community GitHub repository daily.

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
- Contact: For questions or support, please open an issue in this repository

---

**© 2026 FIDES Labs BV** - All rights reserved

