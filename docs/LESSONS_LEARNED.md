# Lessons Learned – Update Visibility & Filter Counters

*Documented: February 2026*

This document captures what we learned from the "semantic dates, update visibility, filter counters" feature so we get it right in one go next time (Wallet Catalog and RP Catalog or similar catalogs).

---

## 1. Data & date semantics

### 1.1 Do not use crawl time as "last updated"
- **Problem**: `fetchedAt` is the same for every item in a crawl; using it for "Last updated" makes everything look recently updated and sort order is meaningless.
- **Solution**: Introduce explicit semantic fields:
  - **`updatedAt`** – last meaningful content change (for sorting and "Updated &lt;date&gt;" on cards).
  - **`firstSeenAt`** – first time the item appeared in our catalog (for "Added last 30 days" and "Added &lt;date&gt;" on cards).

### 1.2 updatedAt fallback order
Use a clear priority so the date stays meaningful when providers omit fields:

1. Item-level: `updatedAt` / `updated` from provider JSON  
2. Catalog-level: `lastUpdated`  
3. **Git last-commit date** of the source file (e.g. `wallet-catalog.json`) – stable and better than crawl time  
4. `fetchedAt` only as last resort  

Implement in the crawler; see `src/crawler/index.ts` for reference.

### 1.3 firstSeenAt is system-managed
- **Do not** let providers set `firstSeenAt` in their JSON (they would overwrite it).
- **Do** persist it in a state file (e.g. `data/wallet-history-state.json`) and update it in the crawler when a wallet is first seen.
- Optional: one-time backfill from git history (e.g. `npm run backfill:first-seen`) for existing items.

### 1.4 Crawler owns semantic fields
The crawl action (e.g. `npm run crawl` or GitHub Action) computes and writes `updatedAt` and `firstSeenAt` into the aggregated output. No separate step is needed once the crawler logic is in place. After a merge, the **next** crawl run will repopulate these fields.

### 1.5 CI: full git history for accurate updatedAt
- **Problem**: In GitHub Actions, `actions/checkout@v4` does a **shallow clone** by default (single commit). Then `git log -1 -- <path>` for each catalog file returns that same commit’s date, so many wallets get “today” as `lastUpdated` even when their catalog file wasn’t changed.
- **Solution**: In the crawl workflow, set **`fetch-depth: 0`** on checkout so the repo has full history. Then the crawler’s git fallback gives the real last-commit date per file.

---

## 2. UX for "last updated" and "new"

### 2.1 Labels and sorting must match data
- If "Last updated" sort or "Updated last 30 days" is based on wrong dates (e.g. `fetchedAt`), some items will sit incorrectly at the top. Fix the data semantics first, then the UI will be correct.

### 2.2 Card labels: "Added" vs "Updated"
- For items that are "new" (e.g. added in last 30 days by `firstSeenAt`), show **"Added &lt;date&gt;"** on the card.
- For others, show **"Updated &lt;date&gt;"**.
- Keep the line subtle (e.g. in card body, no big badges) to avoid a noisy layout.

### 2.3 Dropdown affordance
- A plain &lt;select&gt; with only theme styling can look like a text field. Add an explicit **chevron** (e.g. via `appearance: none` + custom `background-image`) so it is clearly a dropdown.

### 2.4 Small screens: short labels
- KPI labels like "New last 30 days" can wrap on small screens. Use CSS to hide the extra part on narrow viewports (e.g. only "New" / "Updated") so the line stays on one row.

---

## 3. Filter option counters (facets)

### 3.1 Count over the visible set
- When the catalog is pre-filtered (e.g. shortcode `type="personal"`), **facets must be computed over that same set** (e.g. only personal wallets).
- Then "(n)" next to each option matches what the user sees when they select that filter. Avoid counting over the full dataset when the view is already filtered.

### 3.2 One computation after load
- Compute facets **once** after data load (single pass over the visible list). Store the result (e.g. `filterFacets`) and use it when rendering all filter options and quick filters.
- Use the **same derivation rules** as the actual filter (e.g. "Publicly available" = has app store links) so counts match selectable results.

### 3.3 Quick filters get counters too
- Add **(n)** to quick filters (e.g. "Added last 30 days (6)", "Includes video (12)") using the same facet data (e.g. `addedLast30Days`, `includesVideo` from the facets object).

### 3.4 KPI label when type is fixed
- When the shortcode sets `type="personal"` or `type="organizational"`, the first KPI card should show **"Personal Wallets"** or **"Business Wallets"** instead of the generic "Wallets".

---

## 4. Plugin and data flow

### 4.1 Plugin data fallback
- The plugin typically loads from GitHub first and falls back to a local file (e.g. `wordpress-plugin/.../data/aggregated.json`).
- For **local testing** with the latest generated data, **copy** the repo’s `data/aggregated.json` into the plugin’s `data/` folder; otherwise the plugin may use an old or remote version.

### 4.2 Backward compatibility
- New fields in `aggregated.json` (e.g. `updatedAt`, `firstSeenAt`) are safe as long as the plugin handles missing fields (e.g. fallbacks or hide empty labels). Old plugin versions will simply ignore unknown keys.

---

## 5. Documentation and conventions

### 5.1 Comments and UI in English
- Keep all **code comments** and **user-facing UI strings** in English. Add a project rule (e.g. Cursor rule "english-only") so this is consistent across repos.

### 5.2 Update docs with the feature
- When adding semantic dates, facets, or new UI: update **README**, **plugin readme** (features + changelog), and **DESIGN_DECISIONS** (and this doc) in the same pass so the next person (or the next run) has the full picture.

---

## 6. Checklist for "next time"

Use this when adding update visibility, filter counters, or semantic dates to a catalog (this or another):

- [ ] **Data**: Define `updatedAt` and (if needed) `firstSeenAt`; implement in crawler with clear fallback order; persist `firstSeenAt` in state file.
- [ ] **Crawler**: Use git last-commit date for source file as fallback for `updatedAt` before `fetchedAt`.
- [ ] **UI – Sort**: Default sort "Last updated" using `updatedAt`; ensure dropdown has clear chevron.
- [ ] **UI – Cards**: Show "Added &lt;date&gt;" for new items (by `firstSeenAt`), "Updated &lt;date&gt;" for others; keep it subtle.
- [ ] **UI – Facets**: Compute facets once over the **visible** set (respect shortcode/pre-filter); add **(n)** to every filter option and quick filter.
- [ ] **UI – KPI**: When type is fixed by shortcode, show "Personal Wallets" / "Business Wallets" instead of "Wallets"; on small screens shorten KPI labels if needed.
- [ ] **Plugin**: Document local fallback path; copy `aggregated.json` to plugin data folder when testing locally.
- [ ] **Docs**: Update README, plugin readme, DESIGN_DECISIONS; add/update LESSONS_LEARNED if needed.
- [ ] **Conventions**: English-only comments and UI; project rule in place.

---

*For implementation details, see `src/crawler/index.ts`, `wordpress-plugin/.../assets/wallet-catalog.js`, and [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) (e.g. §1.4 Semantic date strategy, §3.3 Filter option counters).*
