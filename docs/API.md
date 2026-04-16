# Wallet Catalog API

## Overview

The FIDES Wallet Catalog exposes a read-only serverless API on Vercel over `data/aggregated.json`. The same filtering logic is shared with the optional local Express server (`npm run serve`).

## Endpoints

### `GET /api/public/wallet`

Paginated, filterable list of wallets.

**Query parameters**

| Parameter | Description |
|-----------|-------------|
| `search` | Case-insensitive match on name, description, provider name, id |
| `orgId` | Exact organization catalog id (e.g. `org:animo`) |
| `type` | Comma-separated: `personal`, `organizational` |
| `platforms` | Comma-separated platform names (e.g. `iOS`, `Android`) |
| `credentialFormats` | Comma-separated |
| `capabilities` | Comma-separated |
| `interoperabilityProfiles` | Comma-separated |
| `protocols` | Comma-separated; matches issuance or presentation protocols |
| `openSource` | `true` or `false` |
| `status` | Comma-separated: `development`, `beta`, `production`, `deprecated` |
| `sort` | `displayName` (default), `name`, `id`, `orgId`, `status`, `updatedAt` |
| `direction` | `asc` or `desc` |
| `page` | Zero-based page index (default `0`) |
| `size` | Page size, max 200 (default `20`) |

**Response**

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 20,
  "lastUpdated": "2026-04-08T07:06:49.836Z"
}
```

### `GET /api/public/wallet/{orgId}/{walletId}`

Returns a single wallet. Encode `orgId` for the path (e.g. `org:animo` → `org%3Aanimo`).

### `GET /api/public/api-docs`

OpenAPI 3.1 specification (JSON).

## Local development server

`npm run serve` exposes `/api/wallets` (list) and `/api/wallets/:orgId/:walletId` (detail) with the same pagination and filters as `/api/public/wallet` on Vercel.

## Deployment

Connect this repository to Vercel (root = repo root). Build settings are defined in `vercel.json` (`npm ci`, static `public/`, serverless `api/**/*.ts`).

For a unified hostname with other FIDES catalogs, deploy this project and point the [FIDES API Gateway](https://github.com/FIDEScommunity/fides-api-gateway) `FIDES_WALLET_CATALOG_ORIGIN` at the wallet project’s `*.vercel.app` URL.
