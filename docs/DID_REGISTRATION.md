# DID Registration for Wallet Providers

This document explains how wallet providers can register their DID to have their wallet catalog automatically crawled and displayed on the FIDES Wallet Catalog.

## How It Works

1. **You register your DID** by submitting a Pull Request to this repository
2. **The crawler resolves your DID document** (e.g., `did:web:example.com` → `https://example.com/.well-known/did.json`)
3. **The crawler looks for a WalletCatalog service endpoint** in your DID document
4. **Your wallet catalog is fetched and validated** against the schema
5. **Your wallets appear on the FIDES Wallet Catalog** website

## Step 1: Prepare Your DID Document

Your DID document must include a `WalletCatalog` service endpoint:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1"
  ],
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

### For `did:web`

Host your DID document at:
- `did:web:example.com` → `https://example.com/.well-known/did.json`
- `did:web:example.com:path:to:doc` → `https://example.com/path/to/doc/did.json`

## Step 2: Host Your Wallet Catalog

Create a `wallet-catalog.json` file at the URL specified in your DID document's service endpoint:

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Your Organization",
    "did": "did:web:your-domain.com",
    "website": "https://your-domain.com"
  },
  "wallets": [
    {
      "id": "your-wallet",
      "name": "Your Wallet Name",
      "type": "personal",
      "platforms": ["iOS", "Android"],
      "credentialFormats": ["SD-JWT-VC", "mDL/mDoc"]
    }
  ],
  "lastUpdated": "2025-01-06T10:00:00Z"
}
```

See the full schema: [wallet-catalog.schema.json](../schemas/wallet-catalog.schema.json)

## Step 3: Register Your DID

1. **Fork** this repository
2. **Edit** `data/did-registry.json`
3. **Add your DID** to the array:

```json
[
  {
    "did": "did:web:your-domain.com",
    "addedAt": "2025-01-06T10:00:00Z",
    "status": "pending"
  }
]
```

4. **Submit a Pull Request**

## Registry Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `did` | Yes | Your organization's DID (must be `did:web:` for now) |
| `addedAt` | Yes | ISO 8601 timestamp when you registered |
| `status` | Yes | Set to `pending` for new registrations |

## What Happens Next?

1. Your PR will be reviewed
2. The crawler will attempt to resolve your DID and fetch your catalog
3. If successful, your wallets will appear in the catalog
4. The registry entry will be updated with `status: "active"`

## Troubleshooting

### "No WalletCatalog service endpoint found"

Make sure your DID document includes a service with `type: "WalletCatalog"`.

### "Failed to resolve DID document"

- For `did:web`: Make sure `https://your-domain/.well-known/did.json` is accessible
- Check CORS headers if hosting on a CDN
- Ensure the response has correct Content-Type (`application/did+json` or `application/json`)

### "Failed to fetch or validate wallet catalog"

- Check that your `wallet-catalog.json` URL is accessible
- Validate your JSON against the schema
- Ensure `$schema` matches `https://fides.community/schemas/wallet-catalog/v1`

## Supported DID Methods

Currently supported:
- ✅ `did:web`

Coming soon:
- 🔜 `did:key`
- 🔜 `did:ebsi`

## Questions?

Open an issue or contact the FIDES Community at https://fides.community

