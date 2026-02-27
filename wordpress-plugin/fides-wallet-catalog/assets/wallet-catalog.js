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
    playStore: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    penLine: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    video: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>'
  };

  // Selected wallet for modal
  let selectedWallet = null;

  // Track which filter groups are expanded (true = expanded, false = collapsed)
  // Default: top filters open, bottom filters collapsed
  const filterGroupState = {
    type: true,
    availability: true,
    provider: true,
    platform: true,
    country: false,
    capabilities: true,
    interop: false,
    credentialFormats: false,
    issuanceProtocols: false,
    presentationProtocols: false,
    supportedIdentifiers: false,
    keyStorage: false,
    signingAlgorithms: false,
    credentialStatusMethods: false,
    license: false
  };

  // Credential format sort order (consistent ordering)
  const CREDENTIAL_FORMAT_ORDER = [
    'SD-JWT-VC',
    'SD-JWT',
    'mDL/mDoc',
    'JWT-VC',
    'JSON-LD VC',
    'AnonCreds',
    'Apple Wallet Pass',
    'Google Wallet Pass',
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

  // Map page URL for "Show on map" link (configurable via WordPress)
  const MAP_PAGE_URL = (window.fidesWalletCatalog && window.fidesWalletCatalog.mapPageUrl)
    || 'https://fides.community/community-tools/map/';

  // Vocabulary for [i] info popups (loaded from interop-profiles)
  let vocabulary = null;

  // Map data-filter-group to vocabulary key
  const WALLET_FILTER_TO_VOCAB = {
    type: 'type',
    availability: 'availability',
    provider: 'provider',
    platform: 'platform',
    capabilities: 'capabilities',
    countries: 'country',
    interop: 'interopProfile',
    credentialFormats: 'credentialFormat',
    issuanceProtocols: 'issuanceProtocol',
    presentationProtocols: 'presentationProtocol',
    supportedIdentifiers: 'identifiers',
    keyStorage: 'keyStorage',
    signingAlgorithms: 'signingAlgorithm',
    credentialStatusMethods: 'credentialStatus',
    license: 'license'
  };
  /** Groups that do not show the [i] info button (empty: all groups can show category description from vocabulary) */
  const WALLET_VOCAB_NO_INFO = new Set([]);

  /** Map filter option data-value to vocabulary key (per group) so popup finds descriptions */
  const WALLET_OPTION_TO_VOCAB = {
    issuanceProtocol: {
      'DIDComm Issue Credential v2': 'DIDComm v2',
      'DIDComm Issue Credential v1': 'DIDComm v1'
    },
    presentationProtocol: {
      'DIDComm Present Proof v2': 'DIDComm v2'
    },
    identifiers: {
      'did:web': 'didWeb',
      'did:key': 'didKey',
      'did:jwk': 'didJwk',
      'did:peer': 'didPeer',
      'did:ebsi': 'didEbsi'
    },
    keyStorage: {
      'Secure Enclave (iOS)': 'secureEnclaveIos',
      'StrongBox (Android)': 'strongboxAndroid',
      'Software': 'softwareKeyStorage',
      'HSM': 'hsm',
      'TEE': 'tee'
    },
    signingAlgorithm: {
      'ECDSA ES256': 'ecdsaEs256',
      'ES256': 'ecdsaEs256'
    },
    credentialStatus: {
      'JWT Validity': 'jwtValidity',
      'IETF Token Status List': 'ietfTokenStatusList',
      'PKI Cert Validity': 'pkiCertValidity'
    },
    license: {
      'true': 'openSource',
      'false': 'proprietary'
    }
  };

  // State
  let wallets = [];
  const SORT_PREFERENCE_STORAGE_KEY = 'fidesWalletCatalogSortBy';
  let sortBy = 'lastUpdated';
  let filters = {
    search: '',
    type: [],
    capabilities: [],
    platforms: [],
    countries: [],
    credentialFormats: [],
    issuanceProtocols: [],
    presentationProtocols: [],
    supportedIdentifiers: [],
    keyStorage: [],
    signingAlgorithms: [],
    credentialStatusMethods: [],
    interoperabilityProfiles: [],
    status: [],
    openSource: null,
    governance: null, // 'government' or 'private'
    addedLast30Days: false,
    includesVideo: false
  };

  // Country code to name mapping
  const COUNTRY_NAMES = {
    'AD': 'Andorra', 'AL': 'Albania', 'AT': 'Austria', 'AU': 'Australia',
    'BE': 'Belgium', 'BG': 'Bulgaria', 'BA': 'Bosnia and Herzegovina',
    'CA': 'Canada', 'CH': 'Switzerland', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
    'DE': 'Germany', 'DK': 'Denmark', 'EE': 'Estonia', 'ES': 'Spain',
    'FI': 'Finland', 'FR': 'France', 'GB': 'United Kingdom', 'GR': 'Greece',
    'HR': 'Croatia', 'HU': 'Hungary', 'IE': 'Ireland', 'IL': 'Israel',
    'IN': 'India', 'IS': 'Iceland', 'IT': 'Italy', 'JP': 'Japan', 'KR': 'South Korea',
    'XK': 'Kosovo', 'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg',
    'LV': 'Latvia', 'MC': 'Monaco', 'MD': 'Moldova', 'ME': 'Montenegro',
    'MK': 'North Macedonia', 'MT': 'Malta', 'NL': 'Netherlands', 'NO': 'Norway',
    'NZ': 'New Zealand', 'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania',
    'RS': 'Serbia', 'SE': 'Sweden', 'SG': 'Singapore', 'SI': 'Slovenia',
    'SK': 'Slovakia', 'SM': 'San Marino', 'TR': 'Turkey', 'UA': 'Ukraine',
    'US': 'United States', 'VA': 'Vatican City'
  };

  /**
   * Determine if a wallet is government-backed based on provider/name keywords
   */
  function isGovernmentWallet(wallet) {
    const providerLower = (wallet.provider?.name || '').toLowerCase();
    const nameLower = (wallet.name || '').toLowerCase();
    
    const govKeywords = [
      'government', 'federal', 'ministry', 'state-owned', 'state owned',
      'logius', 'agency', 'national eudi', 'eudi wallet', 'public sector',
      'republic', 'régimen', 'gobierno', 'gouvernement', 'regierung'
    ];
    
    return govKeywords.some(kw => 
      providerLower.includes(kw) || nameLower.includes(kw)
    );
  }

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

    // Restore persisted sort preference (if supported)
    try {
      const savedSort = window.localStorage.getItem(SORT_PREFERENCE_STORAGE_KEY);
      if (savedSort === 'az' || savedSort === 'lastUpdated') {
        sortBy = savedSort;
      }
    } catch (error) {
      // Ignore storage errors (private mode / blocked storage)
    }

    // Load data
    loadWallets();
  }

  /**
   * Parse first available date from candidate fields
   */
  function parseWalletDate(wallet, dateFields) {
    if (!wallet || !Array.isArray(dateFields)) return null;
    for (const field of dateFields) {
      const value = wallet[field];
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  }

  /**
   * Best-effort "added" date for quick filter
   */
  function getWalletAddedDate(wallet) {
    return parseWalletDate(wallet, ['firstSeenAt', 'createdAt', 'addedAt', 'releaseDate']);
  }

  /**
   * Best-effort "updated" date for sorting/stats
   */
  function getWalletUpdatedDate(wallet) {
    return parseWalletDate(wallet, ['updatedAt', 'fetchedAt', 'releaseDate']);
  }

  /**
   * Check if date is within X days from now
   */
  function isWithinLastDays(date, days) {
    if (!date || Number.isNaN(date.getTime())) return false;
    const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);
    return date.getTime() >= threshold;
  }

  /**
   * Format date as relative update text for cards
   */
  function formatUpdatedLabel(date) {
    if (!date || Number.isNaN(date.getTime())) return '';
    return `Updated ${date.toLocaleDateString('en-US')}`;
  }

  /**
   * Whether wallet has a usable video URL
   */
  function hasWalletVideo(wallet) {
    if (!wallet || !wallet.video || typeof wallet.video !== 'string') return false;
    return wallet.video.trim().length > 0;
  }

  /**
   * Get simple KPI metrics for current result set
   */
  function getCatalogMetrics(items) {
    const safeItems = Array.isArray(items) ? items : [];
    let newLast30Days = 0;
    let updatedLast30Days = 0;
    const countries = new Set();

    safeItems.forEach((wallet) => {
      if (isWithinLastDays(getWalletAddedDate(wallet), 30)) {
        newLast30Days += 1;
      }
      if (isWithinLastDays(getWalletUpdatedDate(wallet), 30)) {
        updatedLast30Days += 1;
      }
      if (wallet.provider && wallet.provider.country) {
        countries.add(wallet.provider.country);
      }
    });

    return {
      total: safeItems.length,
      newLast30Days,
      updatedLast30Days,
      countryCount: countries.size
    };
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

    // Load vocabulary for [i] info popups (primary = GitHub, fallback = local assets)
    if (config.vocabularyUrl || config.vocabularyFallbackUrl) {
      vocabulary = await loadVocabulary(config.vocabularyUrl, config.vocabularyFallbackUrl);
    }

    // Read query parameters for filtering
    readQueryParams();
    
    render();
    
    // Check for deep link after render
    checkDeepLink();
  }

  /**
   * Load vocabulary JSON (primary URL first, then fallback when GitHub unreachable)
   */
  async function loadVocabulary(primaryUrl, fallbackUrl) {
    const tryLoad = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data.terms || null;
    };
    if (primaryUrl) {
      try {
        return await tryLoad(primaryUrl);
      } catch (e) {
        console.warn('Vocabulary load failed (primary):', e.message);
      }
    }
    if (fallbackUrl) {
      try {
        const terms = await tryLoad(fallbackUrl);
        if (terms) console.log('Vocabulary loaded from fallback');
        return terms;
      } catch (e) {
        console.warn('Vocabulary load failed (fallback):', e.message);
      }
    }
    return null;
  }

  /**
   * Read and apply query parameters for filtering
   * Supports: ?profile=Profile Name
   */
  function readQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('profile');
    
    if (profileParam && !filters.interoperabilityProfiles.includes(profileParam)) {
      filters.interoperabilityProfiles.push(profileParam);
      // Auto-expand filters to show pre-selection
      document.body.classList.add('filters-visible');
      console.log(`🔗 Profile filter applied: ${profileParam}`);
    }
  }

  /**
   * Check URL for wallet deep link parameter
   * Supports: ?wallet=wallet-id or #wallet-id
   */
  function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const walletId = urlParams.get('wallet') || window.location.hash.replace('#', '');
    
    if (walletId) {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        console.log(`🔗 Deep link found: opening wallet "${wallet.name}"`);
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
          openWalletDetail(walletId);
        }, 150);
      } else {
        console.warn(`Deep link wallet not found: ${walletId}`);
      }
    }
  }

  /**
   * Filter wallets based on current filters
   */
  function getFilteredWallets() {
    const filtered = wallets.filter(wallet => {
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

      // Countries
      if (filters.countries.length > 0) {
        const walletCountry = wallet.provider?.country;
        if (!walletCountry || !filters.countries.includes(walletCountry)) return false;
      }

      // Credential formats
      if (filters.credentialFormats.length > 0) {
        const hasMatch = filters.credentialFormats.some(f => (wallet.credentialFormats || []).includes(f));
        if (!hasMatch) return false;
      }

      // Issuance protocols
      if (filters.issuanceProtocols.length > 0) {
        const walletIssuance = wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || [];
        const hasMatch = filters.issuanceProtocols.some(p => walletIssuance.includes(p));
        if (!hasMatch) return false;
      }

      // Presentation protocols
      if (filters.presentationProtocols.length > 0) {
        const walletPresentation = wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || [];
        const hasMatch = filters.presentationProtocols.some(p => walletPresentation.includes(p));
        if (!hasMatch) return false;
      }

      // Identifiers
      if (filters.supportedIdentifiers.length > 0) {
        const walletIdentifiers = wallet.supportedIdentifiers || wallet.didMethods || [];
        const hasMatch = filters.supportedIdentifiers.some(d => walletIdentifiers.includes(d));
        if (!hasMatch) return false;
      }

      // Key Storage
      if (filters.keyStorage.length > 0) {
        const hasMatch = filters.keyStorage.some(k => (wallet.keyStorage || []).includes(k));
        if (!hasMatch) return false;
      }

      // Signing Algorithms
      if (filters.signingAlgorithms.length > 0) {
        const hasMatch = filters.signingAlgorithms.some(a => (wallet.signingAlgorithms || []).includes(a));
        if (!hasMatch) return false;
      }

      // Credential Status Methods
      if (filters.credentialStatusMethods.length > 0) {
        const hasMatch = filters.credentialStatusMethods.some(s => (wallet.credentialStatusMethods || []).includes(s));
        if (!hasMatch) return false;
      }

      // Interoperability profiles
      if (filters.interoperabilityProfiles.length > 0) {
        const hasMatch = filters.interoperabilityProfiles.some(p => (wallet.interoperabilityProfiles || []).includes(p));
        if (!hasMatch) return false;
      }

      // Status (available = has app store links, development = no links)
      if (filters.status.length > 0) {
        const hasAppLinks = wallet.appStoreLinks && (
          wallet.appStoreLinks.iOS || 
          wallet.appStoreLinks.ios || 
          wallet.appStoreLinks.android || 
          wallet.appStoreLinks.web
        );
        
        const matchesFilter = filters.status.some(f => {
          if (f === 'available') return hasAppLinks;
          if (f === 'development') return !hasAppLinks;
          return false;
        });
        if (!matchesFilter) return false;
      }

      // Open source
      if (filters.openSource !== null) {
        if (wallet.openSource !== filters.openSource) return false;
      }

      // Governance (government vs private)
      if (filters.governance !== null) {
        const isGov = isGovernmentWallet(wallet);
        if (filters.governance === 'government' && !isGov) return false;
        if (filters.governance === 'private' && isGov) return false;
      }

      // Added in last 30 days
      if (filters.addedLast30Days) {
        if (!isWithinLastDays(getWalletAddedDate(wallet), 30)) return false;
      }

      // Includes video
      if (filters.includesVideo) {
        if (!hasWalletVideo(wallet)) return false;
      }

      return true;
    });

    if (sortBy === 'lastUpdated') {
      return filtered.sort((a, b) => {
        const dateA = getWalletUpdatedDate(a);
        const dateB = getWalletUpdatedDate(b);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.name.localeCompare(b.name);
      });
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Count active filters
   */
  function getActiveFilterCount() {
    let count = 0;
    if (!settings.type) count += filters.type.length;
    count += filters.capabilities.length;
    count += filters.platforms.length;
    count += filters.countries.length;
    count += filters.credentialFormats.length;
    count += filters.issuanceProtocols.length;
    count += filters.presentationProtocols.length;
    count += filters.supportedIdentifiers.length;
    count += filters.keyStorage.length;
    count += filters.signingAlgorithms.length;
    count += filters.credentialStatusMethods.length;
    count += filters.interoperabilityProfiles.length;
    count += filters.status.length;
    if (filters.openSource !== null) count += 1;
    if (filters.governance !== null) count += 1;
    if (filters.addedLast30Days) count += 1;
    if (filters.includesVideo) count += 1;
    return count;
  }

  /**
   * Get unique countries from all wallets
   */
  function getAvailableCountries() {
    const countries = new Set();
    wallets.forEach(wallet => {
      if (wallet.provider?.country) {
        countries.add(wallet.provider.country);
      }
    });
    return Array.from(countries).sort((a, b) => {
      const nameA = COUNTRY_NAMES[a] || a;
      const nameB = COUNTRY_NAMES[b] || b;
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Get unique signing algorithms from all wallets
   */
  function getAvailableSigningAlgorithms() {
    const algorithms = new Set();
    wallets.forEach(wallet => {
      (wallet.signingAlgorithms || []).forEach(a => algorithms.add(a));
    });
    return Array.from(algorithms).sort();
  }

  /**
   * Get unique credential status methods from all wallets
   */
  function getAvailableCredentialStatusMethods() {
    const methods = new Set();
    wallets.forEach(wallet => {
      (wallet.credentialStatusMethods || []).forEach(m => methods.add(m));
    });
    return Array.from(methods).sort();
  }

  /**
   * Render the catalog
   */
  function render() {
    const filtered = getFilteredWallets();
    const metrics = getCatalogMetrics(filtered);
    const activeFilterCount = getActiveFilterCount();
    
    // Save focus state before re-rendering
    const searchInput = document.getElementById('fides-search');
    const wasSearchFocused = searchInput && document.activeElement === searchInput;
    const cursorPosition = wasSearchFocused ? searchInput.selectionStart : 0;
    
    let html = '';

    // Main layout with sidebar
    html += `<div class="fides-main-layout">`;

    // Sidebar with search and filters
    if (settings.showFilters) {
      html += `
        <aside class="fides-sidebar">
          <div class="fides-sidebar-header">
            <div class="fides-sidebar-title">
              ${icons.filter}
              <span>Filters</span>
              <span class="fides-filter-count ${activeFilterCount > 0 ? '' : 'hidden'}">${activeFilterCount || 0}</span>
            </div>
            <div class="fides-sidebar-actions">
              <button class="fides-clear-all ${activeFilterCount > 0 ? '' : 'hidden'}" id="fides-clear">
                ${icons.x} Clear
              </button>
              <button class="fides-sidebar-close" id="fides-sidebar-close" aria-label="Close filters">
                ${icons.xLarge}
              </button>
            </div>
          </div>
          <div class="fides-sidebar-content">
            ${settings.showSearch ? `
              <div class="fides-sidebar-search">
                <div class="fides-search-wrapper">
                  <span class="fides-search-icon">${icons.search}</span>
                  <input 
                    type="text" 
                    class="fides-search-input" 
                    placeholder="Search..."
                    value="${escapeHtml(filters.search)}"
                    id="fides-search"
                  >
                  <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-search-clear" type="button">
                    ${icons.xSmall}
                  </button>
                </div>
              </div>
            ` : ''}
            <div class="fides-quick-filters">
              <span class="fides-quick-filters-title">Quick filters</span>
              <label class="fides-filter-checkbox">
                <input type="checkbox" data-filter="addedLast30Days" data-value="true" ${filters.addedLast30Days ? 'checked' : ''}>
                <span>Added last 30 days</span>
              </label>
              <label class="fides-filter-checkbox">
                <input type="checkbox" data-filter="includesVideo" data-value="true" ${filters.includesVideo ? 'checked' : ''}>
                <span>Includes video</span>
              </label>
            </div>
            ${!settings.type ? `
              <div class="fides-filter-group collapsible ${!filterGroupState.type ? 'collapsed' : ''} ${filters.type.length > 0 ? 'has-active' : ''}" data-filter-group="type">
                <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.type}">
                  <span class="fides-filter-label">Type</span>
                  <span class="fides-filter-active-indicator"></span>
                  ${icons.chevronDown}
                </button>
                <div class="fides-filter-options">
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="type" data-value="personal" ${filters.type.includes('personal') ? 'checked' : ''}>
                    <span>Personal</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="type" data-value="organizational" ${filters.type.includes('organizational') ? 'checked' : ''}>
                    <span>Organizational</span>
                  </label>
                </div>
              </div>
            ` : ''}
            ${filters.type.includes('personal') || settings.type === 'personal' || (!filters.type.includes('organizational') && settings.type !== 'organizational') ? `
              <div class="fides-filter-group collapsible ${!filterGroupState.availability ? 'collapsed' : ''} ${filters.status.length > 0 ? 'has-active' : ''}" data-filter-group="availability">
                <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.availability}">
                  <span class="fides-filter-label">Availability</span>
                  <span class="fides-filter-active-indicator"></span>
                  ${icons.chevronDown}
                </button>
                <div class="fides-filter-options">
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="status" data-value="available" ${filters.status.includes('available') ? 'checked' : ''}>
                    <span>Publicly available</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="status" data-value="development" ${filters.status.includes('development') ? 'checked' : ''}>
                    <span>Not publicly available</span>
                  </label>
                </div>
              </div>
              <div class="fides-filter-group collapsible ${!filterGroupState.provider ? 'collapsed' : ''} ${filters.governance !== null ? 'has-active' : ''}" data-filter-group="provider">
                <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.provider}">
                  <span class="fides-filter-label">Provider</span>
                  <span class="fides-filter-active-indicator"></span>
                  ${icons.chevronDown}
                </button>
                <div class="fides-filter-options">
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="governance" data-value="government" ${filters.governance === 'government' ? 'checked' : ''}>
                    <span>Government</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="governance" data-value="private" ${filters.governance === 'private' ? 'checked' : ''}>
                    <span>Non-government</span>
                  </label>
                </div>
              </div>
              <div class="fides-filter-group collapsible ${!filterGroupState.platform ? 'collapsed' : ''} ${filters.platforms.length > 0 ? 'has-active' : ''}" data-filter-group="platform">
                <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.platform}">
                  <span class="fides-filter-label">Platform</span>
                  <span class="fides-filter-active-indicator"></span>
                  ${icons.chevronDown}
                </button>
                <div class="fides-filter-options">
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="platforms" data-value="iOS" ${filters.platforms.includes('iOS') ? 'checked' : ''}>
                    <span>iOS</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="platforms" data-value="Android" ${filters.platforms.includes('Android') ? 'checked' : ''}>
                    <span>Android</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="platforms" data-value="Web" ${filters.platforms.includes('Web') ? 'checked' : ''}>
                    <span>Web</span>
                  </label>
                </div>
              </div>
            ` : ''}
            ${filters.type.includes('organizational') || settings.type === 'organizational' ? `
              <div class="fides-filter-group collapsible ${!filterGroupState.capabilities ? 'collapsed' : ''} ${filters.capabilities.length > 0 ? 'has-active' : ''}" data-filter-group="capabilities">
                <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.capabilities}">
                  <span class="fides-filter-label">Capabilities</span>
                  <span class="fides-filter-active-indicator"></span>
                  ${icons.chevronDown}
                </button>
                <div class="fides-filter-options">
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="capabilities" data-value="holder" ${filters.capabilities.includes('holder') ? 'checked' : ''}>
                    <span>Holder</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="capabilities" data-value="issuer" ${filters.capabilities.includes('issuer') ? 'checked' : ''}>
                    <span>Issuer</span>
                  </label>
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="capabilities" data-value="verifier" ${filters.capabilities.includes('verifier') ? 'checked' : ''}>
                    <span>Verifier</span>
                  </label>
                </div>
              </div>
            ` : ''}
            <div class="fides-filter-group collapsible ${!filterGroupState.country ? 'collapsed' : ''} ${filters.countries.length > 0 ? 'has-active' : ''}" data-filter-group="country">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.country}">
                <span class="fides-filter-label">Country</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options fides-filter-options-scrollable">
                ${getAvailableCountries().map(code => `
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="countries" data-value="${code}" ${filters.countries.includes(code) ? 'checked' : ''}>
                    <span><img src="https://flagcdn.com/w20/${code.toLowerCase()}.png" alt="" class="fides-country-flag"> ${COUNTRY_NAMES[code] || code}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.interop ? 'collapsed' : ''} ${filters.interoperabilityProfiles.length > 0 ? 'has-active' : ''}" data-filter-group="interop">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.interop}">
                <span class="fides-filter-label">Interop Profile</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="interoperabilityProfiles" data-value="EUDI Wallet ARF" ${filters.interoperabilityProfiles.includes('EUDI Wallet ARF') ? 'checked' : ''}>
                  <span>EUDI Wallet ARF</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="interoperabilityProfiles" data-value="DIIP v4" ${filters.interoperabilityProfiles.includes('DIIP v4') ? 'checked' : ''}>
                  <span>DIIP v4</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="interoperabilityProfiles" data-value="DIIP v5" ${filters.interoperabilityProfiles.includes('DIIP v5') ? 'checked' : ''}>
                  <span>DIIP v5</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="interoperabilityProfiles" data-value="EWC v3" ${filters.interoperabilityProfiles.includes('EWC v3') ? 'checked' : ''}>
                  <span>EWC v3</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="interoperabilityProfiles" data-value="HAIP v1" ${filters.interoperabilityProfiles.includes('HAIP v1') ? 'checked' : ''}>
                  <span>HAIP v1</span>
                </label>
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.credentialFormats ? 'collapsed' : ''} ${filters.credentialFormats.length > 0 ? 'has-active' : ''}" data-filter-group="credentialFormats">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.credentialFormats}">
                <span class="fides-filter-label">Credential Format</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="SD-JWT-VC" ${filters.credentialFormats.includes('SD-JWT-VC') ? 'checked' : ''}>
                  <span>SD-JWT-VC</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="mDL/mDoc" ${filters.credentialFormats.includes('mDL/mDoc') ? 'checked' : ''}>
                  <span>mDL/mDoc</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="JWT-VC" ${filters.credentialFormats.includes('JWT-VC') ? 'checked' : ''}>
                  <span>JWT-VC</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="AnonCreds" ${filters.credentialFormats.includes('AnonCreds') ? 'checked' : ''}>
                  <span>AnonCreds</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="JSON-LD VC" ${filters.credentialFormats.includes('JSON-LD VC') ? 'checked' : ''}>
                  <span>JSON-LD VC</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="Apple Wallet Pass" ${filters.credentialFormats.includes('Apple Wallet Pass') ? 'checked' : ''}>
                  <span>Apple Wallet Pass</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="credentialFormats" data-value="Google Wallet Pass" ${filters.credentialFormats.includes('Google Wallet Pass') ? 'checked' : ''}>
                  <span>Google Wallet Pass</span>
                </label>
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.issuanceProtocols ? 'collapsed' : ''} ${filters.issuanceProtocols.length > 0 ? 'has-active' : ''}" data-filter-group="issuanceProtocols">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.issuanceProtocols}">
                <span class="fides-filter-label">Issuance Protocol</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="issuanceProtocols" data-value="OpenID4VCI" ${filters.issuanceProtocols.includes('OpenID4VCI') ? 'checked' : ''}>
                  <span>OpenID4VCI</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="issuanceProtocols" data-value="DIDComm Issue Credential v2" ${filters.issuanceProtocols.includes('DIDComm Issue Credential v2') ? 'checked' : ''}>
                  <span>DIDComm v2</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="issuanceProtocols" data-value="DIDComm Issue Credential v1" ${filters.issuanceProtocols.includes('DIDComm Issue Credential v1') ? 'checked' : ''}>
                  <span>DIDComm v1</span>
                </label>
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.presentationProtocols ? 'collapsed' : ''} ${filters.presentationProtocols.length > 0 ? 'has-active' : ''}" data-filter-group="presentationProtocols">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.presentationProtocols}">
                <span class="fides-filter-label">Presentation Protocol</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="presentationProtocols" data-value="OpenID4VP" ${filters.presentationProtocols.includes('OpenID4VP') ? 'checked' : ''}>
                  <span>OpenID4VP</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="presentationProtocols" data-value="SIOPv2" ${filters.presentationProtocols.includes('SIOPv2') ? 'checked' : ''}>
                  <span>SIOPv2</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="presentationProtocols" data-value="DIDComm Present Proof v2" ${filters.presentationProtocols.includes('DIDComm Present Proof v2') ? 'checked' : ''}>
                  <span>DIDComm v2</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="presentationProtocols" data-value="ISO 18013-5" ${filters.presentationProtocols.includes('ISO 18013-5') ? 'checked' : ''}>
                  <span>ISO 18013-5</span>
                </label>
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.supportedIdentifiers ? 'collapsed' : ''} ${filters.supportedIdentifiers.length > 0 ? 'has-active' : ''}" data-filter-group="supportedIdentifiers">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.supportedIdentifiers}">
                <span class="fides-filter-label">Identifiers</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="supportedIdentifiers" data-value="did:web" ${filters.supportedIdentifiers.includes('did:web') ? 'checked' : ''}>
                  <span>did:web</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="supportedIdentifiers" data-value="did:key" ${filters.supportedIdentifiers.includes('did:key') ? 'checked' : ''}>
                  <span>did:key</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="supportedIdentifiers" data-value="did:jwk" ${filters.supportedIdentifiers.includes('did:jwk') ? 'checked' : ''}>
                  <span>did:jwk</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="supportedIdentifiers" data-value="did:peer" ${filters.supportedIdentifiers.includes('did:peer') ? 'checked' : ''}>
                  <span>did:peer</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="supportedIdentifiers" data-value="did:ebsi" ${filters.supportedIdentifiers.includes('did:ebsi') ? 'checked' : ''}>
                  <span>did:ebsi</span>
                </label>
              </div>
            </div>
            <div class="fides-filter-group collapsible ${!filterGroupState.keyStorage ? 'collapsed' : ''} ${filters.keyStorage.length > 0 ? 'has-active' : ''}" data-filter-group="keyStorage">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.keyStorage}">
                <span class="fides-filter-label">Key Storage</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="keyStorage" data-value="Secure Enclave (iOS)" ${filters.keyStorage.includes('Secure Enclave (iOS)') ? 'checked' : ''}>
                  <span>Secure Enclave (iOS)</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="keyStorage" data-value="StrongBox (Android)" ${filters.keyStorage.includes('StrongBox (Android)') ? 'checked' : ''}>
                  <span>StrongBox (Android)</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="keyStorage" data-value="Software" ${filters.keyStorage.includes('Software') ? 'checked' : ''}>
                  <span>Software</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="keyStorage" data-value="HSM" ${filters.keyStorage.includes('HSM') ? 'checked' : ''}>
                  <span>HSM</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="keyStorage" data-value="TEE" ${filters.keyStorage.includes('TEE') ? 'checked' : ''}>
                  <span>TEE</span>
                </label>
              </div>
            </div>
            ${getAvailableSigningAlgorithms().length > 0 ? `
            <div class="fides-filter-group collapsible ${!filterGroupState.signingAlgorithms ? 'collapsed' : ''} ${filters.signingAlgorithms.length > 0 ? 'has-active' : ''}" data-filter-group="signingAlgorithms">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.signingAlgorithms}">
                <span class="fides-filter-label">Signing Algorithm</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                ${getAvailableSigningAlgorithms().map(alg => `
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="signingAlgorithms" data-value="${alg}" ${filters.signingAlgorithms.includes(alg) ? 'checked' : ''}>
                    <span>${escapeHtml(alg)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            ` : ''}
            ${getAvailableCredentialStatusMethods().length > 0 ? `
            <div class="fides-filter-group collapsible ${!filterGroupState.credentialStatusMethods ? 'collapsed' : ''} ${filters.credentialStatusMethods.length > 0 ? 'has-active' : ''}" data-filter-group="credentialStatusMethods">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.credentialStatusMethods}">
                <span class="fides-filter-label">Credential Status</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                ${getAvailableCredentialStatusMethods().map(method => `
                  <label class="fides-filter-checkbox">
                    <input type="checkbox" data-filter="credentialStatusMethods" data-value="${method}" ${filters.credentialStatusMethods.includes(method) ? 'checked' : ''}>
                    <span>${escapeHtml(method)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            ` : ''}
            <div class="fides-filter-group collapsible ${!filterGroupState.license ? 'collapsed' : ''} ${filters.openSource !== null ? 'has-active' : ''}" data-filter-group="license">
              <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.license}">
                <span class="fides-filter-label">License</span>
                <span class="fides-filter-active-indicator"></span>
                ${icons.chevronDown}
              </button>
              <div class="fides-filter-options">
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="openSource" data-value="true" ${filters.openSource === true ? 'checked' : ''}>
                  <span>Open Source</span>
                </label>
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter="openSource" data-value="false" ${filters.openSource === false ? 'checked' : ''}>
                  <span>Proprietary</span>
                </label>
              </div>
            </div>
          </div>
        </aside>
      `;
    }

    // Main content area
    html += `<main class="fides-content">`;

    // Mobile search bar (visible only on mobile)
    if (settings.showSearch) {
      html += `
        <div class="fides-mobile-search">
          <div class="fides-search-wrapper">
            <span class="fides-search-icon">${icons.search}</span>
            <input 
              type="text" 
              class="fides-search-input fides-mobile-search-input" 
              placeholder="Search..."
              value="${escapeHtml(filters.search)}"
              id="fides-mobile-search"
            >
            <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-mobile-search-clear" type="button">
              ${icons.xSmall}
            </button>
          </div>
        </div>
      `;
    }

    // Results count + link to map
    html += `
      <div class="fides-results-bar">
        <div class="fides-results-controls">
          <label class="fides-sort-wrap">
            <span class="fides-sort-label">Sort by:</span>
            <select id="fides-sort-select" class="fides-sort-select">
              <option value="lastUpdated" ${sortBy === 'lastUpdated' ? 'selected' : ''}>Last updated</option>
              <option value="az" ${sortBy === 'az' ? 'selected' : ''}>A-Z</option>
            </select>
          </label>
        </div>
        <a href="${MAP_PAGE_URL}" class="fides-show-on-map" target="_blank" rel="noopener" aria-label="Show on map (opens in new tab)">${icons.externalLink} Show on map</a>
        <!-- Mobile filter toggle -->
        ${settings.showFilters ? `
          <button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">
            ${icons.filter}
            <span>Filters</span>
            <span class="fides-filter-count ${activeFilterCount > 0 ? '' : 'hidden'}">${activeFilterCount || 0}</span>
          </button>
        ` : ''}
      </div>
    `;
    html += `
      <div class="fides-kpi-row">
        <button class="fides-kpi-card" type="button" data-kpi-action="clear-added-filter">
          <span class="fides-kpi-value">${metrics.total}</span>
          <span class="fides-kpi-label">Wallets</span>
        </button>
        <button class="fides-kpi-card ${filters.addedLast30Days ? 'active' : ''}" type="button" data-kpi-action="toggle-added-filter">
          <span class="fides-kpi-value">${metrics.newLast30Days}</span>
          <span class="fides-kpi-label">New<span class="fides-kpi-label-extra"> last 30 days</span></span>
        </button>
        <button class="fides-kpi-card" type="button" data-kpi-action="set-last-updated-sort">
          <span class="fides-kpi-value">${metrics.updatedLast30Days}</span>
          <span class="fides-kpi-label">Updated<span class="fides-kpi-label-extra"> last 30 days</span></span>
        </button>
        <button class="fides-kpi-card ${filters.countries.length > 0 ? 'active' : ''}" type="button" data-kpi-action="clear-country-filter">
          <span class="fides-kpi-value">${metrics.countryCount}</span>
          <span class="fides-kpi-label">Countries</span>
        </button>
      </div>
    `;

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

    html += `</main>`; // Close fides-content
    html += `</div>`; // Close fides-main-layout

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
   * Update only the wallet grid and results count (for search without losing focus)
   * This avoids re-rendering the search input which causes keyboard to close on mobile
   */
  function renderWalletGridOnly() {
    const filtered = getFilteredWallets();
    const metrics = getCatalogMetrics(filtered);
    
    const kpiTotal = container.querySelector('.fides-kpi-card[data-kpi-action="clear-added-filter"] .fides-kpi-value');
    const kpiNew = container.querySelector('.fides-kpi-card[data-kpi-action="toggle-added-filter"] .fides-kpi-value');
    const kpiUpdated = container.querySelector('.fides-kpi-card[data-kpi-action="set-last-updated-sort"] .fides-kpi-value');
    const kpiCountries = container.querySelector('.fides-kpi-card[data-kpi-action="clear-country-filter"] .fides-kpi-value');
    const kpiAddedCard = container.querySelector('.fides-kpi-card[data-kpi-action="toggle-added-filter"]');
    const kpiCountryCard = container.querySelector('.fides-kpi-card[data-kpi-action="clear-country-filter"]');
    if (kpiTotal) kpiTotal.textContent = String(metrics.total);
    if (kpiNew) kpiNew.textContent = String(metrics.newLast30Days);
    if (kpiUpdated) kpiUpdated.textContent = String(metrics.updatedLast30Days);
    if (kpiCountries) kpiCountries.textContent = String(metrics.countryCount);
    if (kpiAddedCard) kpiAddedCard.classList.toggle('active', filters.addedLast30Days);
    if (kpiCountryCard) kpiCountryCard.classList.toggle('active', filters.countries.length > 0);
    
    // Update search clear button visibility
    const searchClear = document.getElementById('fides-search-clear');
    const mobileSearchClear = document.getElementById('fides-mobile-search-clear');
    if (searchClear) {
      searchClear.classList.toggle('hidden', !filters.search);
    }
    if (mobileSearchClear) {
      mobileSearchClear.classList.toggle('hidden', !filters.search);
    }
    
    // Update wallet grid
    const gridContainer = container.querySelector('.fides-wallet-grid');
    const emptyContainer = container.querySelector('.fides-empty');
    const contentArea = container.querySelector('.fides-content');
    
    if (filtered.length > 0) {
      // Remove empty state if present
      if (emptyContainer) {
        emptyContainer.remove();
      }
      
      // Create or update grid
      let grid = gridContainer;
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'fides-wallet-grid';
        grid.setAttribute('data-columns', settings.columns);
        // Insert after results bar
        const resultsBar = contentArea.querySelector('.fides-results-bar');
        if (resultsBar) {
          resultsBar.after(grid);
        } else {
          contentArea.appendChild(grid);
        }
      }
      
      // Render wallet cards
      let html = '';
      filtered.forEach(wallet => {
        html += renderWalletCard(wallet);
      });
      grid.innerHTML = html;
      
      // Attach wallet card click listeners
      attachWalletCardListeners();
    } else {
      // Remove grid if present
      if (gridContainer) {
        gridContainer.remove();
      }
      
      // Show empty state if not present
      if (!emptyContainer) {
        const empty = document.createElement('div');
        empty.className = 'fides-empty';
        empty.innerHTML = `
          <div class="fides-empty-icon">${icons.wallet}</div>
          <h3 class="fides-empty-title">No wallets found</h3>
          <p class="fides-empty-text">Adjust your filters or try a different search query.</p>
        `;
        contentArea.appendChild(empty);
      }
    }
  }

  /**
   * Attach click listeners to wallet cards (for use after grid-only updates)
   */
  function attachWalletCardListeners() {
    const walletCards = container.querySelectorAll('.fides-wallet-card');
    walletCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        openWalletDetail(card.dataset.walletId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openWalletDetail(card.dataset.walletId);
        }
      });
    });
  }

  /**
   * Strip parenthetical text from wallet name for card display
   */
  function getDisplayName(name) {
    return name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  }

  /**
   * Render a single wallet card
   */
  function renderWalletCard(wallet) {
    const capabilityLabels = {
      holder: 'Holder',
      issuer: 'Issuer',
      verifier: 'Verifier'
    };

    const displayName = getDisplayName(wallet.name);
    const addedDate = getWalletAddedDate(wallet);
    const updatedDate = getWalletUpdatedDate(wallet);
    const isNewWallet = isWithinLastDays(addedDate, 30);
    const activityLabel = isNewWallet && addedDate
      ? `Added ${addedDate.toLocaleDateString('en-US')}`
      : formatUpdatedLabel(updatedDate);

    return `
      <div class="fides-wallet-card" data-wallet-id="${wallet.id}" role="button" tabindex="0">
        <div class="fides-wallet-header type-${wallet.type}">
          ${wallet.logo 
            ? `<img src="${escapeHtml(wallet.logo)}" alt="${escapeHtml(wallet.name)}" class="fides-wallet-logo">`
            : `<div class="fides-wallet-logo-placeholder">${icons.wallet}</div>`
          }
          <div class="fides-wallet-info">
            <h3 class="fides-wallet-name">${escapeHtml(displayName)}</h3>
            <p class="fides-wallet-provider">${escapeHtml(wallet.provider.name)}</p>
          </div>
        </div>
        <div class="fides-wallet-body">
          ${activityLabel ? `<p class="fides-wallet-updated">${escapeHtml(activityLabel)}</p>` : ''}
          ${wallet.description ? `<p class="fides-wallet-description">${escapeHtml(wallet.description)}</p>` : ''}
          
          ${wallet.type === 'organizational' && wallet.capabilities && wallet.capabilities.length > 0 ? `
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
              ${wallet.platforms
                .filter(p => !(wallet.type === 'organizational' && p === 'Web'))
                .map(p => renderPlatformTag(wallet, p)).join('')}
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
            ${wallet.openSource ? (wallet.repository ? `
              <a href="${escapeHtml(wallet.repository)}" target="_blank" rel="noopener" class="fides-wallet-link" onclick="event.stopPropagation();">
                ${icons.github} Open Source
              </a>
            ` : `<span class="fides-wallet-link">${icons.github} Open Source</span>`) : ''}
          </div>
          <span class="fides-view-details">${icons.eye} View details</span>
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
            <div class="fides-modal-header-actions">
              <button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link to this wallet" title="Copy link to this wallet">
                ${icons.share}
              </button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">
                ${icons.xLarge}
              </button>
            </div>
          </div>
          
          <div class="fides-modal-body">
            <!-- Type, Status & License badges -->
            <div class="fides-modal-badges">
              <span class="fides-modal-badge type-${wallet.type}">
                ${typeLabels[wallet.type]}
              </span>
              ${wallet.type === 'organizational' && wallet.capabilities && wallet.capabilities.length > 0 ? wallet.capabilities.map(c => `
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

            <!-- Video embed (if available) -->
            ${wallet.video ? getVideoEmbedHtml(wallet.video) : ''}

            <!-- Quick info grid -->
            <div class="fides-modal-grid">
              <!-- Platforms (with app store links) -->
              ${wallet.platforms && wallet.platforms.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.smartphone} Platforms ${wallet.type !== 'organizational' ? '<span class="fides-label-hint">(click to access)</span>' : ''}
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

              <!-- Identifiers -->
              ${(wallet.supportedIdentifiers || wallet.didMethods) && (wallet.supportedIdentifiers || wallet.didMethods).length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.key} Identifiers
                  </div>
                  <div class="fides-modal-grid-value">
                    ${(wallet.supportedIdentifiers || wallet.didMethods).map(d => `<span class="fides-tag did-method">${escapeHtml(d)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Key Storage -->
              ${wallet.keyStorage && wallet.keyStorage.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.key} Key Storage
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.keyStorage.map(k => `<span class="fides-tag">${escapeHtml(k)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Signing Algorithms -->
              ${wallet.signingAlgorithms && wallet.signingAlgorithms.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.penLine} Signing Algorithms
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.signingAlgorithms.map(a => `<span class="fides-tag">${escapeHtml(a)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Credential Status Methods -->
              ${wallet.credentialStatusMethods && wallet.credentialStatusMethods.length > 0 ? `
                <div class="fides-modal-grid-item">
                  <div class="fides-modal-grid-label">
                    ${icons.shield} Credential Status
                  </div>
                  <div class="fides-modal-grid-value">
                    ${wallet.credentialStatusMethods.map(m => `<span class="fides-tag">${escapeHtml(m)}</span>`).join('')}
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
   * Show toast notification
   */
  function showToast(message, type = 'success') {
    // Get theme from container
    const containerTheme = container ? container.getAttribute('data-theme') : 'dark';
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fides-toast';
    toast.setAttribute('data-theme', containerTheme);
    
    // Add icon
    const iconEl = document.createElement('div');
    iconEl.className = 'fides-toast-icon';
    iconEl.innerHTML = type === 'success' ? icons.check : icons.x;
    
    // Add message
    const messageEl = document.createElement('div');
    messageEl.className = 'fides-toast-message';
    messageEl.textContent = message;
    
    toast.appendChild(iconEl);
    toast.appendChild(messageEl);
    
    // Add to body
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('fides-toast-out');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Get the direct link URL for the currently selected wallet (opens in modal when visited)
   */
  function getWalletDirectLink() {
    if (!selectedWallet) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('wallet', selectedWallet.id);
    return url.toString();
  }

  /**
   * Copy wallet direct link to clipboard and show feedback
   */
  function copyWalletLink() {
    const url = getWalletDirectLink();
    if (!url) return;
    const btn = document.getElementById('fides-modal-copy-link');
    const originalTitle = btn ? btn.getAttribute('title') : '';
    const originalAriaLabel = btn ? btn.getAttribute('aria-label') : '';
    
    const showSuccess = () => {
      if (btn) {
        btn.setAttribute('title', 'Link copied!');
        btn.setAttribute('aria-label', 'Link copied!');
        btn.classList.add('copied');
      }
      showToast('Link copied to clipboard', 'success');
      setTimeout(() => {
        if (btn) {
          btn.setAttribute('title', originalTitle);
          btn.setAttribute('aria-label', originalAriaLabel);
          btn.classList.remove('copied');
        }
      }, 2000);
    };
    
    const showError = () => {
      if (btn) {
        btn.setAttribute('title', 'Copy failed');
        setTimeout(() => {
          if (btn) {
            btn.setAttribute('title', originalTitle);
            btn.setAttribute('aria-label', originalAriaLabel);
          }
        }, 2000);
      }
      showToast('Failed to copy link', 'error');
    };
    
    // Try modern clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showSuccess).catch(showError);
    } else {
      // Fallback for HTTP or older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.top = '0';
        textarea.style.left = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          showSuccess();
        } else {
          showError();
        }
      } catch (err) {
        showError();
      }
    }
  }

  /**
   * Attach modal event listeners
   */
  function attachModalListeners() {
    const overlay = document.getElementById('fides-modal-overlay');
    const closeBtn = document.getElementById('fides-modal-close');
    const copyLinkBtn = document.getElementById('fides-modal-copy-link');
    const modal = overlay.querySelector('.fides-modal');

    // Copy link button
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyWalletLink();
      });
    }

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
      if (window.FidesCatalogUI && typeof window.FidesCatalogUI.openWalletModal === 'function') {
        window.FidesCatalogUI.openWalletModal(wallet, {
          theme: container ? (container.getAttribute('data-theme') || 'dark') : 'dark',
          onOpen: function(openedWallet) {
            trackMatomoEvent('Wallet Catalog', 'Modal Open', openedWallet.name);
          }
        });
        return;
      }
      selectedWallet = wallet;
      
      // Track modal open in Matomo
      trackMatomoEvent('Wallet Catalog', 'Modal Open', wallet.name);
      
      renderModal(wallet);
    }
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Search inputs (sidebar + mobile)
    const searchInput = document.getElementById('fides-search');
    const mobileSearchInput = document.getElementById('fides-mobile-search');
    
    const handleSearchInput = debounce((e) => {
      filters.search = e.target.value;
      // Use grid-only render to avoid losing focus/keyboard on mobile
      renderWalletGridOnly();
      // Sync the other search input value
      const otherInput = e.target.id === 'fides-search' 
        ? document.getElementById('fides-mobile-search')
        : document.getElementById('fides-search');
      if (otherInput && otherInput.value !== e.target.value) {
        otherInput.value = e.target.value;
      }
    }, 300);

    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
    }
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', handleSearchInput);
    }

    // Search clear buttons
    const searchClear = document.getElementById('fides-search-clear');
    const mobileSearchClear = document.getElementById('fides-mobile-search-clear');
    
    const handleSearchClear = () => {
      filters.search = '';
      // Clear both inputs
      const sidebarInput = document.getElementById('fides-search');
      const mobileInput = document.getElementById('fides-mobile-search');
      if (sidebarInput) sidebarInput.value = '';
      if (mobileInput) mobileInput.value = '';
      // Use grid-only render
      renderWalletGridOnly();
    };

    if (searchClear) {
      searchClear.addEventListener('click', handleSearchClear);
    }
    if (mobileSearchClear) {
      mobileSearchClear.addEventListener('click', handleSearchClear);
    }

    // Mobile filter toggle
    const mobileFilterToggle = document.getElementById('fides-mobile-filter-toggle');
    const sidebar = container.querySelector('.fides-sidebar');
    
    if (mobileFilterToggle) {
      mobileFilterToggle.addEventListener('click', () => {
        if (sidebar) {
          sidebar.classList.add('mobile-open');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    // Close sidebar button
    const sidebarClose = document.getElementById('fides-sidebar-close');
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        if (sidebar) {
          sidebar.classList.remove('mobile-open');
          document.body.style.overflow = '';
        }
      });
    }

    // Close sidebar when clicking overlay (mobile)
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        if (e.target === sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
          document.body.style.overflow = '';
        }
      });
    }

    // Collapsible filter toggles
    container.querySelectorAll('.fides-filter-label-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        if (e.target.closest('.fides-vocab-info')) return;
        const filterGroup = toggle.closest('.fides-filter-group');
        if (filterGroup) {
          const groupName = filterGroup.dataset.filterGroup;
          filterGroup.classList.toggle('collapsed');
          const isExpanded = !filterGroup.classList.contains('collapsed');
          toggle.setAttribute('aria-expanded', isExpanded);
          // Save state
          if (groupName && filterGroupState.hasOwnProperty(groupName)) {
            filterGroupState[groupName] = isExpanded;
          }
        }
      });
    });

    // Vocabulary [i] info buttons
    initVocabularyInfo(container);

    // Filter checkboxes
    container.querySelectorAll('.fides-filter-checkbox input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const filterType = checkbox.dataset.filter;
        const value = checkbox.dataset.value;
        const isChecked = checkbox.checked;
        
        if (filterType === 'addedLast30Days' || filterType === 'includesVideo') {
          filters[filterType] = isChecked;
        }
        // Special handling for openSource (boolean toggle)
        else if (filterType === 'openSource') {
          const boolValue = value === 'true';
          filters.openSource = isChecked ? boolValue : null;
        } 
        // Special handling for governance (string toggle)
        else if (filterType === 'governance') {
          filters.governance = isChecked ? value : null;
        }
        else {
          // Array-based filters
          if (isChecked) {
            if (!filters[filterType].includes(value)) {
              filters[filterType].push(value);
            }
          } else {
            filters[filterType] = filters[filterType].filter(v => v !== value);
          }
        }
        
        render();
      });
    });

    const sortSelect = document.getElementById('fides-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const nextSort = sortSelect.value === 'az' ? 'az' : 'lastUpdated';
        sortBy = nextSort;
        try {
          window.localStorage.setItem(SORT_PREFERENCE_STORAGE_KEY, sortBy);
        } catch (error) {
          // Ignore storage errors
        }
        render();
      });
    }

    container.querySelectorAll('.fides-kpi-card').forEach((kpiCard) => {
      kpiCard.addEventListener('click', () => {
        const action = kpiCard.dataset.kpiAction;
        if (action === 'toggle-added-filter') {
          filters.addedLast30Days = !filters.addedLast30Days;
          render();
          return;
        }
        if (action === 'set-last-updated-sort') {
          sortBy = 'lastUpdated';
          try {
            window.localStorage.setItem(SORT_PREFERENCE_STORAGE_KEY, sortBy);
          } catch (error) {
            // Ignore storage errors
          }
          render();
          return;
        }
        if (action === 'clear-country-filter') {
          if (filters.countries.length > 0) {
            filters.countries = [];
            render();
          }
          return;
        }
        if (action === 'clear-added-filter') {
          if (filters.addedLast30Days) {
            filters.addedLast30Days = false;
            render();
          }
          return;
        }
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
          countries: [],
          credentialFormats: [],
          issuanceProtocols: [],
          presentationProtocols: [],
          supportedIdentifiers: [],
          keyStorage: [],
          signingAlgorithms: [],
          credentialStatusMethods: [],
          interoperabilityProfiles: [],
          status: [],
          openSource: null,
          governance: null,
          addedLast30Days: false,
          includesVideo: false
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
   * Initialize [i] vocabulary info buttons on filter groups; show popup with group + option descriptions
   */
  function initVocabularyInfo(containerEl) {
    if (!vocabulary) return;
    hideVocabularyPopup();
    containerEl.querySelectorAll('.fides-vocab-info').forEach(btn => btn.remove());
    containerEl.querySelectorAll('.fides-filter-group').forEach(groupEl => {
      const toggle = groupEl.querySelector('.fides-filter-label-toggle');
      const labelSpan = toggle && toggle.querySelector('.fides-filter-label');
      if (!toggle || !labelSpan) return;
      const filterGroup = groupEl.dataset.filterGroup;
      const vocabKey = WALLET_FILTER_TO_VOCAB[filterGroup] || filterGroup;
      if (WALLET_VOCAB_NO_INFO.has(vocabKey)) return;
      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'fides-vocab-info';
      infoBtn.dataset.group = vocabKey;
      infoBtn.setAttribute('aria-label', 'Explain filter');
      infoBtn.textContent = 'i';
      infoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showVocabularyPopup(e.currentTarget, groupEl, vocabKey);
      });
      const parent = labelSpan.parentNode;
      if (parent.classList && parent.classList.contains('fides-filter-label-with-info')) {
        parent.appendChild(infoBtn);
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'fides-filter-label-with-info';
      parent.insertBefore(wrapper, labelSpan);
      wrapper.appendChild(labelSpan);
      wrapper.appendChild(infoBtn);
      const spacer = document.createElement('span');
      spacer.className = 'fides-filter-toggle-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      parent.insertBefore(spacer, wrapper.nextSibling);
    });
  }

  function showVocabularyPopup(button, groupEl, vocabKey) {
    hideVocabularyPopup();
    const groupTerm = vocabulary[vocabKey];
    const categoryName = (groupEl.querySelector('.fides-filter-label') && groupEl.querySelector('.fides-filter-label').textContent) ? groupEl.querySelector('.fides-filter-label').textContent.trim() : '';
    let html = '';
    if (categoryName) {
      html += '<p class="fides-vocab-popup-title"><strong>' + escapeHtml(categoryName) + '</strong></p>';
    }
    if (groupTerm && groupTerm.description) {
      html += '<p class="fides-vocab-popup-intro">' + escapeHtml(groupTerm.description) + '</p>';
    }
    const optionsEl = groupEl.querySelector('.fides-filter-options');
    if (optionsEl) {
      const labels = optionsEl.querySelectorAll('label.fides-filter-checkbox');
      if (labels.length > 0) {
        const listItems = [];
        labels.forEach(label => {
          const input = label.querySelector('input[data-value]');
          const value = input ? input.dataset.value : '';
          const labelText = (label.querySelector('span') || label).textContent.trim();
          const optionVocabKey = (WALLET_OPTION_TO_VOCAB[vocabKey] && WALLET_OPTION_TO_VOCAB[vocabKey][value] !== undefined)
            ? WALLET_OPTION_TO_VOCAB[vocabKey][value] : value;
          const term = optionVocabKey ? vocabulary[optionVocabKey] : null;
          const desc = term && term.description ? escapeHtml(term.description) : '';
          listItems.push({ labelText, desc });
        });
        const hasAnyOptionDesc = listItems.some(item => item.desc);
        if (hasAnyOptionDesc) {
          html += '<ul class="fides-vocab-popup-list">';
          listItems.forEach(item => {
            html += '<li><strong>' + escapeHtml(item.labelText) + '</strong>' + (item.desc ? ': ' + item.desc : '') + '</li>';
          });
          html += '</ul>';
        }
      }
    }
    if (!html) html = '<p>No description available.</p>';

    const popup = document.createElement('div');
    popup.className = 'fides-vocab-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Filter explanation');
    popup.innerHTML = html;

    // Create overlay backdrop
    const overlay = document.createElement('div');
    overlay.className = 'fides-vocab-overlay';
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Position popup: more to the right (over first column), vertically centered; clamp to viewport
    const margin = 20;
    const rect = button.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const popupLeft = Math.min(rect.right + 40, w - pw - margin);
    const left = Math.max(margin, Math.min(popupLeft, w - pw - margin));
    const top = Math.max(margin, Math.min((h - ph) / 2, h - ph - margin));
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    
    setTimeout(() => {
      overlay.classList.add('visible');
      popup.classList.add('visible');
    }, 10);

    const close = (e) => {
      if (e && e.target.closest('.fides-vocab-popup')) return; // Don't close if clicking inside popup
      hideVocabularyPopup();
      document.removeEventListener('click', close, true);
      document.removeEventListener('keydown', onKeydown);
    };
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeydown);
    // Use capture phase to intercept clicks before they reach links
    setTimeout(() => document.addEventListener('click', close, true), 0);
  }

  function hideVocabularyPopup() {
    const overlay = document.querySelector('.fides-vocab-overlay');
    const popup = document.querySelector('.fides-vocab-popup');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
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
   * ============================================================================
   * VIDEO HELPER FUNCTIONS
   * ============================================================================
   * 
   * IMPORTANT - CODE DUPLICATION WARNING:
   * These functions are duplicated between:
   * - wordpress-plugin/fides-rp-catalog/assets/rp-catalog.js
   * - wordpress-plugin/fides-wallet-catalog/assets/wallet-catalog.js
   * 
   * When making changes (adding providers, fixing bugs), UPDATE BOTH FILES!
   * ============================================================================
   */

  /**
   * Video provider configuration
   * Add new providers here - automatically supported in all functions
   */
  const VIDEO_PROVIDERS = [
    {
      name: 'youtube',
      patterns: [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
        /youtube\.com\/embed\/([^&\?\/]+)/,
        /youtube\.com\/shorts\/([^&\?\/]+)/
      ],
      embedUrl: (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      privacy: 'Uses youtube-nocookie.com for GDPR compliance'
    },
    {
      name: 'vimeo',
      patterns: [
        /vimeo\.com\/(\d+)/,
        /player\.vimeo\.com\/video\/(\d+)/
      ],
      embedUrl: (videoId) => `https://player.vimeo.com/video/${videoId}`,
      privacy: 'Privacy-friendly by default'
    }
    // To add Loom support in the future, uncomment:
    // {
    //   name: 'loom',
    //   patterns: [/loom\.com\/share\/([a-f0-9]+)/],
    //   embedUrl: (videoId) => `https://www.loom.com/embed/${videoId}`,
    //   privacy: 'Reasonably privacy-friendly'
    // }
  ];

  /**
   * Detect video provider from URL
   * @param {string} url - Video URL
   * @returns {string|null} - Provider name or null if not recognized
   */
  function detectVideoProvider(url) {
    if (!url) return null;
    
    for (const provider of VIDEO_PROVIDERS) {
      for (const pattern of provider.patterns) {
        if (url.match(pattern)) {
          return provider.name;
        }
      }
    }
    
    return null;
  }

  /**
   * Convert video URL to embed URL
   * @param {string} videoUrl - Original video URL
   * @returns {string|null} - Embed URL or null if provider not supported
   */
  function getVideoEmbedUrl(videoUrl) {
    if (!videoUrl) return null;
    
    // Try each provider
    for (const provider of VIDEO_PROVIDERS) {
      for (const pattern of provider.patterns) {
        const match = videoUrl.match(pattern);
        if (match && match[1]) {
          return provider.embedUrl(match[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Generate video embed HTML
   * @param {string} videoUrl - Original video URL
   * @returns {string} - HTML for embedded video or fallback button
   */
  function getVideoEmbedHtml(videoUrl) {
    const embedUrl = getVideoEmbedUrl(videoUrl);
    
    if (embedUrl) {
      return `
        <div class="fides-video-container">
          <iframe 
            src="${embedUrl}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            class="fides-video-iframe"
            title="Video player">
          </iframe>
        </div>
      `;
    }
    
    // Fallback: external link button if provider not supported
    return `
      <div class="fides-video-fallback">
        <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener" class="fides-modal-link primary">
          ${icons.play} Watch Video (External)
        </a>
      </div>
    `;
  }

  /**
   * ============================================================================
   * MATOMO ANALYTICS HELPER
   * ============================================================================
   * Track user interactions with Matomo (if available)
   * Privacy-friendly: respects DoNotTrack and only tracks if Matomo is loaded
   */

  /**
   * Track event to Matomo analytics
   * @param {string} category - Event category (e.g., 'Wallet Catalog')
   * @param {string} action - Event action (e.g., 'Modal Open')
   * @param {string} name - Event name (e.g., wallet name)
   * @param {number} value - Optional numeric value
   */
  function trackMatomoEvent(category, action, name, value) {
    // Check if Matomo is loaded
    if (typeof window._paq === 'undefined') {
      return;
    }
    
    // Respect DoNotTrack
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
      return;
    }
    
    // Track the event
    try {
      window._paq.push(['trackEvent', category, action, name, value]);
    } catch (e) {
      // Silently fail if tracking fails
      console.debug('Matomo tracking failed:', e);
    }
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
