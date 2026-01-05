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
    xSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
  };

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
    apiUrl: '/wp-json/fides/v1',
    pluginUrl: ''
  };

  // State
  let wallets = [];
  let filters = {
    search: '',
    type: [],
    platforms: [],
    credentialFormats: [],
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
   * Load wallets from API or embedded data
   */
  async function loadWallets() {
    try {
      // Try to load from API
      const response = await fetch(`${config.apiUrl}/wallets`);
      if (response.ok) {
        const data = await response.json();
        wallets = data.wallets || [];
      } else {
        // Fallback: try to load from plugin's static data
        const staticResponse = await fetch(`${config.pluginUrl}data/aggregated.json`);
        if (staticResponse.ok) {
          const data = await staticResponse.json();
          wallets = data.wallets || [];
        }
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      // Try static fallback
      try {
        const staticResponse = await fetch(`${config.pluginUrl}data/aggregated.json`);
        if (staticResponse.ok) {
          const data = await staticResponse.json();
          wallets = data.wallets || [];
        }
      } catch (e) {
        console.error('Failed to load static data:', e);
      }
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
    count += filters.platforms.length;
    count += filters.credentialFormats.length;
    if (filters.openSource !== null) count += 1;
    return count;
  }

  /**
   * Render the catalog
   */
  function render() {
    const filtered = getFilteredWallets();
    const activeFilterCount = getActiveFilterCount();
    
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
                  <button class="fides-filter-btn ${filters.type.includes('both') ? 'active' : ''}" data-filter="type" data-value="both">Both</button>
                </div>
              </div>
            ` : ''}
            <div class="fides-filter-group">
              <span class="fides-filter-label">Platform</span>
              <div class="fides-filter-buttons">
                <button class="fides-filter-btn ${filters.platforms.includes('iOS') ? 'active' : ''}" data-filter="platforms" data-value="iOS">iOS</button>
                <button class="fides-filter-btn ${filters.platforms.includes('Android') ? 'active' : ''}" data-filter="platforms" data-value="Android">Android</button>
                <button class="fides-filter-btn ${filters.platforms.includes('Web') ? 'active' : ''}" data-filter="platforms" data-value="Web">Web</button>
                <button class="fides-filter-btn ${filters.platforms.includes('Windows') ? 'active' : ''}" data-filter="platforms" data-value="Windows">Windows</button>
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
  }

  /**
   * Render a single wallet card
   */
  function renderWalletCard(wallet) {
    const typeLabels = {
      personal: 'Personal',
      organizational: 'Organizational',
      both: 'Both'
    };

    return `
      <div class="fides-wallet-card" data-wallet-id="${wallet.id}">
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
              <a href="${escapeHtml(wallet.repository)}" target="_blank" rel="noopener" class="fides-wallet-link">
                ${icons.github} Open Source
              </a>
            ` : ''}
            ${wallet.website ? `
              <a href="${escapeHtml(wallet.website)}" target="_blank" rel="noopener" class="fides-wallet-link">
                ${icons.externalLink} Website
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
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
          platforms: [],
          credentialFormats: [],
          openSource: null
        };
        render();
      });
    }
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
