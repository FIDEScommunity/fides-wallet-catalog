# Contributing to the FIDES Wallet Catalog

This document describes how to contribute wallet catalogs to the FIDES Wallet Catalog.

**Developed and maintained by FIDES Labs BV**

## Repository Structure

```
fides-wallet-catalog/
├── README.md
├── community-catalogs/          # Community-contributed wallet catalogs
│   ├── provider-name-1/
│   │   └── wallet-catalog.json
│   ├── provider-name-2/
│   │   └── wallet-catalog.json
│   ├── country-name/            # Government wallets (e.g., france/, germany/)
│   │   └── wallet-catalog.json
│   └── ...
├── schemas/
│   └── wallet-catalog.schema.json
├── wordpress-plugin/            # WordPress plugin for displaying catalogs
│   └── fides-wallet-catalog/
├── data/
│   ├── aggregated.json          # Auto-generated aggregated output
│   └── wallet-history-state.json# Stable firstSeen state (crawler)
└── .github/
    └── workflows/
        ├── validate.yml         # CI to validate schemas
        └── crawl.yml            # Auto-aggregate wallet data
```

## How to Add Your Wallet

### Via Pull Request (Primary Method)

1. **Fork** the `FIDEScommunity/fides-wallet-catalog` repository
2. **Create a directory** for your organization in `community-catalogs/`
   - For commercial wallets: Use your company/product name (e.g., `my-wallet-company`)
   - For government wallets: Use the country name in English (e.g., `netherlands`, `france`)
   - Use lowercase, hyphenated names
3. **Add your `wallet-catalog.json`** following the schema
4. **Submit a Pull Request**

Your wallet catalog will be:
- ✅ Automatically validated against the JSON schema
- ✅ Merged into `data/aggregated.json` daily by GitHub Actions
- ✅ Displayed on fides.community and via the WordPress plugin

## Optional Date Fields (Recommended)

To improve update visibility in catalog UIs, providers can include:

- `wallets[].updatedAt` (preferred)
- `wallets[].updated` (legacy alias)
- top-level `lastUpdated` (catalog level fallback)

Notes:
- `firstSeenAt` is system-managed by the crawler and should not be provider-managed.
- If wallet-level date fields are omitted, crawler fallback uses `lastUpdated`, then git file commit date.

## Wallet Catalog Schema

Each `wallet-catalog.json` must conform to the FIDES Wallet Catalog Schema: [wallet-catalog.schema.json](../schemas/wallet-catalog.schema.json)

### Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "website": "https://your-domain.com",
    "country": "NL"
  },
  "wallets": [
    {
      "id": "your-wallet",
      "name": "Your Wallet Name",
      "type": "personal",
      "platforms": ["iOS", "Android"]
    }
  ]
}
```

### Full Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "website": "https://your-domain.com",
    "logo": "https://your-domain.com/logo.png",
    "country": "NL",
    "contact": {
      "email": "info@your-domain.com",
      "support": "https://your-domain.com/support"
    }
  },
  "wallets": [
    {
      "id": "your-wallet",
      "name": "Your Wallet Name",
      "description": "A brief description of your wallet.",
      "logo": "https://your-domain.com/wallet-logo.png",
      "website": "https://your-wallet.com",
      "type": "personal",
      "platforms": ["iOS", "Android", "Web"],
      "openSource": true,
      "license": "Apache-2.0",
      "repository": "https://github.com/your-org/your-wallet",
      "credentialFormats": ["SD-JWT-VC", "mDL/mDoc", "Apple Wallet Pass", "Google Wallet Pass"],
      "issuanceProtocols": ["OpenID4VCI"],
      "presentationProtocols": ["OpenID4VP", "SIOPv2"],
      "supportedIdentifiers": ["did:web", "did:key", "did:jwk"],
      "keyStorage": ["Secure Enclave (iOS)", "StrongBox (Android)"],
      "signingAlgorithms": ["ES256", "EdDSA"],
      "certifications": ["EUDI Wallet LSP"],
      "interoperabilityProfiles": ["DIIP v4", "EWC v3", "EUDI Wallet ARF"],
      "features": [
        "Biometric authentication",
        "Backup & recovery",
        "QR code scanning"
      ],
      "documentation": "https://docs.your-wallet.com",
      "appStoreLinks": {
        "iOS": "https://apps.apple.com/app/your-wallet/id123456789",
        "android": "https://play.google.com/store/apps/details?id=com.yourwallet",
        "web": "https://your-wallet.com/app"
      },
      "status": "production",
      "releaseDate": "2024-01-15"
    }
  ],
  "lastUpdated": "2026-01-12T10:00:00Z"
}
```

## Schema Fields

### Required Fields

| Field | Description |
|-------|-------------|
| `$schema` | Must be `https://fides.community/schemas/wallet-catalog/v1` |
| `provider.name` | Your organization name |
| `wallets[].id` | Unique wallet identifier (lowercase, alphanumeric, hyphens) |
| `wallets[].name` | Display name of the wallet |
| `wallets[].type` | Either `personal` or `organizational` |

### Important Optional Fields

| Field | Description |
|-------|-------------|
| `provider.logo` | URL to organization logo (displayed in catalog) |
| `provider.country` | ISO 3166-1 alpha-2 country code (e.g., "NL", "DE", "US") |
| `wallets[].logo` | URL to wallet logo (displayed in catalog) |
| `wallets[].description` | Short description of the wallet |
| `wallets[].platforms` | `["iOS", "Android", "Web", "Windows", "macOS", "Linux", "CLI"]` |
| `wallets[].appStoreLinks` | Links to app stores (`iOS`, `android`, `web`) |
| `wallets[].credentialFormats` | Supported formats (e.g., `SD-JWT-VC`, `mDL/mDoc`, `Apple Wallet Pass`) |
| `wallets[].issuanceProtocols` | Issuance protocols (e.g., `OpenID4VCI`) |
| `wallets[].presentationProtocols` | Presentation protocols (e.g., `OpenID4VP`, `ISO 18013-5`) |
| `wallets[].interoperabilityProfiles` | `["DIIP v4", "EWC v3", "EUDI Wallet ARF"]` |

See the full schema: [wallet-catalog.schema.json](../schemas/wallet-catalog.schema.json)

## Validation

Your `wallet-catalog.json` will be automatically validated against the schema when you submit a Pull Request.

To validate locally:

```bash
npm run validate
```

Or manually:

```bash
npx ajv-cli validate -s schemas/wallet-catalog.schema.json -d community-catalogs/your-folder/wallet-catalog.json --spec=draft2020 -c ajv-formats
```

## GitHub Actions Workflow

When you submit a PR or make changes:

1. **Validation** - Automatically validates your JSON against the schema
2. **Crawl** (daily) - Aggregates all catalogs into `data/aggregated.json`
3. **Auto-deploy** - Updates the live catalog on fides.community

## Questions?

- Open an issue in the repository
- Contact FIDES Labs BV at https://fides.community

---

**© 2026 FIDES Labs BV** - Open source under Apache-2.0 license

