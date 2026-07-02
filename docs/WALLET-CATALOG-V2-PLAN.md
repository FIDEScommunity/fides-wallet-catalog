# Wallet Catalog Schema v2 — Implementation Plan

*Status: approved design (2026-06-29)*  
*Scope: data model, validation, migration, tier rules, and submission pipeline. Modal/UI redesign is explicitly out of scope for this phase.*

---

## 1. Goals

1. **Richer Pro listings** — paying organizations (linked WordPress account → `catalogTier: pro`) get more fields to promote their wallet(s): media gallery, recognitions, pricing.
2. **Cleaner commercial & deployment metadata** — deployment model and SLA for all tiers; structured recognitions instead of flat certification strings.
3. **Standardized licensing** — enum dropdown with optional free-text for edge cases.
4. **Clean schema break** — move to `wallet-catalog/v2` quickly; no long-lived v1/v2 dual support in provider JSON.

### Non-goals (later phases)

- Modal look & feel alignment with use case catalog
- SSR section layout changes (may follow data availability)
- API gateway / MCP tier-filter gap (documented in tiles governance; separate follow-up)

---

## 2. Approved design decisions

| Topic | Decision |
|-------|----------|
| Schema version | **v2 only** for provider `wallet-catalog.json` after cutover |
| `deploymentModel` | Enum: `saas`, `on_premises`, **`hybrid`** — **all tiers** |
| `slaAvailable` | Boolean, optional — **all tiers** |
| `media` (videos + images) | **Pro only** |
| `recognitions` | **Pro only**; all three subcategories independently optional |
| `pricing` | Free text, max **1000** chars — **Pro only** |
| `license` | Enum dropdown + **`licenseOther`** (max **50** chars) when `license === "other"` |
| `documentation`, `repository` | Unchanged top-level URLs; UI grouping “Additional resources” deferred |
| Recognitions display rule | Omit empty subsections; omit entire `recognitions` if all sub-arrays empty |
| Empty arrays/objects | Do not persist or export |

---

## 3. Tier matrix (export & public catalog)

| Field | Community (gratis) | Pro |
|-------|-------------------|-----|
| Core wallet fields (id, name, type, description, platforms, technical enums, …) | ✓ | ✓ |
| `deploymentModel`, `slaAvailable` | ✓ | ✓ |
| `license`, `licenseOther` | ✓ | ✓ |
| `media` | ✗ stripped on export | ✓ |
| `recognitions` | ✗ stripped on export | ✓ |
| `pricing` | ✗ stripped on export | ✓ |
| Existing Pro keys: `website`, `features`, `appStoreLinks`, `documentation`, `repository` | ✗ (unchanged) | ✓ |

**Implementation owner:** `Fides_Catalog_Org_Tier` in `fides-community-tools-tiles` — extend `WALLET_PRO_PAYLOAD_KEYS`:

- **Remove:** `video` (field no longer exists in v2)
- **Add:** `media`, `recognitions`, `pricing`

Update `OrgTierTest.php` accordingly.

---

## 4. v2 data model

### 4.1 Root catalog file

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v2",
  "orgId": "org:example",
  "wallets": [ … ],
  "lastUpdated": "2026-06-29T12:00:00.000Z"
}
```

Same root shape as v1; only `$schema` const changes.

### 4.2 Removed from v1 (breaking)

| v1 field | v2 replacement |
|----------|----------------|
| `video` (string URI) | `media.videos[]` |
| `certifications` (string[]) | `recognitions.certifications[]` |

### 4.3 New / changed wallet fields

#### `media` (optional, Pro-only in export)

```json
"media": {
  "videos": ["https://www.youtube.com/watch?v=…"],
  "images": ["https://example.com/screen.png"]
}
```

- At least one non-empty sub-array required if `media` object is present
- URLs: valid URI

#### `recognitions` (optional, Pro-only in export)

```json
"recognitions": {
  "customerStories": [{ "title": "…", "url": "https://…" }],
  "certifications": [{ "title": "ISO 27001" }],
  "awardsAndRecognitions": [{ "title": "…", "url": "https://…" }]
}
```

**RecognitionItem** (`$defs`):

| Property | Required | Constraints |
|----------|----------|-------------|
| `title` | yes | string, max 100 |
| `url` | no | URI |

Sub-array keys: `customerStories`, `certifications`, `awardsAndRecognitions`.

#### `deploymentModel` (optional, all tiers)

Enum: `saas` | `on_premises` | `hybrid`

#### `slaAvailable` (optional, all tiers)

Boolean.

#### `pricing` (optional, Pro-only in export)

String, max 1000 characters.

#### `license` (optional → required in form when `openSource: true`)

Enum values:

- `MIT`
- `Apache-2.0`
- `GPL-3.0-or-later`
- `AGPL-3.0-or-later`
- `LGPL-3.0-or-later`
- `EUPL-1.2`
- `MPL-2.0`
- `BSD-3-Clause`
- `ISC`
- `proprietary`
- `other`

When `license === "other"`: **`licenseOther` required**, max 50 chars.  
When `openSource === false`: omit `license` or use `proprietary`; do not require `licenseOther`.

### 4.4 Unchanged wallet fields

All other v1 wallet properties remain in v2 with the same enums and semantics:

`id`, `name`, `description`, `logo`, `website`, `type`, `capabilities`, `platforms`, `openSource`, `repository`, `vcFormat`, `issuanceProtocols`, `presentationProtocols`, `supportedIdentifiers`, `keyStorage`, `signingAlgorithms`, `credentialStatusMethods`, `interoperabilityProfiles`, `standards`, `features`, `documentation`, `appStoreLinks`, `status`, `releaseDate`, `createdAt`, `updated`, `updatedAt`.

`catalogTier` is **not** part of provider schema; set at crawl/export time (unchanged).

---

## 5. Validation limits (schema + adapter + form)

| Constraint | Max |
|------------|-----|
| `media.videos` | 3 |
| `media.images` | 10 |
| `recognitions.customerStories` | 5 |
| `recognitions.certifications` | 10 |
| `recognitions.awardsAndRecognitions` | 10 |
| RecognitionItem `title` | 100 chars |
| `licenseOther` | 50 chars |
| `pricing` | 1000 chars |

---

## 6. v1 → v2 migration rules

Automated migration (script + one-time PR):

| v1 | v2 |
|----|-----|
| `"$schema": ".../v1"` | `".../v2"` |
| `"video": "https://…"` | `"media": { "videos": ["https://…"] }` |
| `"certifications": ["A", "B"]` | `"recognitions": { "certifications": [{ "title": "A" }, { "title": "B" }] }` |
| `"license": "Apache 2.0"` | Map to `Apache-2.0` where possible; else `other` + `licenseOther` |

**Manual review** after migration for ambiguous license strings and any wallets that had both `video` and would need Pro tier to retain media in export.

---

## 7. Implementation phases

### Phase 0 — Prep (this document + clean working tree)

- [x] Reset local repo to `origin/main` (discard test submissions / local crawl noise)
- [x] Document plan (`docs/WALLET-CATALOG-V2-PLAN.md`)

### Phase 1 — Schema & types (`wallet-catalog` repo)

1. Add `schemas/wallet-catalog.schema.json` v2 (`$id` …/v2) or new file with v2 `$id` and retire v1 const (keep v1 file read-only for migration reference until deleted).
2. Update `schemas/README.md` with v2 field reference and limits.
3. Update TypeScript types: `src/types/wallet.ts`, `lib/httpWalletTypes.ts`.
4. Add shared limit constants (e.g. `src/constants/wallet-v2-limits.ts` or inline in schema tests).
5. Add JSON Schema validation tests / fixture wallets (Pro + Community minimal).

- [x] v2 schema (`schemas/wallet-catalog.schema.json`) + v1 archive (`wallet-catalog-v1.schema.json`)
- [x] `src/constants/wallet-v2-limits.ts`
- [x] TypeScript types updated; legacy `video`/`certifications` on `NormalizedWallet` only
- [x] Fixtures + `src/wallet-catalog-schema.test.ts`
- [x] `validate:v1` (community) + `validate:v2` (fixtures); CI workflow updated

### Phase 2 — Crawler & aggregate (`wallet-catalog` repo)

1. Crawler normalizes incoming v2; **reject v1** in CI after migration PR merges.
2. Optional one-release crawler shim: accept v1 input, emit v2 normalized (only if needed during transition — prefer hard cutover).
3. Regenerate `data/aggregated.json` and plugin copy.
4. Update editor / demo app if it references `video` or `certifications`.

- [x] Crawler validates against v2 schema (`schemas/wallet-catalog.schema.json`)
- [x] `src/lib/migrate-wallet-catalog-v1-to-v2.ts` + tests + `npm run migrate:v2`
- [x] `data/aggregated.json` + plugin copy regenerated (local crawl)
- [x] `App.tsx`, `check-links.ts`, `editor/index.html`, `import-wp-submissions.ts` updated

### Phase 3 — Community catalog migration (`wallet-catalog` repo)

1. Run migration script over `community-catalogs/*/wallet-catalog.json`.
2. Single PR: all catalogs on v2.
3. CI: fail if any file still declares v1 `$schema` or contains removed keys.

- [x] 92 community catalogs migrated to v2
- [x] `npm run validate:v2` validates community + fixtures (v1 `$schema` fails)
- [x] CI workflow uses v2 validation only

### Phase 4 — WordPress submission pipeline (`wallet-catalog` plugin) ✅

- [x] `Fides_Wallet_Catalog_V2_Normalizer` — limits, license/deployment enums, legacy ingest
- [x] `Fides_Wallet_Catalog_Submission_Adapter`: `SCHEMA` → v2; normalize new fields; enforce limits; diff labels
- [x] `class-fides-wallet-catalog-submission-forms.php`: help text + `v2Limits` config
- [x] `wallet-form.js`: media textareas, recognitions repeater, license `<select>`, deployment/SLA/pricing
- [x] Plugin version 2.9.0 + changelog

### Phase 5 — Shared tier filter (`fides-community-tools-tiles`) ✅

- [x] Update `WALLET_PRO_PAYLOAD_KEYS` (`video` → out; `media`, `recognitions`, `pricing` → in)
- [x] Extend `filter_wallet_export()` tests in `tests/unit/OrgTierTest.php`
- [x] Bump tiles to **1.8.0**; sync to catalog plugins / utrecht-demo
- [x] Update `docs/CATALOG-SUBMISSION-GOVERNANCE.md` tier table and wallet field list (v2)

### Phase 6 — Downstream consumers (follow-up, not blocking v2 data)

| Consumer | Action | Status |
|----------|--------|--------|
| `fides-catalog-ui.js` | Read v2 fields in wallet modal (`media`, `recognitions`, `pricing`, deployment/SLA) | ✅ (tiles 1.8.1) |
| Wallet SSR (`class-fides-wallet-catalog-ssr.php`) | Optional meta rows for deployment/SLA | ⏳ |
| `fides-api-gateway` | Tier-filter new keys on public API (known governance gap) | ⏳ |
| Modal CSS / layout | Broader design pass vs use-case catalog | ⏳ deferred |

- [x] Canonical modal updated; synced to wallet-catalog, catalog-map, and sibling catalogs via `sync-catalog-modal-library.sh`
- [x] `wallet-catalog.js` video filter/badge uses `media.videos` with legacy fallback

### Phase 7 — Verification checklist

- [ ] All `community-catalogs/*/wallet-catalog.json` validate against v2 schema
- [ ] `npm run validate` / CI schema job green
- [ ] Crawler produces `aggregated.json` without v1-only keys on wallets
- [ ] `php tools/phpunit.phar` green in tiles (OrgTier tests)
- [ ] Pro export includes `media`/`recognitions`/`pricing`; Community export strips them
- [ ] Submission adapter rejects over-limit arrays and invalid license combinations
- [ ] `schemas/README.md` and this plan updated if limits change

---

## 8. Files to touch (by repo)

### `fides-wallet-catalog`

| Path | Change |
|------|--------|
| `schemas/wallet-catalog.schema.json` | v2 schema |
| `schemas/README.md` | v2 reference |
| `docs/WALLET-CATALOG-V2-PLAN.md` | this plan |
| `src/types/wallet.ts` | interfaces |
| `lib/httpWalletTypes.ts` | interfaces |
| `src/crawler/*` | v2 ingest, migration helpers |
| `community-catalogs/**/wallet-catalog.json` | migrated data |
| `data/aggregated.json` | regenerated |
| `wordpress-plugin/.../class-fides-wallet-catalog-submission-adapter.php` | validation |
| `wordpress-plugin/.../wallet-form.js` | form fields |
| `wordpress-plugin/.../data/aggregated.json` | sync |
| `tools/migrate-wallet-catalog-v1-to-v2.*` | one-time migration script (new) |

### `fides-community-tools-tiles`

| Path | Change |
|------|--------|
| `includes/class-fides-catalog-org-tier.php` | Pro payload keys |
| `tests/unit/OrgTierTest.php` | tier strip tests |
| `docs/CATALOG-SUBMISSION-GOVERNANCE.md` | tier table |

---

## 9. Cutover strategy

1. Merge schema + types + migration script (no CI v2 gate yet).
2. Merge community-catalog v2 migration PR (all JSON files).
3. Enable CI gate: **v1 `$schema` fails**.
4. Merge tiles tier key update + plugin adapter.
5. Re-export WordPress submissions where Pro orgs should publish new fields.
6. Tag / release wallet-catalog plugin minor version; changelog references v2 schema and tiles dependency.

**Rollback:** revert migration PR and CI gate; keep v1 schema file in git history.

---

## 10. Example v2 wallet (Pro)

```json
{
  "id": "example-wallet",
  "name": "Example Wallet",
  "description": "Enterprise wallet for verifiable credentials.",
  "type": "organizational",
  "capabilities": ["holder", "issuer"],
  "platforms": ["iOS", "Android", "Web"],
  "openSource": true,
  "license": "Apache-2.0",
  "deploymentModel": "hybrid",
  "slaAvailable": true,
  "website": "https://example.com/wallet",
  "documentation": "https://docs.example.com/wallet",
  "repository": "https://github.com/example/wallet",
  "pricing": "Free tier for pilots. Enterprise pricing on request.",
  "media": {
    "videos": ["https://www.youtube.com/watch?v=abc"],
    "images": ["https://example.com/screen.png"]
  },
  "recognitions": {
    "customerStories": [
      { "title": "National bank rollout", "url": "https://example.com/case-study" }
    ],
    "certifications": [
      { "title": "ISO 27001", "url": "https://example.com/cert" }
    ],
    "awardsAndRecognitions": [
      { "title": "EIC Innovation Award 2025" }
    ]
  },
  "vcFormat": ["sd_jwt_vc"],
  "issuanceProtocols": ["OpenID4VCI"],
  "presentationProtocols": ["OpenID4VP"],
  "status": "production"
}
```

---

## 11. Changelog entry template (release)

```text
### Wallet catalog schema v2

- Breaking: provider JSON must use `$schema` …/wallet-catalog/v2
- Removed: `video`, `certifications` (string array)
- Added: `media`, `recognitions`, `deploymentModel`, `slaAvailable`, `pricing`, structured `license` enum
- Requires fides-community-tools-tiles ≥ 1.8.0 for updated Pro tier export keys
```

---

## 12. Related documents

- `docs/DESIGN_DECISIONS.md` — architecture context
- `fides-community-tools-tiles/docs/CATALOG-SUBMISSION-GOVERNANCE.md` — tier & submission rules
- `fides-community-tools-tiles/docs/MODAL-ARCHITECTURE-GOVERNANCE.md` — modal work (later phase)
