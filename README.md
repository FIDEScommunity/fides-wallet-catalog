# FIDES Wallet Catalog

Decentralized wallet catalog system for the FIDES Community. Wallet providers manage their own wallet information via DID documents, FIDES aggregates and presents this data.

## 🎯 Concept

Instead of static tables on the FIDES website, wallet providers can now:

1. **Publish their wallet information** in a standardized JSON format
2. **Link from their DID document** to this wallet catalog descriptor
3. **Manage and update themselves** - changes are automatically fetched

FIDES periodically crawls the registered DID documents and aggregates the wallet information for display on the website.

## 📁 Project Structure

```
wallet-catalog/
├── CONCEPT.md                    # Conceptual design
├── schemas/
│   └── wallet-catalog.schema.json  # JSON Schema for wallet descriptors
├── examples/                     # Example wallet catalogs
│   ├── animo/
│   │   ├── did.json              # Example DID document
│   │   └── wallet-catalog.json   # Wallet catalog descriptor
│   ├── sphereon/
│   └── esatus/
├── src/
│   ├── types/wallet.ts           # TypeScript types
│   ├── crawler/index.ts          # Crawler service
│   ├── server/index.ts           # API server
│   ├── App.tsx                   # Frontend application
│   └── ...
├── wordpress-plugin/             # WordPress plugin
│   └── fides-wallet-catalog/
└── data/
    └── aggregated.json           # Aggregated wallet data
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Run Crawler

This crawls the example wallet catalogs and generates `data/aggregated.json`:

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

## 📋 Wallet Provider Integration

### Step 1: Create Wallet Catalog Descriptor

Create a JSON file according to the schema (`schemas/wallet-catalog.schema.json`):

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "did": "did:web:yourdomain.com",
    "website": "https://yourdomain.com"
  },
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal",
      "platforms": ["iOS", "Android"],
      "credentialFormats": ["SD-JWT-VC", "mDL/mDoc"],
      "issuanceProtocols": ["OpenID4VCI"],
      "presentationProtocols": ["OpenID4VP"]
      // ... more properties
    }
  ]
}
```

### Step 2: Publish on Your Domain

Place the file at a publicly accessible URL, for example:
- `https://yourdomain.com/.well-known/wallet-catalog.json`

### Step 3: Link from Your DID Document

Add a service endpoint to your DID document:

```json
{
  "id": "did:web:yourdomain.com",
  "service": [
    {
      "id": "did:web:yourdomain.com#wallet-catalog",
      "type": "WalletCatalog",
      "serviceEndpoint": "https://yourdomain.com/.well-known/wallet-catalog.json"
    }
  ]
}
```

### Step 4: Register with FIDES

Register your DID with the FIDES Community so the crawler can find your catalog.

## 🔍 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/wallets` | All wallets, with optional filters |
| `GET /api/wallets/:providerId/:walletId` | Specific wallet |
| `GET /api/providers` | All providers |
| `GET /api/stats` | Statistics |
| `GET /api/filters` | Available filter options |

### Filter Parameters

```
GET /api/wallets?search=paradym&type=personal&platforms=iOS,Android&credentialFormats=SD-JWT-VC
```

## 📊 Wallet Properties

The schema supports extensive wallet information:

- **General**: name, description, logo, website
- **Type**: personal, organizational, or both
- **Platforms**: iOS, Android, Web, Desktop, CLI
- **Credential Formats**: SD-JWT-VC, mDL/mDoc, AnonCreds, JWT-VC, etc.
- **Protocols**: OpenID4VCI, OpenID4VP, DIDComm, ISO 18013-5
- **DID Methods**: did:web, did:key, did:jwk, did:peer, etc.
- **Key Management**: Secure Enclave, StrongBox, HSM, etc.
- **Certifications**: EUDI Wallet LSP, ISO 27001, etc.
- **Standards**: ARF, HAIP, EBSI

## 🔌 WordPress Integration

A WordPress plugin is included in `wordpress-plugin/fides-wallet-catalog/`. 

### Installation

1. Copy the plugin folder to `wp-content/plugins/`
2. Activate the plugin in WordPress Admin
3. Configure the API URL in Settings > FIDES Wallet Catalog
4. Use the shortcode on any page:

```
[fides_wallet_catalog]
```

### Shortcode Options

| Option | Values | Description |
|--------|--------|-------------|
| `type` | personal, organizational, both | Filter by wallet type |
| `show_filters` | true, false | Show/hide filters |
| `show_search` | true, false | Show/hide search bar |
| `columns` | 1, 2, 3, 4 | Number of columns |
| `theme` | dark, light | Color theme |

## 🛠️ Technology Stack

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **Validation**: AJV (JSON Schema)
- **Types**: TypeScript

## 📝 Next Steps

1. **WordPress integration**: Embed the widget in WordPress
2. **Registration portal**: Interface for providers to register
3. **Automatic crawling**: Cron job for periodic updates
4. **Verification**: DID document signature verification
5. **Caching**: Redis/database for better performance

## 📄 License

MIT
