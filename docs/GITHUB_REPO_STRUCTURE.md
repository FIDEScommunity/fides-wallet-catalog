# FIDES Community Wallet Catalogs

This document describes how to contribute wallet catalogs to the FIDES Wallet Catalog.

## Repository Structure

```
fides-wallet-catalog/
├── README.md
├── examples/                    # Example wallet catalogs (for reference)
├── community-catalogs/          # Community-contributed wallet catalogs
│   ├── provider-name-1/
│   │   └── wallet-catalog.json
│   ├── provider-name-2/
│   │   └── wallet-catalog.json
│   └── ...
├── schemas/
│   └── wallet-catalog.schema.json
└── .github/
    └── workflows/
        └── validate.yml         # CI to validate schemas
```

## How to Add Your Wallet

### Option 1: Via Pull Request (Recommended for providers without DID infrastructure)

1. **Fork** the `FIDEScommunity/fides-wallet-catalog` repository
2. **Create a directory** for your organization in `community-catalogs/`
   - Use lowercase, hyphenated names (e.g., `my-company`)
3. **Add your `wallet-catalog.json`** following the schema
4. **Submit a Pull Request**

### Option 2: Via DID Document (Recommended for providers with DID infrastructure)

If your organization has a DID, you can host the `wallet-catalog.json` yourself and reference it in your DID document:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:your-domain.com",
  "service": [
    {
      "id": "did:web:your-domain.com#wallet-catalog",
      "type": "WalletCatalog",
      "serviceEndpoint": "https://your-domain.com/.well-known/wallet-catalog.json"
    }
  ]
}
```

Then register your DID with the FIDES Community.

## Wallet Catalog Schema

Each `wallet-catalog.json` must conform to the FIDES Wallet Catalog Schema.

### Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "did": "did:web:your-domain.com"
  },
  "wallets": [
    {
      "id": "your-wallet",
      "name": "Your Wallet Name",
      "type": "personal"
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
    "did": "did:web:your-domain.com",
    "website": "https://your-domain.com",
    "logo": "https://your-domain.com/logo.png",
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
      "credentialFormats": ["SD-JWT-VC", "mDL/mDoc"],
      "issuanceProtocols": ["OpenID4VCI"],
      "presentationProtocols": ["OpenID4VP", "SIOPv2"],
      "supportedDIDMethods": ["did:web", "did:key", "did:jwk"],
      "keyManagement": ["Secure Enclave (iOS)", "StrongBox (Android)"],
      "certifications": ["EUDI Wallet LSP"],
      "standards": ["ARF 1.4"],
      "features": [
        "Biometric authentication",
        "Backup & recovery",
        "QR code scanning"
      ],
      "documentation": "https://docs.your-wallet.com",
      "appStoreLinks": {
        "iOS": "https://apps.apple.com/app/your-wallet/id123456789",
        "android": "https://play.google.com/store/apps/details?id=com.yourwallet"
      },
      "status": "production",
      "releaseDate": "2024-01-15"
    }
  ],
  "lastUpdated": "2025-01-05T10:00:00Z"
}
```

## Schema Fields

### Required Fields

| Field | Description |
|-------|-------------|
| `$schema` | Must be `https://fides.community/schemas/wallet-catalog/v1` |
| `provider.name` | Your organization name |
| `provider.did` | Your organization's DID |
| `wallets[].id` | Unique wallet identifier (lowercase, alphanumeric, hyphens) |
| `wallets[].name` | Display name of the wallet |
| `wallets[].type` | Either `personal` or `organizational` |

### Optional Fields

See the full schema at: `https://fides.community/schemas/wallet-catalog/v1`

## Validation

Your `wallet-catalog.json` will be automatically validated against the schema when you submit a Pull Request.

To validate locally:

```bash
# Using ajv-cli
npm install -g ajv-cli ajv-formats
ajv validate -s wallet-catalog.schema.json -d your-catalog.json --spec=draft2020 -c ajv-formats
```

## Data Sources Priority

The FIDES crawler aggregates wallet data from multiple sources with the following priority:

1. **DID-hosted catalogs** (highest priority) - Provider maintains their own `wallet-catalog.json`
2. **GitHub repository** - Community-maintained catalogs
3. **Local examples** (development only)

If the same wallet (same provider DID + wallet ID) exists in multiple sources, the higher-priority source takes precedence.

## Questions?

- Open an issue in the repository
- Contact the FIDES Community at https://fides.community

