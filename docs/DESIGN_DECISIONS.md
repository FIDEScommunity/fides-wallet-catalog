# FIDES Catalog Platform - Design Decisions

*Documented: January 2026*

This document describes the key architecture and design decisions for the FIDES Wallet & RP Catalog platforms, so they can be reused in future projects.

---

## 1. Architecture & Data Management

### 1.1 Schema-Driven Development
- **Decision**: Use JSON Schema for all data validation
- **Rationale**: 
  - Prevents errors in community contributions
  - Documents data structure automatically
  - Enables automatic validation in CI/CD
- **Implementation**: `schemas/wallet-catalog.schema.json`, `schemas/rp-catalog.schema.json`

### 1.2 Community-Driven Decentralized Data
- **Decision**: Each provider manages their own subfolder with JSON file
- **Rationale**:
  - Providers maintain ownership of their own data
  - Pull requests only affect their own data
  - No central bottleneck for updates
- **Implementation**: `community-catalogs/{provider}/wallet-catalog.json`

### 1.3 Aggregated Data Generation
- **Decision**: Crawler script generates central `data/aggregated.json`
- **Rationale**:
  - Frontend doesn't need to load 70+ JSON files
  - Statistics are pre-calculated
  - Fast load time for users
- **Implementation**: `src/crawler/index.ts` + GitHub Action

### 1.4 Semantic Date Strategy for Sorting & "New" Signals
- **Decision**: Distinguish semantic update dates from technical crawl timestamps
- **Rationale**:
  - `fetchedAt` changes every crawl and causes noisy "recently updated" behavior
  - Users need meaningful chronology (`updatedAt`, `firstSeenAt`)
  - Stable "Added last 30 days" requires persisted first-seen tracking
- **Implementation**:
  - `updatedAt` fallback order:
    1) wallet `updatedAt` / `updated`
    2) catalog `lastUpdated`
    3) git last commit date of provider `wallet-catalog.json`
    4) `fetchedAt` (last resort)
  - `firstSeenAt` persisted in `data/wallet-history-state.json`
  - one-time backfill via `src/crawler/backfill-first-seen.ts`

### 1.5 Git Workflow & CI/CD
- **Decision**: Automatic validation and crawl in GitHub Actions
- **Rationale**:
  - Prevents merging invalid data
  - Automatic regeneration of aggregated.json
  - No manual steps required
- **Implementation**: `.github/workflows/validate.yml`, `.github/workflows/crawl.yml`

---

## 2. WordPress Plugin Architecture

### 2.1 Standalone Plugin with Own Assets
- **Decision**: Plugin contains own CSS/JS/data, not dependent on repo
- **Rationale**:
  - Plugin works out-of-the-box after installation
  - No external dependencies or API calls
  - Privacy-friendly (no tracking)
- **Implementation**: `wordpress-plugin/fides-*-catalog/`

### 2.2 Version-Based Cache Busting
- **Decision**: Plugin version number in asset URLs for cache invalidation
- **Rationale**:
  - Browsers cache CSS/JS aggressively
  - Version bump forces refresh
  - Prevents "old version" problems
- **Implementation**: 
```php
define('FIDES_WALLET_CATALOG_VERSION', '2.1.8');
wp_enqueue_style('fides-wallet-catalog', plugins_url('assets/style.css', __FILE__), [], FIDES_WALLET_CATALOG_VERSION);
```

### 2.3 Data Fallback Strategy
- **Decision**: Plugin tries GitHub CDN first, then local data
- **Rationale**:
  - Always most recent data from GitHub
  - Fallback to local data if GitHub is down
  - No API keys or rate limits
- **Implementation**:
```javascript
fetch('https://raw.githubusercontent.com/.../data/aggregated.json')
  .catch(() => fetch(pluginData.dataUrl)) // local fallback
```

---

## 3. Frontend Design Patterns

### 3.1 Client-Side Filtering
- **Decision**: All filtering happens in JavaScript, not server-side
- **Rationale**:
  - Instant response time
  - No server load
  - Works offline
  - Data is already loaded anyway
- **Implementation**: `handleFilterChange()`, `applyFilters()`

### 3.2 Layout Stability: Always-Present Hidden Elements
- **Decision**: Filter badges and "Clear all" button are always in DOM, but hidden with CSS
- **Rationale**:
  - Prevents layout shifts on filter changes
  - Better UX (Cumulative Layout Shift score)
  - Simpler CSS (no height calculations)
- **Implementation**:
```css
.fides-filter-count.hidden { visibility: hidden; }
.fides-clear-all.hidden { visibility: hidden; }
```
```javascript
clearAllBtn.classList.toggle('hidden', activeCount === 0);
```

**Important**: Use `visibility: hidden`, NOT `display: none`, to preserve space.

### 3.3 Mobile-First Search: Partial Re-render
- **Decision**: On search input only update grid, not entire DOM
- **Rationale**:
  - On mobile keyboard disappears with full re-render
  - Better performance (less DOM manipulation)
  - Preserve focus state
- **Implementation**:
```javascript
function renderWalletGridOnly() {
  const gridContainer = document.querySelector('.fides-wallet-grid');
  gridContainer.innerHTML = ''; // only clear grid
  // ... render only cards
  document.querySelector('.fides-results-count').textContent = `${count} wallets`;
}
```

### 3.4 Progressive Disclosure: Collapsible Filters
- **Decision**: Filter groups are collapsible with state persistence
- **Rationale**:
  - Clear overview on mobile
  - User controls their own view
  - Preserve state for consistency
- **Implementation**: `filterGroupState` object + localStorage

---

## 4. Visual Design & UX

### 4.1 Always Visible CTAs
- **Decision**: "View details" button always visible on cards (no hover-only)
- **Rationale**:
  - Touch devices don't have hover
  - Better accessibility
  - Clearer call-to-action
- **Implementation**:
```css
.fides-view-details {
  opacity: 1 !important;
  visibility: visible !important;
}
```

### 4.2 Visual Hierarchy: Color-Coded Elements
- **Decision**: Different colors for different element types
- **Rationale**:
  - Clickable elements (app store links) have unique styling (dark green + gradient)
  - Tags have lighter colors
  - Status badges (readiness) have their own color scheme
  - Visually clear what is interactive
- **Implementation**:
```css
/* Clickable platform tags */
.fides-platform-tag a {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
}

/* Status badges */
.fides-status-production { background-color: #10b981; }
.fides-status-production-pilot { background-color: #8b5cf6; }
```

### 4.3 Bottom-Aligned Footer
- **Decision**: Card footer (with CTA) always at bottom, regardless of content length
- **Rationale**:
  - Consistent grid layout
  - CTAs at same height
  - Professional appearance
- **Implementation**:
```css
.fides-wallet-card {
  display: flex;
  flex-direction: column;
}
.fides-wallet-footer {
  margin-top: auto;
}
```

### 4.4 Icon-First Design
- **Decision**: Use SVG icons for all interactions and statuses
- **Rationale**:
  - Language-independent
  - Faster to scan
  - More modern appearance
- **Implementation**: `icons` object with SVG strings

---

## 5. Data Modeling

### 5.1 Readiness Levels (not "Type" or "Status")
- **Decision**: Use "readiness" field with standardized values
- **Rationale**:
  - "Type" is too generic
  - "Status" implies temporariness
  - "Readiness" communicates deployment phase
- **Values**: `technical-demo`, `use-case-demo`, `production-pilot`, `production`

### 5.2 Keyword-Based Classification
- **Decision**: Government/Private classification based on keywords in name/provider
- **Rationale**:
  - Providers don't always explicitly indicate this
  - Keywords are reliable indicators
  - Easy to extend
- **Implementation**:
```javascript
const govKeywords = ['government', 'federal', 'ministry', 'state-owned', 
                     'logius', 'agency', 'eudi wallet', ...];
```

### 5.3 Consistent Naming Conventions
- **Decision**: camelCase for all JSON properties, kebab-case for CSS classes
- **Rationale**:
  - camelCase is JavaScript/JSON standard
  - kebab-case is CSS best practice
  - Consistency prevents bugs

---

## 6. Performance & Optimization

### 6.1 Debounced Search Input
- **Decision**: 300ms debounce on search input
- **Rationale**:
  - Prevents re-render on every keystroke
  - Better performance
  - Lower CPU usage
- **Implementation**:
```javascript
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearchInput, 300);
});
```

### 6.2 CSS-Only Hover Effects
- **Decision**: All hover effects in CSS, not in JavaScript
- **Rationale**:
  - Better performance (GPU accelerated)
  - No event listeners needed
  - Easier to maintain
- **Implementation**: `:hover` pseudo-class

---

## 7. Maintenance & Extensibility

### 7.1 Ordered Enums for Consistent Sorting
- **Decision**: Arrays with order for each enum (capabilities, formats, etc.)
- **Rationale**:
  - Consistent order in UI
  - Easy to update
  - Central configuration
- **Implementation**:
```javascript
const CREDENTIAL_FORMAT_ORDER = [
  'SD-JWT VC', 'mDL', 'W3C VC', 'AnonCreds', ...
];
```

### 7.2 Separation of Concerns
- **Decision**: Schema, data, frontend and plugin are decoupled
- **Rationale**:
  - Schema changes propagate automatically
  - Frontend works with any valid data
  - Plugin can be used standalone
  - Testing is simpler

### 7.3 Documentation Co-Location
- **Decision**: README.md in each community-catalog folder
- **Rationale**:
  - Contributors see instructions immediately
  - Schema documentation with schema
  - Low barrier for contributions

---

## 8. Security & Privacy

### 8.1 No External Dependencies in Frontend
- **Decision**: No CDN-based libraries (jQuery, Bootstrap, etc.)
- **Rationale**:
  - No privacy issues (GDPR compliance)
  - No downtime from external services
  - Full control over code
  - Smaller package

### 8.2 Content Security Policy Ready
- **Decision**: Avoid inline styles/scripts where possible
- **Rationale**:
  - CSP compliance
  - Better security
  - Easier to audit

---

## 9. Lessons Learned

### 9.1 Browser Caching is Aggressive
- **Problem**: Updates not visible after deployment
- **Solution**: Version number in asset URLs
- **Takeaway**: ALWAYS implement version-based cache busting

### 9.2 Mobile Keyboard Behavior
- **Problem**: Keyboard disappears on DOM re-render
- **Solution**: Partial re-render of only grid
- **Takeaway**: Test all interactions on touch devices

### 9.3 Layout Shifts Are Disruptive
- **Problem**: Filter UI "jumps" on state changes
- **Solution**: Always-present but hidden elements
- **Takeaway**: Use `visibility: hidden`, not `display: none`

### 9.4 Community Contributions Need Validation
- **Problem**: Invalid JSON in pull requests
- **Solution**: Automatic schema validation in CI/CD
- **Takeaway**: Validation must happen BEFORE merge

### 9.5 Git Conflicts in Data Files
- **Problem**: Local data conflicts with GitHub updates
- **Solution**: Data folder in .gitignore for local dev, but IN repo
- **Takeaway**: Clear data flow: GitHub → Plugin, not Plugin → GitHub

---

## 10. Reusable Template

For new FIDES catalog projects:

1. ✅ Start with JSON Schema for data structure
2. ✅ Create community-driven folder structure
3. ✅ Implement crawler → aggregated.json flow
4. ✅ Setup GitHub Actions for validation + crawl
5. ✅ Build WordPress plugin with:
   - Version-based cache busting
   - Standalone assets (CSS/JS/data)
   - GitHub CDN with local fallback
6. ✅ Implement frontend with:
   - Client-side filtering
   - Partial re-render for search
   - Always-present hidden elements
   - Mobile-first design
7. ✅ Test on:
   - Desktop (Chrome, Firefox, Safari)
   - Mobile (iOS Safari, Android Chrome)
   - Tablet
8. ✅ Document in README.md + schema docs

---

## Contact

**FIDES Labs BV**  
- Website: https://fides.community
- GitHub: https://github.com/FIDEScommunity

*These decisions are documented based on real-world experience with 70+ community contributors and hundreds of thousands of users.*
