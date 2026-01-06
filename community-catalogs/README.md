# Community Wallet Catalogs

This directory contains wallet catalogs contributed by the community.

## How to Add Your Wallet

1. **Fork** this repository
2. **Create a directory** with your organization name (lowercase, hyphenated)
3. **Add your `wallet-catalog.json`** file
4. **Submit a Pull Request**

## Directory Structure

```
community-catalogs/
├── your-organization/
│   └── wallet-catalog.json
└── another-provider/
    └── wallet-catalog.json
```

## Example

Create `community-catalogs/my-company/wallet-catalog.json`:

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "My Company",
    "did": "did:web:my-company.com"
  },
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal"
    }
  ]
}
```

## Validation

Your wallet catalog will be automatically validated against the schema when you submit a Pull Request.

See the full schema documentation: [Wallet Catalog Schema](../schemas/wallet-catalog.schema.json)

