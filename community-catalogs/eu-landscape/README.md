# EU Digital Identity Landscape Wallets

This directory contains automatically synced wallet data from the [EU Digital Identity Landscape](https://www.digital-identity-landscape.eu/).

## 🔄 Automatic Sync

The wallet data in this directory is automatically synchronized **every Monday at 9:00 AM UTC** via GitHub Actions.

### Source

- **Source:** https://www.digital-identity-landscape.eu/data/solutions.json
- **Filter:** `category: "Wallet"` AND `status: "Active" | "Pilot" | "Deployed"`
- **Last Sync:** See `sync-metadata.json`

### What's Included

- **53 Active/Pilot Wallets** from 26 European countries
- Comprehensive wallet metadata including:
  - Provider information
  - Platform support (iOS, Android, Web)
  - Credential formats (SD-JWT-VC, mDL/mDoc, etc.)
  - Protocols (OpenID4VP, OpenID4VCI)
  - Country codes
  - Release dates
  - eIDAS notification status

## 📊 Current Statistics

Last sync: `2026-01-07T06:40:17.545Z`

- **Total Wallets:** 53
- **By Status:**
  - Production: 47
  - Beta/Pilot: 6
  - Development: 0

## 🌍 Coverage

Wallets from these countries:
- Andorra (AD), Austria (AT), Belgium (BE), Bosnia-Herzegovina (BA)
- Cyprus (CY), Czech Republic (CZ), Finland (FI), France (FR)
- Germany (DE), Great Britain (GB), Greece (GR), Hungary (HU)
- Italy (IT), Lithuania (LT), Montenegro (ME), Netherlands (NL)
- North Macedonia (MK), Poland (PL), Portugal (PT), Serbia (RS)
- Slovakia (SK), Spain (ES), Sweden (SE), Switzerland (CH)
- Ukraine (UA), and 6 EU-wide LSP solutions

## 🛠️ Manual Sync

To manually trigger a sync:

```bash
node scripts/sync-eu-landscape.js
```

Or with dry-run to preview changes:

```bash
node scripts/sync-eu-landscape.js --dry-run
```

## 📝 Data Transformation

The sync script transforms EU Landscape data to FIDES wallet catalog format:

| EU Landscape Field | FIDES Field | Transformation |
|-------------------|-------------|----------------|
| `name` | `id`, `name` | ID generated from name |
| `solution type` | `type` | Maps to personal/organizational |
| `status` | `status` | Active→production, Pilot→beta |
| `provider` | `provider` | Extracted from provider field |
| `url` | `website` | Direct mapping |
| `eidas notified` | `certifications` | Yes→["eIDAS notified"] |
| `launch year` | `releaseDate` | Year to YYYY-01-01 |
| Description analysis | `platforms`, `credentialFormats`, `protocols` | Intelligent detection |

## 🔗 Integration

These wallets are automatically included in:
- `data/aggregated.json`
- WordPress plugin data
- FIDES wallet catalog website

## 📚 About EU Digital Identity Landscape

The EU Digital Identity Landscape is a comprehensive database of eID solutions across Europe, maintained by the European Commission and industry partners. It tracks:
- National eID systems
- Digital wallets
- Trust service providers
- E-government access solutions
- Foundational ID systems

## 🤝 Contributing

This data is automatically synced and should not be manually edited. To suggest changes:
1. Update the source data at [EU Digital Identity Landscape](https://www.digital-identity-landscape.eu/)
2. The changes will be picked up in the next automatic sync

## 📄 License

Data sourced from EU Digital Identity Landscape under their terms of use.
FIDES catalog structure and transformation © FIDES Community.

