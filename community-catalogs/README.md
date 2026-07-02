# Community Wallet Catalogs

On-disk wallet data for the FIDES Wallet Catalog. Each provider folder contains a `wallet-catalog.json` (schema **v2**).

## How to add or update a wallet

| Route | Best for |
|-------|----------|
| **WordPress forms** (recommended) | Most providers on [fides.community](https://fides.community) — guided UI, moderation, automatic sync here |
| **GitHub Pull Request** | Power users, bulk edits, automation, or contributors without a FIDES account |

Both routes end up as files under `community-catalogs/<slug>/wallet-catalog.json`. After publish or merge, CI validates and the crawler updates [`data/aggregated.json`](../data/aggregated.json).

### Via WordPress forms (recommended)

1. Ensure your organization exists in the [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) (`orgId`, e.g. `org:your-org`).
2. **Sign in** on fides.community and open the **submit** or **update** wallet form.
3. Submit — a maintainer reviews under **Tools → Catalog Submissions**.
4. After **Publish**, the [WP Submissions Sync](https://github.com/FIDEScommunity/fides-wallet-catalog/actions/workflows/wp-submissions-sync.yml) workflow imports JSON into this folder and runs the crawler.

Shortcodes (site operators): `[fides_wallet_submit_form]`, `[fides_wallet_update_form]`. Requires **fides-community-tools-tiles**.

**Docs:** [Catalog Submission Governance](https://github.com/FIDEScommunity/fides-community-tools-tiles/blob/main/docs/CATALOG-SUBMISSION-GOVERNANCE.md) · full contributor guide: [docs/GITHUB_REPO_STRUCTURE.md](../docs/GITHUB_REPO_STRUCTURE.md)

### Via Pull Request (alternative)

1. **Fork** this repository
2. **Create a directory** with your organization slug (lowercase, hyphenated)
3. **Add or edit** `wallet-catalog.json` with `"$schema": "https://fides.community/schemas/wallet-catalog/v2"`
4. **Open a Pull Request** — CI runs `npm run validate`

## Directory structure

```
community-catalogs/
├── your-organization/
│   └── wallet-catalog.json
└── another-provider/
    └── wallet-catalog.json
```

## Minimal example (v2)

Add your organization to the [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) first, then reference it by `orgId`:

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v2",
  "orgId": "org:my-company",
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal",
      "platforms": ["iOS", "Android"]
    }
  ]
}
```

Schema reference: [schemas/README.md](../schemas/README.md).

## Validation

**Pull requests:** validated automatically in CI.

**Locally:**

```bash
npm run validate
```

## Date fields (optional)

- `wallets[].updatedAt` (preferred) or `wallets[].updated` (legacy alias)
- top-level `lastUpdated` (catalog-level)

Do not set `firstSeenAt` in provider files — the crawler maintains it in `data/wallet-history-state.json`.

## Questions?

- Open an issue in this repository
- Email [catalog@fides.community](mailto:catalog@fides.community) if you cannot use the form
- [FIDES Community](https://fides.community)
