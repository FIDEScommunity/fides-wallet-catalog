/**
 * FIDES Wallet Catalog - WordPress Plugin JavaScript
 */

(function() {
  'use strict';

  // Icons (inline SVG)
  const icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>',
    externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>',
    smartphone: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    key: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    award: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    apple: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
    playStore: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z"/></svg>'
  };

  // Selected wallet for modal
  let selectedWallet = null;

  // Credential format sort order (consistent ordering)
  const CREDENTIAL_FORMAT_ORDER = [
    'SD-JWT-VC',
    'SD-JWT',
    'mDL/mDoc',
    'JWT-VC',
    'JSON-LD VC',
    'AnonCreds',
    'X.509',
    'CBOR-LD'
  ];

  /**
   * Sort credential formats in consistent order
   */
  function sortCredentialFormats(formats) {
    if (!formats || !Array.isArray(formats)) return [];
    return [...formats].sort((a, b) => {
      const indexA = CREDENTIAL_FORMAT_ORDER.indexOf(a);
      const indexB = CREDENTIAL_FORMAT_ORDER.indexOf(b);
      // Unknown formats go to the end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
  }

  // Configuration
  const config = window.fidesWalletCatalog || {
    pluginUrl: '',
    githubDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json'
  };

  // State
  let wallets = [];
  let filters = {
    search: '',
    type: [],
    capabilities: [],
    platforms: [],
    credentialFormats: [],
    interoperabilityProfiles: [],
    openSource: null
  };
  let showFiltersPanel = false;

  // DOM Elements
  let container;
  let settings;

  /**
   * Initialize the catalog
   */
  function init() {
    container = document.getElementById('fides-wallet-catalog-root');
    if (!container) return;

    // Read settings from data attributes
    settings = {
      type: container.dataset.type || '',
      showFilters: container.dataset.showFilters !== 'false',
      showSearch: container.dataset.showSearch !== 'false',
      columns: container.dataset.columns || '3',
      theme: container.dataset.theme || 'dark'
    };

    // Set theme
    container.setAttribute('data-theme', settings.theme);

    // Pre-filter by type if specified
    if (settings.type) {
      filters.type = [settings.type];
    }

    // Load data
    loadWallets();
  }

  /**
   * Load wallets from multiple sources (with fallbacks)
   * Priority: 1. API  2. GitHub  3. Local plugin data
   */
  async function loadWallets() {
    const sources = [
      { name: 'GitHub', url: config.githubDataUrl, transform: (d) => d.wallets || [] },
      { name: 'Local', url: `${config.pluginUrl}data/aggregated.json`, transform: (d) => d.wallets || [] }
    ];

    for (const source of sources) {
      if (!source.url) continue;
      
      try {
        const response = await fetch(source.url);
        if (response.ok) {
          const data = await response.json();
          wallets = source.transform(data);
          console.log(`✅ Loaded ${wallets.length} wallets from ${source.name}`);
          break;
        }
      } catch (error) {
        console.warn(`Failed to load from ${source.name}:`, error.message);
      }
    }

    if (wallets.length === 0) {
      console.error('Failed to load wallets from any source');
    }

    render();
  }

  /**
   * Filter wallets based on current filters
   */
  function getFilteredWallets() {
    return wallets.filter(wallet => {
      // Search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matches = 
          wallet.name.toLowerCase().includes(search) ||
          (wallet.description || '').toLowerCase().includes(search) ||
          wallet.provider.name.toLowerCase().includes(search);
        if (!matches) return false;
      }

      // Type
      if (filters.type.length > 0) {
        if (!filters.type.includes(wallet.type)) return false;
      }

      // Capabilities (for organizational wallets)
      if (filters.capabilities.length > 0) {
        const hasMatch = filters.capabilities.some(c => (wallet.capabilities || []).includes(c));
        if (!hasMatch) return false;
      }

      // Platforms
      if (filters.platforms.length > 0) {
        const hasMatch = filters.platforms.some(p => (wallet.platforms || []).includes(p));
        if (!hasMatch) return false;
      }

      // Credential formats
      if (filters.credentialFormats.length > 0) {
        const hasMatch = filters.credentialFormats.some(f => (wallet.credentialFormats || []).includes(f));
        if (!hasMatch) return false;
      }

      // Interoperability profiles
      if (filters.interoperabilityProfiles.length > 0) {
        const hasMatch = filters.interoperabilityProfiles.some(p => (wallet.interoperabilityProfiles || []).includes(p));
        if (!hasMatch) return false;
      }

      // Open source
      if (filters.openSource !== null) {
        if (wallet.openSource !== filters.openSource) return false;
      }

      return true;
    });
  }

  /**
   * Count active filters
   */
  function getActiveFilterCount() {
    let count = 0;
    if (!settings.type) count += filters.type.length;
    count += filters.capabilities.length;
    count += filters.platforms.length;
    count += filters.credentialFormats.length;
    count += filters.interoperabilityProfiles.length;
    if (filters.openSource !== null) count += 1;
    return count;
  }

  /**
   * Render the catalog
   */
  function render() {
    const filtered = getFilteredWallets();
    const activeFilterCount = getActiveFilterCount();
    
    // Save focus state before re-rendering
    const searchInput = document.getElementById('fides-search');
    const wasSearchFocused = searchInput && document.activeElement === searchInput;
    const cursorPosition = wasSearchFocused ? searchInput.selectionStart : 0;
    
    let html = '';

    // Search
    if (settings.showSearch) {
      html += `
        <div class="fides-search-container">
          <div class="fides-search-wrapper">
            <span class="fides-search-icon">${icons.search}</span>
            <input 
              type="text" 
              class="fides-search-input" 
              placeholder="Search by name, description or provider..."
              value="${escapeHtml(filters.search)}"
              id="fides-search"
            >
            <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-search-clear" type="button">
              ${icons.xSmall}
            </button>
          </div>
        </div>
      `;
    }

    // Filter toggle bar
    if (settings.showFilters) {
      html += `
        <div class="fides-filter-bar">
          <div class="fides-filter-bar-left">
            <button class="fides-filter-toggle ${showFiltersPanel ? 'active' : ''}" id="fides-filter-toggle">
              ${icons.filter}
              <span>Filters</span>
              ${activeFilterCount > 0 ? `<span class="fides-filter-count">${activeFilterCount}</span>` : ''}
            </button>
            ${activeFilterCount > 0 ? `
              <button class="fides-clear-all" id="fides-clear">
                ${icons.x} Clear filters
              </button>
            ` : ''}
          </div>
          <div class="fides-results-count">
            ${filtered.length} wallet${filtered.length !== 1 ? 's' : ''} found
          </div>
        </div>
      `;

      // Filters panel
      if (showFiltersPanel) {
        html += `
          <div class="fides-filters">
            ${!settings.type ? `
              <div class="fides-filter-group">
                <span class="fides-filter-label">Type</span>
                <div class="fides-filter-buttons">
                  <button class="fides-filter-btn ${filters.type.includes('personal') ? 'active' : ''}" data-filter="type" data-value="personal">Personal</button>
                  <button class="fides-filter-btn ${filters.type.includes('organizational') ? 'active' : ''}" data-filter="type" data-value="organizational">Organizational</button>
                </div>
              </div>
            ` : ''}
            <div class="fides-filter-group">
              <span class="fides-filter-label">Capabilities</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.capabilities.includes('holder') ? 'active' : ''}" data-filter="capabilities" data-value="holder">Holder</button>
                <button class="fides-filter-btn ${filters.capabilities.includes('issuer') ? 'active' : ''}" data-filter="capabilities" data-value="issuer">Issuer</button>
                <button class="fides-filter-btn ${filters.capabilities.includes('verifier') ? 'active' : ''}" data-filter="capabilities" data-value="verifier">Verifier</button>
              </div>
            </div>
            <div class="fides-filter-group">
              <span class="fides-filter-label">Interop Profile</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.interoperabilityProfiles.includes('DIIP v4') ? 'active' : ''}" data-filter="interoperabilityProfiles" data-value="DIIP v4">DIIP v4</button>
                <button class="fides-filter-btn ${filters.interoperabilityProfiles.includes('EWC v3') ? 'active' : ''}" data-filter="interoperabilityProfiles" data-value="EWC v3">EWC v3</button>
              </div>
            </div>
            <div class="fides-filter-group">
              <span class="fides-filter-label">Platform</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.platforms.includes('iOS') ? 'active' : ''}" data-filter="platforms" data-value="iOS">iOS</button>
                <button class="fides-filter-btn ${filters.platforms.includes('Android') ? 'active' : ''}" data-filter="platforms" data-value="Android">Android</button>
                <button class="fides-filter-btn ${filters.platforms.includes('Web') ? 'active' : ''}" data-filter="platforms" data-value="Web">Web</button>
              </div>
            </div>
            <div class="fides-filter-group">
              <span class="fides-filter-label">Credential Format</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.credentialFormats.includes('SD-JWT-VC') ? 'active' : ''}" data-filter="credentialFormats" data-value="SD-JWT-VC">SD-JWT-VC</button>
                <button class="fides-filter-btn ${filters.credentialFormats.includes('mDL/mDoc') ? 'active' : ''}" data-filter="credentialFormats" data-value="mDL/mDoc">mDL/mDoc</button>
                <button class="fides-filter-btn ${filters.credentialFormats.includes('JWT-VC') ? 'active' : ''}" data-filter="credentialFormats" data-value="JWT-VC">JWT-VC</button>
                <button class="fides-filter-btn ${filters.credentialFormats.includes('AnonCreds') ? 'active' : ''}" data-filter="credentialFormats" data-value="AnonCreds">AnonCreds</button>
                <button class="fides-filter-btn ${filters.credentialFormats.includes('JSON-LD VC') ? 'active' : ''}" data-filter="credentialFormats" data-value="JSON-LD VC">JSON-LD VC</button>
              </div>
            </div>
            <div class="fides-filter-group">
              <span class="fides-filter-label">License</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.openSource === true ? 'active' : ''}" data-filter="openSource" data-value="true">
                  ${icons.github} Open Source
                </button>
                <button class="fides-filter-btn ${filters.openSource === false ? 'active' : ''}" data-filter="openSource" data-value="false">
                  Proprietary
                </button>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // Simple results info without filter toggle
      html += `
        <div class="fides-results-info">
          <span>${filtered.length} wallet${filtered.length !== 1 ? 's' : ''} found</span>
        </div>
      `;
    }

    // Wallet grid
    if (filtered.length > 0) {
      html += `<div class="fides-wallet-grid" data-columns="${settings.columns}">`;
      filtered.forEach(wallet => {
        html += renderWalletCard(wallet);
      });
      html += '</div>';
    } else {
      html += `
        <div class="fides-empty">
          <div class="fides-empty-icon">${icons.wallet}</div>
          <h3 class="fides-empty-title">No wallets found</h3>
          <p class="fides-empty-text">Adjust your filters or try a different search query.</p>
        </div>
      `;
    }

    container.innerHTML = html;
    attachEventListeners();
    
    // Restore focus to search input if it was focused
    if (wasSearchFocused) {
      const newSearchInput = document.getElementById('fides-search');
      if (newSearchInput) {
        newSearchInput.focus();
        newSearchInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }

  /**
   * Render a single wallet card
   */
  function renderWalletCard(wallet) {
    const typeLabels = {
      personal: 'Personal',
      organizational: 'Organizational'
    };

    const capabilityLabels = {
      holder: 'Holder',
      issuer: 'Issuer',
      verifier: 'Verifier'
    };

    return `
      <div class="fides-wallet-card" data-wallet-id="${wallet.id}" role="button" tabindex="0">
        <div class="fides-wallet-header type-${wallet.type}">
          ${wallet.logo 
            ? `<img src="${escapeHtml(wallet.logo)}" alt="${escapeHtml(wallet.name)}" class="fides-wallet-logo">`
            : `<div class="fides-wallet-logo-placeholder">${icons.wallet}</div>`
          }
          <div class="fides-wallet-info">
            <h3 class="fides-wallet-name">${escapeHtml(wallet.name)}</h3>
            <p class="fides-wallet-provider">${escapeHtml(wallet.provider.name)}</p>
          </div>
          <span class="fides-wallet-type-badge ${wallet.type}">${typeLabels[wallet.type]}</span>
        </div>
        <div class="fides-wallet-body">
          ${wallet.description ? `<p class="fides-wallet-description">${escapeHtml(wallet.description)}</p>` : ''}
          
          ${wallet.capabilities && wallet.capabilities.length > 0 ? `
            <div class="fides-tags fides-capability-tags">
              ${wallet.capabilities.map(c => `
                <span class="fides-tag capability capability-${c}">
                  ${capabilityLabels[c] || c}
                </span>
              `).join('')}
            </div>
          ` : ''}
          
          ${wallet.platforms && wallet.platforms.length > 0 ? `
            <div class="fides-tags">
              ${wallet.platforms.map(p => `
                <span class="fides-tag platform">
                  ${p === 'iOS' || p === 'Android' ? icons.smartphone : icons.globe}
                  ${escapeHtml(p)}
                </span>
              `).join('')}
            </div>
          ` : ''}

          ${wallet.interoperabilityProfiles && wallet.interoperabilityProfiles.length > 0 ? `
            <div class="fides-tags">
              ${wallet.interoperabilityProfiles.map(p => `
                <span class="fides-tag interop">${escapeHtml(p)}</span>
              `).join('')}
            </div>
          ` : ''}
          
          ${wallet.credentialFormats && wallet.credentialFormats.length > 0 ? `
            <div class="fides-wallet-section">
              <h4 class="fides-wallet-section-title">Credential Formats</h4>
              <div class="fides-tags">
                ${sortCredentialFormats(wallet.credentialFormats).map(f => `<span class="fides-tag">${escapeHtml(f)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="fides-wallet-footer">
          <div class="fides-wallet-links">
            ${wallet.openSource && wallet.repository ? `
              <a href="${escapeHtml(wallet.repository)}" target="_blank" rel="noopener" class="fides-wallet-link" onclick="event.stopPropagation();">
                ${icons.github} Open Source
              </a>
            ` : ''}
            ${wallet.website ? `
              <a href="${escapeHtml(wallet.website)}" target="_blank" rel="noopener" class="fides-wallet-link" onclick="event.stopPropagation();">
                ${icons.externalLink} Website
              </a>
            ` : ''}
          </div>
          <span class="fides-view-details">View details →</span>
        </div>
      </div>
    `;
  }

  /**
   * Get app store link for a platform
   */
  function getAppStoreLink(wallet, platform) {
    if (!wallet.appStoreLinks) return null;
    const platformKey = platform.toLowerCase();
    if (platformKey === 'ios') return wallet.appStoreLinks.iOS || wallet.appStoreLinks.ios;
    if (platformKey === 'android') return wallet.appStoreLinks.android;
    if (platformKey === 'web') return wallet.appStoreLinks.web || wallet.website;
    return null;
  }

  /**
   * Get app store icon for a platform
   */
  function getAppStoreIcon(platform) {
    const p = platform.toLowerCase();
    if (p === 'ios') return icons.apple;
    if (p === 'android') return icons.playStore;
    return icons.globe;
  }

  /**
   * Render platform tag (clickable if app store link available)
   */
  function renderPlatformTag(wallet, platform) {
    const link = getAppStoreLink(wallet, platform);
    const icon = platform === 'iOS' || platform === 'Android' ? icons.smartphone : icons.globe;
    
    if (link) {
      return `<a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="fides-tag platform clickable">${icon} ${escapeHtml(platform)}</a>`;
    }
    return `<span class="fides-tag platform">${icon} ${escapeHtml(platform)}</span>`;
  }

  /**
   * Render the wallet detail modal
   */
  function renderModal(wallet) {
    const typeLabels = {
      personal: 'Personal',
      organizational: 'Organizational'
    };

    const statusLabels = {
      development: 'In Development',
      beta: 'Beta',
      production: 'Production',
      deprecated: 'Deprecated'
    };

    const statusClasses = {
      development: 'status-dev',
      beta: 'status-beta',
      production: 'status-prod',
      deprecated: 'status-deprecated'
    };

    // Combine issuance and presentation protocols
    // Collect protocols from both old format (issuanceProtocols/presentationProtocols) 
    // and new format (protocols.issuance/protocols.presentation)
    const protocolsObj = wallet.protocols || {};
    const allProtocols = [
      ...(wallet.issuanceProtocols || []),
      ...(wallet.presentationProtocols || []),
      ...(protocolsObj.issuance || []),
      ...(protocolsObj.presentation || [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    // Get current theme from container
    const currentTheme = container.getAttribute('data-theme') || 'dark';

    const modalHtml = `
      <div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="${currentTheme}">
        <div class="fides-modal" role="dialog" aria-modal="true" aria-labelledby="fides-modal-title">
          <div class="fides-modal-header">
            <div class="fides-modal-header-content">
              ${wallet.logo 
                ? `<img src="${escapeHtml(wallet.logo)}" alt="${escapeHtml(wallet.name)}" class="fides-modal-logo">`
                : `<div class="fides-modal-logo-placeholder">${icons.wallet}</div>`
              }
              <div class="fides-modal-title-wrap">
                <h2 class="fides-modal-title" id="fides-modal-title">${escapeHtml(wallet.name)}</h2>
                <p class="fides-modal-provider">${icons.building} ${escapeHtml(wallet.provider.name)}</p>
              </div>
            </div>
            <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">
              ${icons.xLarge}
            </button>
          </div>
          
          <div class="fides-modal-body">
            <!-- Type, Status & License badges -->
            <div class="fides-modal-badges">
              <span class="fides-modal-badge type-${wallet.type}">
                ${typeLabels[wallet.type]}
              </span>
              ${wallet.capabilities && wallet.capabilities.length > 0 ? wallet.capabilities.map(c => `
                <span class="fides-modal-badge capability-${c}">
                  ${c.charAt(0).toUpperCase() + c.slice(1)}
                </span>
              `).join('') : ''}
              ${wallet.status ? `
                <span class="fides-modal-badge ${statusClasses[wallet.status] || ''}">
                  ${statusLabels[wallet.status] || wallet.status}
                </span>
              ` : ''}
              <span class="fides-modal-badge ${wallet.openSource ? 'open-source' : 'proprietary'}">
                ${wallet.openSource ? `${icons.github} Open Source${wallet.license ? ` (${escapeHtml(wallet.license)})` : ''}` : 'Proprietary'}
              </span>
            </div>

            <!-- Description -->
            ${wallet.description ? `
              <div class="fides-modal-section">
                <p class="fides-modal-description">${escapeHtml(wallet.description)}</p>
              </div>
            ` : ''}

            <!-- App Store Links -->
            ${wallet.appStoreLinks && (wallet.appStoreLinks.iOS || wallet.appStoreLinks.ios || wallet.appStoreLinks.android) ? `
              <div class="fides-modal-app-stores">
                ${wallet.appStoreLinks.iOS || wallet.appStoreLinks.ios ? `
                  <a href="${escapeHtml(wallet.appStoreLinks.iOS || wallet.appStoreLinks.ios)}" target="_blank" rel="noopener" class="fides-app-store-btn ios">
                    ${icons.apple}
                    <span>
                      <small>Download on the</small>
                      <strong>App Store</strong>
                    </span>
                  </a>
                ` : ''}
                ${wallet.appStoreLinks.android ? `
                  <a href="${escapeHtml(wallet.appStoreLinks.android)}" target="_blank" rel="noopener" class="fides-app-store-btn android">
                    ${icons.playStore}
                    <span>
                      <small>Get it on</small>
                      <strong>Google Play</strong>
                    </span>
                  </a>
                ` : ''}
              </div>
            ` : ''}

            <!-- Quick info grid -->
            <div class="fides-modal-grid">
              <!-- Platforms -->
              ${wallet.platforms && wallet.platforms.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.smartphone} Platforms
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.platforms.map(p => renderPlatformTag(wallet, p)).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Credential Formats -->
              ${wallet.credentialFormats && wallet.credentialFormats.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.fileCheck} Credential Formats
                  </div>
                  <div class="fides-modal-grid-value">
                    ${sortCredentialFormats(wallet.credentialFormats).map(f => `<span class="fides-tag credential-format">${escapeHtml(f)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Issuance Protocols -->
              ${(() => {
                const issuance = wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || [];
                return issuance.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.download} Issuance Protocols
                  </div>
                  <div class="fides-modal-grid-value">
                    ${issuance.map(p => `<span class="fides-tag protocol-issuance">${escapeHtml(p)}</span>`).join('')}
                  </div>
                </div>
              ` : '';
              })()}

              <!-- Presentation Protocols -->
              ${(() => {
                const presentation = wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || [];
                return presentation.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.shield} Presentation Protocols
                  </div>
                  <div class="fides-modal-grid-value">
                    ${presentation.map(p => `<span class="fides-tag protocol-presentation">${escapeHtml(p)}</span>`).join('')}
                  </div>
                </div>
              ` : '';
              })()}

              <!-- DID Methods -->
              ${(wallet.supportedDIDMethods || wallet.didMethods) && (wallet.supportedDIDMethods || wallet.didMethods).length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.key} DID Methods
                  </div>
                  <div class="fides-modal-grid-value">
                    ${(wallet.supportedDIDMethods || wallet.didMethods).map(d => `<span class="fides-tag did-method">${escapeHtml(d)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Key Management -->
              ${wallet.keyManagement && wallet.keyManagement.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.key} Key Management
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.keyManagement.map(k => `<span class="fides-tag">${escapeHtml(k)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Standards -->
              ${wallet.standards && wallet.standards.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.book} Standards
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.standards.map(s => `<span class="fides-tag standard">${escapeHtml(s)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Certifications -->
              ${wallet.certifications && wallet.certifications.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.award} Certifications
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.certifications.map(c => `<span class="fides-tag certification">${escapeHtml(c)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Interoperability Profiles -->
              ${wallet.interoperabilityProfiles && wallet.interoperabilityProfiles.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.shield} Interop Profiles
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.interoperabilityProfiles.map(p => `<span class="fides-tag interop">${escapeHtml(p)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Features -->
            ${wallet.features && wallet.features.length > 0 ? `
              <div class="fides-modal-features">
                <h4 class="fides-modal-section-title">Features</h4>
                <ul class="fides-features-list">
                  ${wallet.features.map(f => `
                    <li>${icons.check} ${escapeHtml(f)}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- Links -->
            <div class="fides-modal-links">
              ${wallet.website ? `
                <a href="${escapeHtml(wallet.website)}" target="_blank" rel="noopener" class="fides-modal-link primary">
                  ${icons.externalLink} Visit Website
                </a>
              ` : ''}
              ${wallet.openSource && wallet.repository ? `
                <a href="${escapeHtml(wallet.repository)}" target="_blank" rel="noopener" class="fides-modal-link">
                  ${icons.github} View Repository
                </a>
              ` : ''}
              ${wallet.documentation ? `
                <a href="${escapeHtml(wallet.documentation)}" target="_blank" rel="noopener" class="fides-modal-link">
                  ${icons.book} Documentation
                </a>
              ` : ''}
            </div>

            <!-- Provider info -->
            <div class="fides-modal-provider-section">
              <h4 class="fides-modal-section-title">Provider Information</h4>
              <div class="fides-modal-provider-info">
                <div class="fides-modal-provider-detail">
                  <span class="fides-modal-provider-label">Organization:</span>
                  <span class="fides-modal-provider-value">${escapeHtml(wallet.provider.name)}</span>
                </div>
                ${wallet.provider.did ? `
                  <div class="fides-modal-provider-detail">
                    <span class="fides-modal-provider-label">DID:</span>
                    <code class="fides-modal-provider-did">${escapeHtml(wallet.provider.did)}</code>
                  </div>
                ` : ''}
                ${wallet.releaseDate ? `
                  <div class="fides-modal-provider-detail">
                    <span class="fides-modal-provider-label">Release Date:</span>
                    <span class="fides-modal-provider-value">${new Date(wallet.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Attach modal event listeners
    attachModalListeners();
  }

  /**
   * Close the modal
   */
  function closeModal() {
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
        selectedWallet = null;
      }, 200);
    }
  }

  /**
   * Attach modal event listeners
   */
  function attachModalListeners() {
    const overlay = document.getElementById('fides-modal-overlay');
    const closeBtn = document.getElementById('fides-modal-close');
    const modal = overlay.querySelector('.fides-modal');

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Click outside modal
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      });
    }

    // Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });

    // Focus trap
    if (modal) {
      modal.focus();
    }
  }

  /**
   * Open wallet detail modal
   */
  function openWalletDetail(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      selectedWallet = wallet;
      renderModal(wallet);
    }
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('fides-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        filters.search = e.target.value;
        render();
      }, 300));
    }

    // Search clear button
    const searchClear = document.getElementById('fides-search-clear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        filters.search = '';
        render();
      });
    }

    // Filter toggle
    const filterToggle = document.getElementById('fides-filter-toggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        showFiltersPanel = !showFiltersPanel;
        render();
      });
    }

    // Filter buttons
    container.querySelectorAll('.fides-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.dataset.filter;
        const value = btn.dataset.value;
        
        // Special handling for openSource (boolean toggle)
        if (filterType === 'openSource') {
          const boolValue = value === 'true';
          filters.openSource = filters.openSource === boolValue ? null : boolValue;
        } else {
          // Array-based filters
          if (filters[filterType].includes(value)) {
            filters[filterType] = filters[filterType].filter(v => v !== value);
          } else {
            filters[filterType].push(value);
          }
        }
        
        render();
      });
    });

    // Clear filters
    const clearBtn = document.getElementById('fides-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        filters = {
          search: filters.search,
          type: settings.type ? [settings.type] : [],
          capabilities: [],
          platforms: [],
          credentialFormats: [],
          interoperabilityProfiles: [],
          openSource: null
        };
        render();
      });
    }

    // Wallet card click - open detail modal
    container.querySelectorAll('.fides-wallet-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't open modal if clicking a link
        if (e.target.closest('a')) return;
        
        const walletId = card.dataset.walletId;
        openWalletDetail(walletId);
      });

      // Keyboard accessibility
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const walletId = card.dataset.walletId;
          openWalletDetail(walletId);
        }
      });
    });
  }

  /**
   * Utility: Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Utility: Debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
