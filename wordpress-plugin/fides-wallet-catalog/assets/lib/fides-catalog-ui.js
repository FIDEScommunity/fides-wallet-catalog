(function() {
  'use strict';

  if (window.FidesCatalogUI) return;

  const CREDENTIAL_FORMAT_ORDER = [
    'sd_jwt_vc',
    'mdoc',
    'jwt_vc',
    'vcdm_1_1',
    'vcdm_2_0',
    'anoncreds',
    'idemix',
    'apple_wallet_pass',
    'google_wallet_pass',
    'acdc',
  ];
  const CREDENTIAL_FORMAT_DISPLAY = {
    sd_jwt_vc: 'SD-JWT VC',
    mdoc: 'ISO mDoc',
    jwt_vc: 'JWT VC',
    vcdm_1_1: 'VCDM1.1',
    vcdm_2_0: 'VCDM2.0',
    anoncreds: 'AnonCreds',
    idemix: 'Idemix',
    apple_wallet_pass: 'Apple Wallet Pass',
    google_wallet_pass: 'Google Wallet Pass',
    acdc: 'ACDC',
  };
  function credentialFormatDisplayLabel(code) {
    return CREDENTIAL_FORMAT_DISPLAY[code] || code;
  }

  /** Map filter option raw values to vocabulary.json keys (keep in sync with wallet-catalog.js). */
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
      'did:ebsi': 'didEbsi',
      'did:webvh': 'didWebvh'
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
    eidasTrustService: {
      'Q_CERT_ESIG': 'QESig',
      'Q_CERT_ESEAL': 'QESeal',
      'Q_TIMESTAMP': 'QTimestamp',
      'Q_ERDS': 'QERDS',
      'Q_WAC': 'QWAC',
      'Q_EARCH': 'QEArch',
      'Q_VC': 'QVal',
      'Q_PRES': 'QPres',
      'Q_PRES_ESEAL': 'QPresSeal',
      'Q_PRES_ESIG': 'QPresSig',
      'Q_VAL_ESEAL': 'QValSeal',
      'Q_VAL_ESIG': 'QValSig',
      'Q_REM_MANAGE_Q_SEAL_CD': 'QRemSeal',
      'Q_REM_MANAGE_Q_SIG_CD': 'QRemSig',
      'QEAA': 'QEAA'
    }
  };

  function resolveWalletVocabKey(groupKey, rawValue) {
    const raw = String(rawValue);
    const maps = WALLET_OPTION_TO_VOCAB[groupKey];
    if (maps && maps[raw] !== undefined) return maps[raw];
    return raw;
  }

  function walletVocabEntry(vocabulary, groupKey, rawValue) {
    if (!vocabulary) return null;
    const key = resolveWalletVocabKey(groupKey, rawValue);
    const entry = vocabulary[key];
    if (!entry || !entry.description) return null;
    return { key: key, entry: entry };
  }

  const icons = {
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>',
    externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    externalLinkSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    smartphone: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    key: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    penLine: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>',
    chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    maximize: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    laptop: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    official: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    mail: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    apple: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
    playStore: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z"/></svg>',
    globeApp: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'
  };

  let currentModalMediaSlides = [];

  const OFFICIAL_LISTING_TITLE = 'Official listing — managed by the provider';
  const COMMUNITY_LISTING_TITLE = 'Community listing — contributed by the community';

  let selectedContext = null;

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function sortCredentialFormats(formats) {
    if (!formats || !Array.isArray(formats)) return [];
    return formats.slice().sort((a, b) => {
      const indexA = CREDENTIAL_FORMAT_ORDER.indexOf(a);
      const indexB = CREDENTIAL_FORMAT_ORDER.indexOf(b);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
  }

  function getAppStoreLink(wallet, platform) {
    if (!wallet.appStoreLinks) return null;
    const platformKey = platform.toLowerCase();
    if (platformKey === 'ios') return wallet.appStoreLinks.iOS || wallet.appStoreLinks.ios;
    if (platformKey === 'android') return wallet.appStoreLinks.android;
    if (platformKey === 'web') return wallet.appStoreLinks.web || wallet.website;
    return null;
  }

  function renderPlatformTag(wallet, platform, labelsOnly) {
    const link = labelsOnly ? null : getAppStoreLink(wallet, platform);
    const icon = platform === 'iOS' || platform === 'Android' ? icons.smartphone : icons.globe;
    if (link) return '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" class="fides-tag platform clickable">' + icon + ' ' + escapeHtml(platform) + '</a>';
    return '<span class="fides-tag platform">' + icon + ' ' + escapeHtml(platform) + '</span>';
  }

  const CATALOG_TIER_COMMUNITY = 'Community';
  const CATALOG_TIER_PRO = 'Pro';

  /** Community vs Pro from export field; legacy gratis and missing catalogTier stay Pro. */
  function resolveCatalogTier(item) {
    if (!item || !item.catalogTier) return CATALOG_TIER_PRO;
    const tier = String(item.catalogTier).toLowerCase();
    if (tier === 'gratis' || tier === 'community') return CATALOG_TIER_COMMUNITY;
    return CATALOG_TIER_PRO;
  }

  function itemIsCommunity(item) {
    return resolveCatalogTier(item) === CATALOG_TIER_COMMUNITY;
  }

  /** Explicit Pro in export JSON only — missing catalogTier is not treated as official. */
  function catalogTierIsProExplicit(item) {
    if (!item || !item.catalogTier) return false;
    return resolveCatalogTier(item) === CATALOG_TIER_PRO;
  }

  function buildCatalogListingHeaderBadgeHtml(item, options) {
    if (!optionsTierUiEnabled(options)) return '';
    if (walletListingTierIsPro(item, options)) {
      return '<span class="fides-modal-header-official-badge fides-modal-header-listing-badge fides-modal-header-listing-badge--official" role="status" title="' +
        escapeHtml(OFFICIAL_LISTING_TITLE) + '">' + icons.official +
        '<span class="fides-modal-header-official-label fides-modal-header-listing-label">Official Listing</span></span>';
    }
    return '<span class="fides-modal-header-official-badge fides-modal-header-listing-badge fides-modal-header-listing-badge--community" role="status" title="' +
      escapeHtml(COMMUNITY_LISTING_TITLE) +
      '"><span class="fides-modal-header-official-label fides-modal-header-listing-label">Community Listing</span></span>';
  }

  /** Whether Community vs Pro tier UI is active (master switch + options.tierUiEnabled). */
  function optionsTierUiEnabled(options) {
    return !!(options && options.tierUiEnabled);
  }

  /**
   * Whether the signed-in user may open the update form for a catalog item.
   * Pro orgs (ownership-linked) are owner-only; Community orgs allow any signed-in user.
   *
   * @param {object|null|undefined} editAccess { isLoggedIn, ownedOrgIds, proOrgIds }
   * @param {string} orgId org:… anchor for organization or wallet provider
   * @return {boolean}
   */
  function userCanEditCatalogItem(editAccess, orgId) {
    if (!editAccess || !editAccess.isLoggedIn) return false;
    if (editAccess.isAdmin) return true;
    const org = String(orgId || '').trim();
    if (!org) return true;
    const proOrgIds = Array.isArray(editAccess.proOrgIds) ? editAccess.proOrgIds : [];
    const ownedOrgIds = Array.isArray(editAccess.ownedOrgIds) ? editAccess.ownedOrgIds : [];
    const isProOrg = proOrgIds.indexOf(org) >= 0;
    if (!isProOrg) return true;
    return ownedOrgIds.indexOf(org) >= 0;
  }

  function resolveWalletOrgId(wallet) {
    if (!wallet || typeof wallet !== 'object') return '';
    const top = wallet.orgId != null ? String(wallet.orgId).trim() : '';
    if (top.indexOf('org:') === 0) return top;
    const fromProvider = wallet.provider && wallet.provider.orgId != null
      ? String(wallet.provider.orgId).trim()
      : '';
    return fromProvider.indexOf('org:') === 0 ? fromProvider : '';
  }

  /** org:… from catalog item id (organization) or wallet provider orgId. */
  function resolveCatalogItemOrgId(item) {
    if (!item || typeof item !== 'object') return '';
    const directId = item.id != null ? String(item.id).trim() : '';
    if (directId.indexOf('org:') === 0) return directId;
    return resolveWalletOrgId(item);
  }

  function normalizeEditAccess(options) {
    const raw = options && options.editAccess;
    const editAccess = raw && typeof raw === 'object'
      ? Object.assign({}, raw)
      : { ownedOrgIds: [], proOrgIds: [] };
    editAccess.isLoggedIn = !!(editAccess.isLoggedIn || boolFromMixed(options && options.isLoggedIn) || boolFromMixed(options && options.ratingsIsLoggedIn));
    if (!Array.isArray(editAccess.ownedOrgIds)) editAccess.ownedOrgIds = [];
    if (!Array.isArray(editAccess.proOrgIds)) editAccess.proOrgIds = [];
    return editAccess;
  }

  function canEditOrganization(org, options) {
    return userCanEditCatalogItem(normalizeEditAccess(options), org && org.id ? String(org.id).trim() : '');
  }

  function canEditWallet(wallet, options) {
    return userCanEditCatalogItem(normalizeEditAccess(options), resolveWalletOrgId(wallet));
  }

  /** Pro listing for wallet/org UI when tier switch is on (explicit Pro tier or proOrgIds fallback). */
  function walletListingTierIsPro(item, options) {
    if (!optionsTierUiEnabled(options)) return true;
    if (!item) return false;
    if (item.catalogTier) {
      return !itemIsCommunity(item);
    }
    const orgId = resolveCatalogItemOrgId(item);
    if (!orgId) return false;
    const editAccess = normalizeEditAccess(options);
    const proOrgIds = Array.isArray(editAccess.proOrgIds) ? editAccess.proOrgIds : [];
    return proOrgIds.indexOf(orgId) >= 0;
  }

  function parseYoutubeVideoId(videoUrl) {
    const match = String(videoUrl || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/);
    return match && match[1] ? match[1] : '';
  }

  function parseVimeoVideoId(videoUrl) {
    const match = String(videoUrl || '').match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    return match && match[1] ? match[1] : '';
  }

  function getVideoEmbedUrl(videoUrl) {
    if (!videoUrl) return null;
    const ytId = parseYoutubeVideoId(videoUrl);
    if (ytId) return 'https://www.youtube-nocookie.com/embed/' + ytId + '?rel=0&modestbranding=1';
    const vimeoId = parseVimeoVideoId(videoUrl);
    if (vimeoId) return 'https://player.vimeo.com/video/' + vimeoId;
    return null;
  }

  function getVideoEmbedHtml(videoUrl) {
    const embedUrl = getVideoEmbedUrl(videoUrl);
    if (embedUrl) {
      return '<div class="fides-video-container"><iframe src="' + escapeHtml(embedUrl) + '" frameborder="0" class="fides-video-iframe" title="Video player"></iframe></div>';
    }
    return '<div class="fides-video-fallback"><a href="' + escapeHtml(videoUrl) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Video">' + icons.play + ' Watch Video (External)</a></div>';
  }

  const WALLET_DEPLOYMENT_MODEL_LABELS = {
    saas: 'SaaS (cloud)',
    on_premises: 'On-premises',
    hybrid: 'Hybrid',
  };

  const WALLET_LICENSE_LABELS = {
    MIT: 'MIT',
    'Apache-2.0': 'Apache-2.0',
    'GPL-3.0-or-later': 'GPL-3.0 or later',
    'AGPL-3.0-or-later': 'AGPL-3.0 or later',
    'LGPL-3.0-or-later': 'LGPL-3.0 or later',
    'EUPL-1.2': 'EUPL-1.2',
    'MPL-2.0': 'MPL-2.0',
    'BSD-3-Clause': 'BSD-3-Clause',
    ISC: 'ISC',
    proprietary: 'Proprietary (closed source)',
    other: 'Other',
  };

  function walletMediaVideos(wallet) {
    if (!wallet) return [];
    const urls = [];
    if (wallet.media && Array.isArray(wallet.media.videos)) {
      wallet.media.videos.forEach(function(url) {
        const clean = String(url || '').trim();
        if (clean && urls.indexOf(clean) === -1) urls.push(clean);
      });
    }
    const legacy = wallet.video ? String(wallet.video).trim() : '';
    if (legacy && urls.indexOf(legacy) === -1) urls.unshift(legacy);
    return urls;
  }

  function walletMediaImages(wallet) {
    if (!wallet || !wallet.media || !Array.isArray(wallet.media.images)) return [];
    const urls = [];
    wallet.media.images.forEach(function(url) {
      const clean = String(url || '').trim();
      if (clean && urls.indexOf(clean) === -1) urls.push(clean);
    });
    return urls;
  }

  function walletRecognitionItems(wallet, key) {
    const rec = wallet && wallet.recognitions && typeof wallet.recognitions === 'object' ? wallet.recognitions : null;
    if (rec && Array.isArray(rec[key])) {
      return rec[key].filter(function(item) {
        return item && String(item.title || '').trim();
      });
    }
    if (key === 'certifications' && wallet && Array.isArray(wallet.certifications)) {
      return wallet.certifications.map(function(title) {
        return { title: String(title || '').trim(), url: '' };
      }).filter(function(item) {
        return item.title;
      });
    }
    return [];
  }

  function walletAdditionalDocumentationItems(wallet) {
    if (!wallet || !Array.isArray(wallet.additionalDocumentation)) return [];
    return wallet.additionalDocumentation.filter(function(item) {
      return item && String(item.title || '').trim();
    });
  }

  function buildWalletAdditionalProductLinkRow(label, href, matomoName, linkText) {
    const url = String(href || '').trim();
    if (!url) return '';
    const display = linkText != null && String(linkText).trim() ? String(linkText).trim() : url;
    return '<div class="fides-additional-product-link-row">' +
      '<span class="fides-additional-product-link-label">' + escapeHtml(label) + '</span>' +
      '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="fides-modal-link-inline fides-additional-product-link" data-matomo-name="' + escapeHtml(matomoName) + '">' +
      escapeHtml(display) + ' ' + icons.externalLinkSmall + '</a></div>';
  }

  function buildWalletAdditionalProductInfoBodyHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    const linkRows = [];
    const websiteRow = buildWalletAdditionalProductLinkRow('Product link', wallet.website, 'Product link');
    if (websiteRow) linkRows.push(websiteRow);
    const documentationRow = buildWalletAdditionalProductLinkRow('Documentation', wallet.documentation, 'Documentation');
    if (documentationRow) linkRows.push(documentationRow);
    const repositoryRow = buildWalletAdditionalProductLinkRow('Code Repository', wallet.repository, 'Code Repository');
    if (repositoryRow) linkRows.push(repositoryRow);
    walletAdditionalDocumentationItems(wallet).forEach(function(item) {
      const row = buildWalletAdditionalProductLinkRow(
        String(item.title || '').trim(),
        item.url,
        'Additional documentation'
      );
      if (row) linkRows.push(row);
    });
    if (!linkRows.length) return '';
    return '<div class="fides-wallet-additional-product-info">' +
      '<div class="fides-additional-product-links">' + linkRows.join('') + '</div></div>';
  }

  function walletAdditionalProductInfoCount(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return 0;
    let count = 0;
    if (wallet && String(wallet.website || '').trim()) count += 1;
    if (wallet && String(wallet.documentation || '').trim()) count += 1;
    if (wallet && String(wallet.repository || '').trim()) count += 1;
    return count + walletAdditionalDocumentationItems(wallet).length;
  }

  function walletStandardsList(wallet) {
    if (!wallet || !wallet.standards) return [];
    if (Array.isArray(wallet.standards)) {
      return wallet.standards.map(function(s) { return String(s || '').trim(); }).filter(Boolean);
    }
    return String(wallet.standards).split(/[,\n]/).map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function walletLicenseDisplay(wallet) {
    if (!wallet || !wallet.license) return '';
    if (wallet.license === 'other') {
      const other = wallet.licenseOther ? String(wallet.licenseOther).trim() : '';
      return other || WALLET_LICENSE_LABELS.other;
    }
    return WALLET_LICENSE_LABELS[wallet.license] || String(wallet.license);
  }

  function walletStatusDisplay(wallet) {
    if (!wallet || !wallet.status) return '';
    const statusLabels = {
      development: 'In Development',
      beta: 'Beta',
      production: 'Production',
      deprecated: 'Deprecated',
    };
    return statusLabels[wallet.status] || String(wallet.status);
  }

  function walletLicenseKvDisplay(wallet) {
    const licenseLabel = walletLicenseDisplay(wallet);
    if (wallet.openSource) {
      return 'Open Source' + (licenseLabel ? ' (' + licenseLabel + ')' : '');
    }
    return licenseLabel || 'Proprietary';
  }

  function walletDeploymentModelLabel(code) {
    if (!code) return '';
    return WALLET_DEPLOYMENT_MODEL_LABELS[code] || String(code);
  }

  const WALLET_CAPABILITY_LABELS = { holder: 'Holder', issuer: 'Issuer', verifier: 'Verifier' };
  const WALLET_CAPABILITY_ORDER = ['holder', 'issuer', 'verifier'];

  function walletCapabilityLabel(code) {
    const key = String(code || '').toLowerCase();
    if (WALLET_CAPABILITY_LABELS[key]) return WALLET_CAPABILITY_LABELS[key];
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
  }

  function sortedWalletCapabilities(wallet) {
    if (!wallet || !Array.isArray(wallet.capabilities)) return [];
    const caps = wallet.capabilities.map(function(c) { return String(c || '').toLowerCase(); }).filter(Boolean);
    return WALLET_CAPABILITY_ORDER.filter(function(c) { return caps.indexOf(c) >= 0; })
      .concat(caps.filter(function(c) { return WALLET_CAPABILITY_ORDER.indexOf(c) < 0; }));
  }

  function walletCapabilitySet(wallet) {
    if (!wallet || !Array.isArray(wallet.capabilities)) return new Set();
    return new Set(wallet.capabilities.map(function(c) { return String(c || '').toLowerCase(); }).filter(Boolean));
  }

  function renderWalletCheckOption(label, active) {
    return '<span class="fides-wallet-check-option' + (active ? ' is-active' : ' is-inactive') + '">' +
      '<span class="fides-wallet-check-box" aria-hidden="true">' + (active ? icons.check : '') + '</span>' +
      '<span class="fides-wallet-check-label">' + escapeHtml(label) + '</span></span>';
  }

  function renderWalletCheckGroup(options) {
    return '<span class="fides-wallet-check-group">' + options.join('') + '</span>';
  }

  function buildWalletKeyCapabilitiesKvSection(wallet) {
    if (walletIsPersonal(wallet)) return '';
    const capSet = walletCapabilitySet(wallet);
    const items = WALLET_CAPABILITY_ORDER.map(function(key) {
      return renderWalletCheckOption(walletCapabilityLabel(key), capSet.has(key));
    }).join('');
    return '<div class="fides-kv-section" data-section="capabilities">' +
      '<div class="fides-kv-section-title">Key capabilities</div>' +
      '<div class="fides-wallet-key-capabilities fides-wallet-check-group-wrap">' + items + '</div></div>';
  }

  const EIDAS_TRUST_SERVICE_ORDER = [
    'Q_CERT_ESIG',
    'Q_CERT_ESEAL',
    'Q_TIMESTAMP',
    'Q_ERDS',
    'Q_WAC',
    'Q_EARCH',
    'Q_VC',
    'Q_PRES',
    'Q_PRES_ESEAL',
    'Q_PRES_ESIG',
    'Q_VAL_ESEAL',
    'Q_VAL_ESIG',
    'Q_REM_MANAGE_Q_SEAL_CD',
    'Q_REM_MANAGE_Q_SIG_CD',
    'QEAA',
  ];

  const EIDAS_TRUST_SERVICES_PERSONAL = [
    'Q_CERT_ESIG',
    'Q_TIMESTAMP',
    'Q_ERDS',
    'Q_EARCH',
    'Q_VC',
    'Q_PRES',
    'Q_PRES_ESIG',
    'Q_VAL_ESIG',
    'Q_REM_MANAGE_Q_SIG_CD',
    'QEAA',
  ];

  const EIDAS_TRUST_SERVICE_ABBREVIATIONS = {
    Q_CERT_ESIG: 'QESig',
    Q_CERT_ESEAL: 'QESeal',
    Q_TIMESTAMP: 'QTimestamp',
    Q_ERDS: 'QERDS',
    Q_WAC: 'QWAC',
    Q_EARCH: 'QEArch',
    Q_VC: 'QVal',
    Q_PRES: 'QPres',
    Q_PRES_ESEAL: 'QPresSeal',
    Q_PRES_ESIG: 'QPresSig',
    Q_VAL_ESEAL: 'QValSeal',
    Q_VAL_ESIG: 'QValSig',
    Q_REM_MANAGE_Q_SEAL_CD: 'QRemSeal',
    Q_REM_MANAGE_Q_SIG_CD: 'QRemSig',
    QEAA: 'QEAA',
  };

  const EIDAS_TRUST_SERVICE_FULL_LABELS = {
    Q_CERT_ESIG: 'Qualified electronic signature certificate',
    Q_CERT_ESEAL: 'Qualified electronic seal certificate',
    Q_TIMESTAMP: 'Qualified timestamp',
    Q_ERDS: 'Qualified electronic registered delivery service',
    Q_WAC: 'Qualified website authentication certificate',
    Q_EARCH: 'Qualified electronic archiving',
    Q_VC: 'Qualified validation service',
    Q_PRES: 'Qualified preservation service',
    Q_PRES_ESEAL: 'Qualified preservation service for electronic seals',
    Q_PRES_ESIG: 'Qualified preservation service for electronic signatures',
    Q_VAL_ESEAL: 'Qualified validation service for electronic seals',
    Q_VAL_ESIG: 'Qualified validation service for electronic signatures',
    Q_REM_MANAGE_Q_SEAL_CD: 'Qualified management of remote seal creation devices',
    Q_REM_MANAGE_Q_SIG_CD: 'Qualified management of remote signature creation devices',
    QEAA: 'Qualified electronic attestation of attributes',
  };

  function walletEidasTrustServiceSet(wallet) {
    if (!wallet || !Array.isArray(wallet.eidasTrustServices)) return new Set();
    return new Set(wallet.eidasTrustServices.map(function(code) {
      return String(code || '').trim();
    }).filter(Boolean));
  }

  function eidasTrustServiceCodesForWallet(wallet) {
    const allowed = walletIsPersonal(wallet) ? EIDAS_TRUST_SERVICES_PERSONAL : EIDAS_TRUST_SERVICE_ORDER;
    const selected = walletEidasTrustServiceSet(wallet);
    const codes = allowed.slice();
    selected.forEach(function(code) {
      if (codes.indexOf(code) === -1) codes.push(code);
    });
    return codes.sort(function(a, b) {
      return EIDAS_TRUST_SERVICE_ORDER.indexOf(a) - EIDAS_TRUST_SERVICE_ORDER.indexOf(b);
    });
  }

  function renderWalletEidasCheckOption(code, active, vocabulary) {
    const abbrev = EIDAS_TRUST_SERVICE_ABBREVIATIONS[code] || code;
    const full = EIDAS_TRUST_SERVICE_FULL_LABELS[code] || code;
    const match = vocabulary ? walletVocabEntry(vocabulary, 'eidasTrustService', code) : null;
    let labelHtml;
    if (match) {
      labelHtml = '<button type="button" class="fides-kv-glossary-link fides-wallet-check-vocab-link" data-vocab-key="' +
        escapeHtml(match.key) + '" title="' + escapeHtml(full) + '" aria-label="Definition: ' + escapeHtml(full) + '">' +
        escapeHtml(abbrev) + '</button>';
    } else {
      labelHtml = '<span class="fides-wallet-check-label" title="' + escapeHtml(full) + '">' + escapeHtml(abbrev) + '</span>';
    }
    return '<span class="fides-wallet-check-option' + (active ? ' is-active' : ' is-inactive') + '">' +
      '<span class="fides-wallet-check-box" aria-hidden="true">' + (active ? icons.check : '') + '</span>' +
      labelHtml + '</span>';
  }

  function buildWalletEidasTrustServicesKvSection(wallet, vocabulary) {
    const selected = walletEidasTrustServiceSet(wallet);
    const codes = eidasTrustServiceCodesForWallet(wallet);
    const options = codes.map(function(code) {
      return renderWalletEidasCheckOption(code, selected.has(code), vocabulary);
    });
    return '<div class="fides-kv-section" data-section="eidasTrustServices">' +
      '<div class="fides-kv-section-title">eIDAS Trust Services</div>' +
      '<div class="fides-wallet-check-group-wrap">' + renderWalletCheckGroup(options) + '</div></div>';
  }

  function renderWalletDeploymentChecksHtml(wallet) {
    const model = String(wallet && wallet.deploymentModel || '').toLowerCase();
    if (!model) return '';
    const saas = model === 'saas' || model === 'hybrid';
    const onPremises = model === 'on_premises' || model === 'hybrid';
    return renderWalletCheckGroup([
      renderWalletCheckOption('SaaS', saas),
      renderWalletCheckOption('On-premises', onPremises),
    ]);
  }

  function walletIsPersonal(wallet) {
    return String(wallet && wallet.type || '').toLowerCase() === 'personal';
  }

  function walletHasWebPlatform(wallet) {
    const platforms = wallet && wallet.platforms;
    if (!Array.isArray(platforms)) return false;
    return platforms.some(function(platform) {
      return String(platform).toLowerCase() === 'web';
    });
  }

  function resolveWalletWebUrl(wallet) {
    const appLinks = wallet && wallet.appStoreLinks && typeof wallet.appStoreLinks === 'object' ? wallet.appStoreLinks : {};
    return String(appLinks.web || wallet.website || '').trim();
  }

  function walletHasPlatform(wallet, platformName) {
    const platforms = wallet && wallet.platforms;
    if (!Array.isArray(platforms)) return false;
    const needle = String(platformName).toLowerCase();
    return platforms.some(function(platform) {
      return String(platform).toLowerCase() === needle;
    });
  }

  function renderWalletAppStoreButton(kind, iconHtml, smallText, strongText, url, isClickable, matomoName, ariaLabel) {
    const className = 'fides-app-store-btn ' + kind + (isClickable ? '' : ' is-disabled');
    const labelHtml = '<span><small>' + escapeHtml(smallText) + '</small><strong>' + escapeHtml(strongText) + '</strong></span>';
    const content = iconHtml + labelHtml;
    if (isClickable && url) {
      return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="' + className + '" data-matomo-name="' + escapeHtml(matomoName) + '" aria-label="' + escapeHtml(ariaLabel) + '">' + content + '</a>';
    }
    return '<span class="' + className + '" role="img" aria-label="' + escapeHtml(ariaLabel) + ' (preview only)">' + content + '</span>';
  }

  function buildWalletAppStoreButtonsHtml(wallet, options) {
    const isPro = walletListingTierIsPro(wallet, options);
    const appLinks = wallet && wallet.appStoreLinks && typeof wallet.appStoreLinks === 'object' ? wallet.appStoreLinks : {};
    const iosUrl = String(appLinks.iOS || appLinks.ios || '').trim();
    const androidUrl = String(appLinks.android || '').trim();
    const webUrl = resolveWalletWebUrl(wallet);
    const buttons = [];
    if (iosUrl || walletHasPlatform(wallet, 'iOS')) {
      buttons.push(renderWalletAppStoreButton(
        'ios',
        icons.apple,
        'Download on the',
        'App Store',
        iosUrl,
        isPro && !!iosUrl,
        'App Store',
        'Download on the App Store'
      ));
    }
    if (androidUrl || walletHasPlatform(wallet, 'Android')) {
      buttons.push(renderWalletAppStoreButton(
        'android',
        icons.playStore,
        'Get it on',
        'Google Play',
        androidUrl,
        isPro && !!androidUrl,
        'Google Play',
        'Get it on Google Play'
      ));
    }
    if (walletHasWebPlatform(wallet)) {
      buttons.push(renderWalletAppStoreButton(
        'web',
        icons.globeApp,
        'Use on the',
        'Web',
        webUrl,
        isPro && !!webUrl,
        'Web app',
        'Open web app'
      ));
    }
    if (!buttons.length) return '';
    return '<div class="fides-wallet-capabilities fides-wallet-app-stores">' +
      '<span class="fides-wallet-capabilities-label">Get the app</span>' +
      '<div class="fides-wallet-capabilities-list fides-modal-app-stores">' + buttons.join('') + '</div></div>';
  }

  function buildWalletCapabilitiesOrAppStoresHtml(wallet, options) {
    if (!walletIsPersonal(wallet)) return '';
    return buildWalletAppStoreButtonsHtml(wallet, options);
  }

  function buildWalletModalMediaSlides(wallet) {
    const title = wallet && wallet.name ? String(wallet.name) : 'Wallet preview';
    const slides = [];

    walletMediaVideos(wallet).forEach(function(url, index) {
      const embedSrc = getVideoEmbedUrl(url);
      if (!embedSrc) return;
      const ytId = parseYoutubeVideoId(url);
      const thumbUrl = ytId ? 'https://i.ytimg.com/vi/' + encodeURIComponent(ytId) + '/hqdefault.jpg' : '';
      slides.push({
        type: 'video',
        label: index === 0 ? 'Demo video' : 'Demo video ' + (index + 1),
        embedSrc: embedSrc,
        videoTitle: index === 0 ? 'Demo video' : 'Demo video ' + (index + 1),
        thumbUrl: thumbUrl
      });
    });

    walletMediaImages(wallet).forEach(function(url, index) {
      const imageUrl = String(url || '').trim();
      if (!imageUrl) return;
      slides.push({
        type: 'image',
        label: index === 0 ? 'Image' : 'Image ' + (index + 1),
        imageUrl: imageUrl,
        alt: index === 0 ? title : title + ' image ' + (index + 1)
      });
    });

    return slides;
  }

  function modalMediaSlideThumbUrl(slide) {
    if (slide.type === 'image') return slide.imageUrl;
    return slide.thumbUrl || '';
  }

  function renderModalMediaSlideHtml(slide) {
    if (slide.type === 'video') {
      return '<div class="fides-use-case-modal-media fides-use-case-modal-media-video">' +
        '<div class="fides-use-case-modal-media-frame" data-video-embed-src="' + escapeHtml(slide.embedSrc) + '" data-video-title="' + escapeHtml(slide.videoTitle) + '"></div>' +
        '</div>';
    }
    return '<div class="fides-use-case-modal-media fides-use-case-modal-media-image">' +
      '<img src="' + escapeHtml(slide.imageUrl) + '" alt="' + escapeHtml(slide.alt) + '" loading="lazy">' +
      '</div>';
  }

  function renderModalMediaThumbsHtml(slides, context) {
    if (slides.length < 2) return '';
    return '<div class="fides-media-thumbs" data-media-thumbs="' + escapeHtml(context) + '">' +
      slides.map(function(slide, index) {
        const thumb = modalMediaSlideThumbUrl(slide);
        const inner = thumb
          ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
          : '<span class="fides-media-thumb-fallback">' + icons.play + '</span>';
        const videoBadge = slide.type === 'video' ? '<span class="fides-media-thumb-play">' + icons.play + '</span>' : '';
        return '<button type="button" class="fides-media-thumb' + (index === 0 ? ' is-active' : '') + '" data-thumb-index="' + index + '" aria-label="' + escapeHtml(slide.label) + '">' +
          inner + videoBadge +
          '</button>';
      }).join('') +
      '</div>';
  }

  function renderModalMediaCarouselHtml(slides, ariaLabel) {
    if (!slides.length) return '';
    currentModalMediaSlides = slides;
    const multi = slides.length > 1;
    const expandLabel = 'View larger';
    return '<div class="fides-use-case-modal-media-wrap' + (multi ? ' is-multi' : '') + '">' +
      '<div class="fides-use-case-modal-carousel" tabindex="0" aria-roledescription="carousel" aria-label="' + escapeHtml(ariaLabel || 'Media') + '">' +
      '<div class="fides-use-case-modal-carousel-viewport">' +
      '<div class="fides-use-case-modal-carousel-track" data-carousel-track style="transform: translateX(0);">' +
      slides.map(function(slide, index) {
        return '<div class="fides-use-case-modal-carousel-slide' + (index === 0 ? ' is-active' : '') + '" data-carousel-slide="' + index + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '">' +
          '<button type="button" class="fides-media-expand-btn" data-media-expand="' + index + '" aria-label="' + escapeHtml(expandLabel) + '" title="' + escapeHtml(expandLabel) + '">' + icons.maximize + '</button>' +
          renderModalMediaSlideHtml(slide) +
          '</div>';
      }).join('') +
      '</div>' +
      (multi
        ? '<button type="button" class="fides-carousel-nav fides-carousel-nav-edge fides-carousel-prev" data-carousel-prev aria-label="Previous slide">' + icons.chevronLeft + '</button>' +
          '<button type="button" class="fides-carousel-nav fides-carousel-nav-edge fides-carousel-next" data-carousel-next aria-label="Next slide">' + icons.chevronRight + '</button>' +
          '<span class="fides-carousel-counter-overlay" data-carousel-counter>1 / ' + slides.length + '</span>'
        : '') +
      '</div>' +
      renderModalMediaThumbsHtml(slides, 'modal') +
      '</div>' +
      '</div>';
  }

  function activateCarouselSlideMedia(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-video-embed-src]').forEach(function(frame) {
      const src = frame.getAttribute('data-video-embed-src');
      if (!src || frame.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = frame.getAttribute('data-video-title') || 'Demo video';
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      frame.appendChild(iframe);
    });
  }

  function deactivateCarouselSlideMedia(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-video-embed-src]').forEach(function(frame) {
      const iframe = frame.querySelector('iframe');
      if (iframe) iframe.remove();
    });
  }

  function bindModalMediaCarousel(carousel, options) {
    const opts = options || {};
    const slideEls = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    if (!slideEls.length) return null;

    const track = carousel.querySelector('[data-carousel-track]');
    const counter = carousel.querySelector('[data-carousel-counter]');
    const thumbButtons = Array.from(carousel.querySelectorAll('[data-thumb-index]'));
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    let index = Math.min(Math.max(opts.startIndex || 0, 0), slideEls.length - 1);

    function applyIndex(skipActivate) {
      slideEls.forEach(function(slide, slideIndex) {
        const isActive = slideIndex === index;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      thumbButtons.forEach(function(btn) {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-thumb-index')) === index);
      });
      if (track) track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (counter) counter.textContent = (index + 1) + ' / ' + slideEls.length;
      if (!skipActivate) {
        slideEls.forEach(function(slide, slideIndex) {
          if (slideIndex !== index) deactivateCarouselSlideMedia(slide);
        });
        activateCarouselSlideMedia(slideEls[index]);
      }
    }

    function goTo(nextIndex) {
      index = (nextIndex + slideEls.length) % slideEls.length;
      applyIndex(false);
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(index + 1); });
    thumbButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const thumbIndex = Number(btn.getAttribute('data-thumb-index'));
        if (Number.isFinite(thumbIndex)) goTo(thumbIndex);
      });
    });
    carousel.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      }
    });

    applyIndex(false);
    return { goTo: goTo, current: function() { return index; } };
  }

  function onMediaLightboxKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeMediaLightbox();
    }
  }

  function closeMediaLightbox() {
    const existing = document.getElementById('fides-media-lightbox');
    if (!existing) return;
    existing.querySelectorAll('[data-carousel-slide]').forEach(function(slide) {
      deactivateCarouselSlideMedia(slide);
    });
    existing.remove();
    document.removeEventListener('keydown', onMediaLightboxKeydown);
  }

  function openMediaLightbox(startIndex) {
    const slides = currentModalMediaSlides;
    if (!slides || !slides.length) return;
    closeMediaLightbox();

    const multi = slides.length > 1;
    const html = '<div class="fides-media-lightbox" id="fides-media-lightbox" role="dialog" aria-modal="true" aria-label="Media viewer">' +
      '<button type="button" class="fides-media-lightbox-close" data-lightbox-close aria-label="Close viewer">' + icons.xLarge + '</button>' +
      '<div class="fides-media-lightbox-stage">' +
      '<div class="fides-use-case-modal-carousel fides-media-lightbox-carousel" tabindex="0">' +
      '<div class="fides-use-case-modal-carousel-viewport">' +
      '<div class="fides-use-case-modal-carousel-track" data-carousel-track style="transform: translateX(0);">' +
      slides.map(function(slide, index) {
        return '<div class="fides-use-case-modal-carousel-slide' + (index === 0 ? ' is-active' : '') + '" data-carousel-slide="' + index + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '">' +
          renderModalMediaSlideHtml(slide) +
          '</div>';
      }).join('') +
      '</div>' +
      (multi
        ? '<button type="button" class="fides-carousel-nav fides-carousel-nav-edge fides-carousel-prev" data-carousel-prev aria-label="Previous slide">' + icons.chevronLeft + '</button>' +
          '<button type="button" class="fides-carousel-nav fides-carousel-nav-edge fides-carousel-next" data-carousel-next aria-label="Next slide">' + icons.chevronRight + '</button>' +
          '<span class="fides-carousel-counter-overlay" data-carousel-counter>1 / ' + slides.length + '</span>'
        : '') +
      '</div>' +
      renderModalMediaThumbsHtml(slides, 'lightbox') +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    const lightbox = document.getElementById('fides-media-lightbox');
    if (!lightbox) return;
    const carousel = lightbox.querySelector('.fides-media-lightbox-carousel');
    if (carousel) bindModalMediaCarousel(carousel, { startIndex: startIndex || 0 });

    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox) closeMediaLightbox();
    });
    const closeBtn = lightbox.querySelector('[data-lightbox-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeMediaLightbox);
    document.addEventListener('keydown', onMediaLightboxKeydown);

    const focusTarget = carousel || closeBtn;
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
  }

  function initModalMediaCarousels() {
    const overlay = document.getElementById('fides-modal-overlay');
    if (!overlay) return;
    overlay.querySelectorAll('.fides-use-case-modal-carousel').forEach(function(carousel) {
      bindModalMediaCarousel(carousel, { startIndex: 0 });
    });
    overlay.querySelectorAll('[data-media-expand]').forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        event.stopPropagation();
        const idx = Number(btn.getAttribute('data-media-expand'));
        openMediaLightbox(Number.isFinite(idx) ? idx : 0);
      });
    });
  }

  function buildWalletHeroSectionHtml(wallet, options) {
    const description = wallet && wallet.description ? String(wallet.description).trim() : '';
    let mediaHtml = '';
    if (walletListingTierIsPro(wallet, options)) {
      const slides = buildWalletModalMediaSlides(wallet);
      if (slides.length) mediaHtml = renderModalMediaCarouselHtml(slides, 'Wallet media');
    }
    if (!description && !mediaHtml) return '';
    const layoutClass = mediaHtml ? 'fides-use-case-modal-hero has-media' : 'fides-use-case-modal-hero';
    return '<section class="' + layoutClass + '">' +
      (description ? '<div class="fides-use-case-modal-copy"><p class="fides-modal-description">' + escapeHtml(description) + '</p></div>' : '') +
      mediaHtml +
      '</section>';
  }

  function buildOrganizationHeroSectionHtml(org, options) {
    const description = org && org.description ? String(org.description).trim() : '';
    let mediaHtml = '';
    if (walletListingTierIsPro(org, options)) {
      const slides = buildWalletModalMediaSlides(org);
      if (slides.length) mediaHtml = renderModalMediaCarouselHtml(slides, 'Organization media');
    }
    if (!description && !mediaHtml) return '';
    const layoutClass = mediaHtml ? 'fides-use-case-modal-hero has-media' : 'fides-use-case-modal-hero';
    return '<section class="' + layoutClass + '">' +
      (description ? '<div class="fides-use-case-modal-copy"><p class="fides-modal-description">' + escapeHtml(description) + '</p></div>' : '') +
      mediaHtml +
      '</section>';
  }

  function buildWalletPricingBodyHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    if (walletIsPersonal(wallet)) return '';
    const text = wallet.pricing ? String(wallet.pricing).trim() : '';
    if (!text) {
      return '<p class="fides-accordion-body-text fides-accordion-body-text--muted">No pricing information provided.</p>';
    }
    return '<p class="fides-accordion-body-text">' + escapeHtml(text) + '</p>';
  }

  function renderWalletRecognitionListItemHtml(item) {
    const title = escapeHtml(String(item.title || '').trim());
    const url = item.url ? String(item.url).trim() : '';
    if (!title) return '';
    if (url) {
      return '<li class="fides-recognition-item">' +
        '<span class="fides-recognition-item-title">' + title + '</span>' +
        '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="fides-modal-link-inline fides-recognition-item-link" data-matomo-name="Recognition link">' +
        'Learn more ' + icons.externalLinkSmall + '</a></li>';
    }
    return '<li class="fides-recognition-item"><span class="fides-recognition-item-title">' + title + '</span></li>';
  }

  function buildWalletRecognitionsBodyHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    const sections = [
      { key: 'customerStories', title: 'Customer stories' },
      { key: 'awardsAndRecognitions', title: 'Awards & recognitions' },
    ];
    let html = '';
    sections.forEach(function(section) {
      const items = walletRecognitionItems(wallet, section.key);
      if (!items.length) return;
      html += '<div class="fides-recognitions-section" data-section="' + escapeHtml(section.key) + '">' +
        '<div class="fides-recognitions-section-title">' + escapeHtml(section.title) + '</div>' +
        '<ul class="fides-recognitions-list">' +
        items.map(renderWalletRecognitionListItemHtml).filter(Boolean).join('') +
        '</ul></div>';
    });
    return html;
  }

  function buildWalletCertificationsBodyHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    const items = walletRecognitionItems(wallet, 'certifications');
    if (!items.length) return '';
    return '<ul class="fides-recognitions-list">' +
      items.map(renderWalletRecognitionListItemHtml).filter(Boolean).join('') +
      '</ul>';
  }

  function buildWalletFeaturesBodyHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    if (!wallet.features || !wallet.features.length) return '';
    return '<ul class="fides-features-list">' + wallet.features.map(function(f) {
      return '<li>' + icons.check + ' ' + escapeHtml(f) + '</li>';
    }).join('') + '</ul>';
  }

  function walletFeaturesCount(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return 0;
    return wallet.features && wallet.features.length ? wallet.features.length : 0;
  }

  function walletRecognitionsCount(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return 0;
    return ['customerStories', 'awardsAndRecognitions'].reduce(function(sum, key) {
      return sum + walletRecognitionItems(wallet, key).length;
    }, 0);
  }

  function walletCertificationsCount(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return 0;
    return walletRecognitionItems(wallet, 'certifications').length;
  }

  function renderTechnicalKvRow(label, valueHtml) {
    if (!valueHtml) return '';
    return '<div class="fides-kv-row">' +
      '<span class="fides-kv-key">' + escapeHtml(label) + '</span>' +
      '<span class="fides-kv-val">' + valueHtml + '</span>' +
      '</div>';
  }

  function renderTechnicalKvRowText(label, values, labelFn, vocabulary, vocabGroupKey) {
    if (!values || !values.length) return '';
    const items = values.map(function(v) {
      const display = String(labelFn ? labelFn(v) : v);
      const match = vocabulary && vocabGroupKey ? walletVocabEntry(vocabulary, vocabGroupKey, v) : null;
      if (match) {
        return '<button type="button" class="fides-kv-glossary-link" data-vocab-key="' +
          escapeHtml(match.key) + '" aria-label="Definition: ' + escapeHtml(display) + '">' +
          escapeHtml(display) + '</button>';
      }
      return escapeHtml(display);
    });
    const valueHtml = items.map(function(item, index) {
      const comma = index < items.length - 1 ? ',' : '';
      return '<span class="fides-kv-val-item">' + item + comma + '</span>';
    }).join('');
    return renderTechnicalKvRow(label, valueHtml);
  }

  function renderPlatformKvValue(wallet, platformLabelsOnly) {
    if (!wallet.platforms || !wallet.platforms.length) return '';
    return wallet.platforms.map(function(p) {
      const link = platformLabelsOnly ? null : getAppStoreLink(wallet, p);
      if (link) {
        return '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" class="fides-modal-link-inline">' +
          escapeHtml(p) + ' ' + icons.externalLinkSmall + '</a>';
      }
      return escapeHtml(p);
    }).join(', ');
  }

  function buildTechnicalKvSection(title, sectionKey, rows) {
    const body = rows.filter(Boolean).join('');
    if (!body) return '';
    const keyAttr = sectionKey ? ' data-section="' + escapeHtml(sectionKey) + '"' : '';
    return '<div class="fides-kv-section"' + keyAttr + '>' +
      '<div class="fides-kv-section-title">' + escapeHtml(title) + '</div>' +
      '<div class="fides-details-kv fides-details-kv--technical-grid">' + body + '</div>' +
      '</div>';
  }

  function buildWalletTechnicalKvHtml(wallet, platformLabelsOnly, standardsList, vocabulary) {
    const issuanceProtocols = wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || [];
    const presentationProtocols = wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || [];
    const identifiers = (wallet.supportedIdentifiers || wallet.didMethods) || [];

    const credentialsAndProtocols = buildTechnicalKvSection('Formats & protocols', 'compatibility', [
      renderTechnicalKvRowText('VC formats', sortCredentialFormats(wallet.vcFormat || []), credentialFormatDisplayLabel, vocabulary, 'vcFormat'),
      renderTechnicalKvRowText('Issuance protocols', issuanceProtocols, null, vocabulary, 'issuanceProtocol'),
      renderTechnicalKvRowText('Presentation protocols', presentationProtocols, null, vocabulary, 'presentationProtocol'),
      renderTechnicalKvRowText('Interop profiles', wallet.interoperabilityProfiles || [], null, vocabulary, 'interopProfile'),
    ]);

    const cryptography = buildTechnicalKvSection('Keys & identifiers', 'cryptography', [
      renderTechnicalKvRowText('Identifiers', identifiers, null, vocabulary, 'identifiers'),
      renderTechnicalKvRowText('Key storage', wallet.keyStorage || [], null, vocabulary, 'keyStorage'),
      renderTechnicalKvRowText('Signing algorithms', wallet.signingAlgorithms || [], null, vocabulary, 'signingAlgorithm'),
      renderTechnicalKvRowText('Credential status', wallet.credentialStatusMethods || [], null, vocabulary, 'credentialStatus'),
    ]);

    const deploymentChecks = renderWalletDeploymentChecksHtml(wallet);
    const operations = buildTechnicalKvSection('Product & deployment', 'operations', [
      deploymentChecks ? renderTechnicalKvRow('Deployment', deploymentChecks) : '',
      renderTechnicalKvRow('Status', escapeHtml(walletStatusDisplay(wallet))),
      renderTechnicalKvRow('License', escapeHtml(walletLicenseKvDisplay(wallet))),
      renderTechnicalKvRowText('Standards', standardsList, null),
      wallet.slaAvailable ? renderTechnicalKvRow('SLA', 'Available') : '',
    ]);

    const keyCapabilities = buildWalletKeyCapabilitiesKvSection(wallet);
    const eidasTrustServices = buildWalletEidasTrustServicesKvSection(wallet, vocabulary);
    return [keyCapabilities, operations, credentialsAndProtocols, cryptography, eidasTrustServices].filter(Boolean).join('');
  }

  function renderModalAccordion(id, title, iconSvg, bodyHtml, isOpen, count) {
    if (!bodyHtml) return '';
    const expanded = isOpen ? 'true' : 'false';
    const openClass = isOpen ? ' is-open' : '';
    const toggleLabel = 'Toggle ' + title + ' section';
    const countNum = typeof count === 'number' && count > 0 ? count : 0;
    const countHtml = countNum > 0 ? ' <span class="fides-accordion-count">' + countNum + '</span>' : '';
    return '<div class="fides-accordion' + openClass + '" id="' + escapeHtml(id) + '">' +
      '<div class="fides-accordion-header-bar">' +
      '<button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="' + expanded + '">' +
      '<span class="fides-accordion-title">' + iconSvg + ' ' + escapeHtml(title) + countHtml + '</span>' +
      '</button>' +
      '<button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="' + expanded + '" aria-label="' + escapeHtml(toggleLabel) + '">' +
      '<span class="fides-accordion-chevron">' + icons.chevronDown + '</span>' +
      '</button>' +
      '</div>' +
      '<div class="fides-accordion-body">' + bodyHtml + '</div>' +
      '</div>';
  }

  function buildWalletAccordionsHtml(wallet, options, platformLabelsOnly, standardsList) {
    const vocabulary = options && options.vocabulary;
    const technicalKv = buildWalletTechnicalKvHtml(wallet, platformLabelsOnly, standardsList, vocabulary);
    const recognitionsBody = buildWalletRecognitionsBodyHtml(wallet, options);
    const additionalProductBody = buildWalletAdditionalProductInfoBodyHtml(wallet, options);
    const certificationsBody = buildWalletCertificationsBodyHtml(wallet, options);
    const pricingBody = buildWalletPricingBodyHtml(wallet, options);
    const accordions = [
      renderModalAccordion(
        'fides-accordion-wallet-technical',
        'Specifications',
        icons.fileCheck,
        technicalKv ? '<div class="fides-wallet-technical-specs">' + technicalKv + '</div>' : '',
        false
      ),
      renderModalAccordion(
        'fides-accordion-wallet-features',
        'Features',
        icons.check,
        buildWalletFeaturesBodyHtml(wallet, options),
        false,
        walletFeaturesCount(wallet, options)
      ),
      renderModalAccordion(
        'fides-accordion-wallet-certifications',
        'Certifications & Conformity',
        icons.shield,
        certificationsBody ? '<div class="fides-modal-recognitions fides-modal-recognitions--accordion">' + certificationsBody + '</div>' : '',
        false,
        walletCertificationsCount(wallet, options)
      ),
      renderModalAccordion(
        'fides-accordion-wallet-recognitions',
        'Recognitions',
        icons.shield,
        recognitionsBody ? '<div class="fides-modal-recognitions fides-modal-recognitions--accordion">' + recognitionsBody + '</div>' : '',
        false,
        walletRecognitionsCount(wallet, options)
      ),
      renderModalAccordion(
        'fides-accordion-wallet-additional-product',
        'Additional Product Information',
        icons.book,
        additionalProductBody,
        false,
        walletAdditionalProductInfoCount(wallet, options)
      ),
      renderModalAccordion(
        'fides-accordion-wallet-pricing',
        'Pricing',
        icons.tag,
        pricingBody,
        false
      ),
    ].filter(Boolean).join('');
    if (!accordions) return '';
    return '<div class="fides-use-case-modal-accordions">' + accordions + '</div>';
  }

  function initModalAccordions() {
    document.querySelectorAll('#fides-modal-overlay .fides-accordion-toggle[type="button"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const accordion = btn.closest('.fides-accordion');
        if (!accordion) return;
        const isOpen = accordion.classList.toggle('is-open');
        accordion.querySelectorAll('.fides-accordion-toggle[type="button"]').forEach(function(toggle) {
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      });
    });
  }

  /**
   * Matomo: track event (if _paq loaded, respects DoNotTrack).
   */
  function trackMatomoEvent(category, action, name, value) {
    if (typeof window._paq === 'undefined') return;
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') return;
    try {
      window._paq.push(['trackEvent', category, action, name, value]);
    } catch (e) {
      console.debug('Matomo tracking failed:', e);
    }
  }

  /** Default class-to-name map for link tracking (used by initMatomoLinkTracking). */
  var DEFAULT_LINK_CLASS_TO_NAME = [
    { classes: 'fides-show-on-map', name: 'Show on map' },
    { classes: 'fides-rp-visit-button', name: 'Visit website' },
    { classes: 'fides-modal-visit-button', name: 'Visit website' },
    { classes: 'fides-modal-provider-link', name: 'Blue Pages' },
    { classes: 'fides-modal-provider-value', name: 'Provider website' },
    { classes: 'fides-modal-link-inline', name: 'Organization catalog' },
    { classes: 'wallet-link', name: 'Wallet catalog' },
    { classes: 'credential-catalog-link', name: 'Credential catalog' },
    { classes: 'fides-wallet-link', name: 'Repository' },
    { classes: 'fides-tag platform clickable', name: 'Platform' }
  ];

  /**
   * Initialize document-level link click tracking for Matomo.
   * Call once per app with { category, containerSelector, modalOverlayId }.
   * Links with data-matomo-name or matching known classes are tracked as "Link Click".
   */
  function initMatomoLinkTracking(config) {
    if (!config || !config.category) return;
    var containerSelector = config.containerSelector || null;
    var modalOverlayId = config.modalOverlayId || 'fides-modal-overlay';
    var classToName = config.classToName || DEFAULT_LINK_CLASS_TO_NAME;

    document.addEventListener('click', function matomoLinkClick(e) {
      var a = e.target.closest('a');
      if (!a || !a.href) return;
      var inCatalog = containerSelector && document.querySelector(containerSelector) && document.querySelector(containerSelector).contains(a);
      var overlay = document.getElementById(modalOverlayId);
      var inModal = overlay && overlay.contains(a);
      if (!inCatalog && !inModal) return;
      var name = a.dataset.matomoName;
      if (!name && classToName.length) {
        for (var i = 0; i < classToName.length; i++) {
          var entry = classToName[i];
          var classes = entry.classes.split(/\s+/);
          if (classes.every(function(c) { return c && a.classList.contains(c); })) {
            name = entry.name;
            break;
          }
        }
      }
      if (name) trackMatomoEvent(config.category, 'Link Click', name);
    });
  }

  function showToast(message, type, theme) {
    const toast = document.createElement('div');
    toast.className = 'fides-toast';
    toast.setAttribute('data-theme', theme || 'dark');
    toast.innerHTML = '<div class="fides-toast-icon">' + (type === 'success' ? icons.check : icons.x) + '</div><div class="fides-toast-message">' + escapeHtml(message) + '</div>';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fides-toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function closeNestedVocabularyModal() {
    const nested = document.getElementById('fides-nested-vocab-overlay');
    if (!nested) return;
    nested.classList.add('closing');
    setTimeout(function() {
      nested.remove();
    }, 200);
  }

  function closeModal() {
    closeMediaLightbox();
    closeNestedVocabularyModal();
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
        selectedContext = null;
        document.dispatchEvent(new CustomEvent('fides-catalog-modal-closed'));
      }, 200);
    }
  }

  function getDirectLink(contextType, item, options) {
    if (options && options.directLinkUrl) return options.directLinkUrl;
    const url = new URL(window.location.href);
    if (contextType === 'wallet') url.searchParams.set('wallet', item.id);
    if (contextType === 'rp') url.searchParams.set('rp', item.id);
    if (contextType === 'issuer') url.searchParams.set('issuer', item.id);
    if (contextType === 'organization') url.searchParams.set('org', item.id);
    if (contextType === 'vocabulary') url.searchParams.set('term', item.id);
    return url.toString();
  }

  function buildVocabularyUpdateFormUrl(termId, options) {
    const updateFormUrl = (options && options.updateFormUrl) ? String(options.updateFormUrl).trim() : '';
    const isLoggedIn = boolFromMixed(
      options && (options.isLoggedIn != null ? options.isLoggedIn : options.ratingsIsLoggedIn)
    );
    if (!isLoggedIn || !updateFormUrl || !termId) return '';
    try {
      const url = new URL(updateFormUrl, window.location.origin);
      url.searchParams.set('term', String(termId));
      return url.toString();
    } catch (e) {
      return '';
    }
  }

  function buildVocabularyEditActionHtml(term, options) {
    const href = buildVocabularyUpdateFormUrl(term && term.id, options);
    if (!href) return '';
    return '<a href="' + escapeHtml(href) + '" class="fides-modal-copy-link fides-modal-edit-link" aria-label="Suggest an update" title="Suggest an update">' + icons.pencil + '</a>';
  }

  function buildLoginUrlWithReturnTo(loginUrl, returnToUrl) {
    const base = String(loginUrl || '').trim();
    const returnTo = String(returnToUrl || '').trim();
    if (!base) return '';
    if (!returnTo) return base;
    try {
      const u = new URL(base, window.location.origin);
      u.searchParams.set('return_to', returnTo);
      return u.toString();
    } catch (e) {
      const sep = base.indexOf('?') === -1 ? '?' : '&';
      return base + sep + 'return_to=' + encodeURIComponent(returnTo);
    }
  }

  function copySelectedLink() {
    if (!selectedContext) return;
    const url = getDirectLink(selectedContext.type, selectedContext.item, selectedContext.options || {});
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard', 'success', selectedContext.theme);
      }).catch(() => {
        showToast('Failed to copy link', 'error', selectedContext.theme);
      });
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    showToast(success ? 'Link copied to clipboard' : 'Failed to copy link', success ? 'success' : 'error', selectedContext.theme);
  }

  function attachModalListeners() {
    const overlay = document.getElementById('fides-modal-overlay');
    if (!overlay) return;
    const closeBtn = document.getElementById('fides-modal-close');
    const copyBtn = document.getElementById('fides-modal-copy-link');
    if (copyBtn) copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copySelectedLink();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('fides-media-lightbox')) {
          closeMediaLightbox();
          return;
        }
        if (document.getElementById('fides-nested-vocab-overlay')) {
          closeNestedVocabularyModal();
          return;
        }
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function attachNestedVocabularyListeners() {
    const nested = document.getElementById('fides-nested-vocab-overlay');
    if (!nested) return;
    const closeBtn = nested.querySelector('.fides-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeNestedVocabularyModal();
      });
    }
    nested.addEventListener('click', function(e) {
      if (e.target === nested) closeNestedVocabularyModal();
    });
  }

  function initWalletTechnicalGlossaryLinks(options) {
    const overlay = document.getElementById('fides-modal-overlay');
    const vocabulary = options && options.vocabulary;
    if (!overlay || !vocabulary) return;
    overlay.querySelectorAll('.fides-kv-glossary-link').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.getAttribute('data-vocab-key');
        if (!key) return;
        const entry = vocabulary[key];
        if (!entry || !entry.description) return;
        const term = {
          id: key,
          name: (btn.textContent || '').trim() || key,
          description: entry.description,
          url: entry.url || '',
          aliases: entry.aliases || []
        };
        const nestedOptions = Object.assign({}, options || {}, { nested: true, showShare: false });
        openVocabularyModal(term, nestedOptions);
      });
    });
  }

  function mountModal(html) {
    closeModal();
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    attachModalListeners();
  }

  function boolFromMixed(value) {
    if (value === true || value === 1 || value === '1') return true;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === 'yes' || v === 'on';
    }
    return false;
  }

  function getRatingsClient(options) {
    const ratings = (options && options.ratings) || {};
    const apiBase = (ratings.apiBase || options && options.ratingsApiBase || '').trim().replace(/\/$/, '');
    const nonce = String(ratings.nonce || options && options.ratingsNonce || '').trim();
    const loginUrl = String(ratings.loginUrl || options && options.ratingsLoginUrl || options && options.loginUrl || '').trim();
    return {
      apiBase: apiBase,
      nonce: nonce,
      loginUrl: loginUrl,
      isLoggedIn: boolFromMixed(ratings.isLoggedIn != null ? ratings.isLoggedIn : (options && options.ratingsIsLoggedIn))
    };
  }

  function buildRatingsEndpoint(client, path, queryParams) {
    const safePath = String(path || '').replace(/^\/+/, '');
    const rawBase = String(client && client.apiBase ? client.apiBase : '').trim();
    if (!rawBase) return '';
    try {
      const url = new URL(rawBase, window.location.origin);
      if (url.origin !== window.location.origin) {
        url.protocol = window.location.protocol;
        url.host = window.location.host;
      }
      if (url.searchParams.has('rest_route')) {
        const currentRoute = String(url.searchParams.get('rest_route') || '').replace(/\/+$/, '');
        url.searchParams.set('rest_route', currentRoute + '/' + safePath);
      } else {
        const basePath = url.pathname.replace(/\/+$/, '');
        url.pathname = basePath + '/' + safePath;
      }
      if (queryParams && typeof queryParams === 'object') {
        Object.keys(queryParams).forEach(function(key) {
          const value = queryParams[key];
          if (value === null || value === undefined || value === '') return;
          url.searchParams.set(key, String(value));
        });
      }
      return url.toString();
    } catch (e) {
      return '';
    }
  }

  function formatLikeCount(count) {
    const n = Number(count) || 0;
    if (n <= 0) return 'No likes yet';
    return n + ' like' + (n === 1 ? '' : 's');
  }

  async function fetchRatingSummary(client, contextType, itemId) {
    const url = buildRatingsEndpoint(client, 'ratings/batch', {
      type: String(contextType || '').trim(),
      ids: String(itemId || '').slice(0, 512),
      _wpnonce: client.nonce || ''
    });
    if (!url) throw new Error('ratings_url_invalid');
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-WP-Nonce': client.nonce || ''
      }
    });
    if (!res.ok) throw new Error('ratings_batch_failed');
    const data = await res.json();
    const result = data && data.results && data.results[itemId] ? data.results[itemId] : { avg: 0, count: 0, likes: 0, my_rating: null, my_like: null };
    const likeCount = Number(result.likes);
    return {
      avg: Number(result.avg) || 0,
      count: isFinite(likeCount) ? likeCount : (Number(result.count) || 0),
      myRating: Number(result.my_like) > 0 || Number(result.my_rating) > 0 ? 1 : null
    };
  }

  async function submitRating(client, contextType, itemId) {
    const url = buildRatingsEndpoint(client, 'ratings', {
      _wpnonce: client.nonce || ''
    });
    if (!url) throw new Error('ratings_url_invalid');
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': client.nonce || ''
      },
      body: JSON.stringify({
        type: contextType,
        item_id: itemId,
        rating: 1
      })
    });
    let payload = null;
    try {
      payload = await res.json();
    } catch (e) {
      payload = null;
    }
    if (!res.ok) {
      const reason = payload && (payload.error || payload.code || payload.message);
      throw new Error(reason || 'like_submit_failed');
    }
    return payload || {};
  }

  async function deleteRating(client, contextType, itemId) {
    const url = buildRatingsEndpoint(client, 'ratings', {
      _wpnonce: client.nonce || '',
      type: contextType,
      item_id: itemId
    });
    if (!url) throw new Error('ratings_url_invalid');
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'X-WP-Nonce': client.nonce || ''
      }
    });
    let payload = null;
    try {
      payload = await res.json();
    } catch (e) {
      payload = null;
    }
    if (!res.ok) {
      const reason = payload && (payload.error || payload.code || payload.message);
      throw new Error(reason || 'like_delete_failed');
    }
    return payload || {};
  }

  function renderRatingSlot(slot, state, client) {
    if (!slot) return;
    const summaryLabel = formatLikeCount(state.count);
    const isStarred = state.myRating === 1;
    const starButton = client.isLoggedIn
      ? '<button type="button" class="fides-rating-star fides-rating-star-single' + (isStarred ? ' is-filled' : '') + '" data-rating-toggle="1" ' + (state.saving ? 'disabled' : '') + ' aria-label="' + (isStarred ? 'Remove your like' : 'Like this item') + '">★</button>'
      : '<button type="button" class="fides-rating-star fides-rating-star-single is-readonly' + (isStarred ? ' is-filled' : '') + '" disabled aria-hidden="true">★</button>';
    const actionLine = client.isLoggedIn
      ? '<span class="fides-modal-rating-note fides-modal-rating-note-inline">' + (state.saving ? 'Updating like...' : (isStarred ? 'You like this item. Click again to remove.' : 'Click the star to like this item.')) + '</span>'
      : (client.loginUrl
          ? '<span class="fides-modal-rating-note fides-modal-rating-note-inline"><a href="' + escapeHtml(client.loginUrl) + '" class="fides-modal-rating-login">Sign in to like</a></span>'
          : '<span class="fides-modal-rating-note fides-modal-rating-note-inline">Sign in to like</span>');
    slot.innerHTML =
      '<div class="fides-modal-rating">' +
        '<div class="fides-modal-rating-summary">' +
          starButton +
          '<span class="fides-modal-rating-value">' + escapeHtml(summaryLabel) + '</span>' +
          actionLine +
        '</div>' +
      '</div>';
  }

  async function attachModalRating(overlay, contextType, itemId, options, item) {
    if (!overlay) return;
    const slot = overlay.querySelector('#fides-modal-rating-slot');
    if (!slot) return;
    const client = getRatingsClient(options || {});
    const deepLinkUrl = getDirectLink(contextType, item || { id: itemId }, options || {});
    const clientForUi = Object.assign({}, client, {
      loginUrl: buildLoginUrlWithReturnTo(client.loginUrl, deepLinkUrl)
    });
    if (!client.apiBase || !contextType || !itemId) {
      slot.innerHTML = '';
      return;
    }
    let state = { avg: 0, count: 0, myRating: null, saving: false };
    renderRatingSlot(slot, state, clientForUi);
    try {
      state = Object.assign(state, await fetchRatingSummary(client, contextType, itemId));
      renderRatingSlot(slot, state, clientForUi);
    } catch (e) {
      state = Object.assign(state, { avg: 0, count: 0, myRating: null });
      renderRatingSlot(slot, state, clientForUi);
    }
    if (!client.isLoggedIn) return;
    slot.addEventListener('click', async function(e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-rating-toggle]') : null;
      if (!btn) return;
      if (state.saving) return;
      const previousState = {
        avg: state.avg,
        count: state.count,
        myRating: state.myRating
      };
      const removing = state.myRating === 1;
      state = Object.assign(state, {
        saving: true,
        myRating: removing ? null : 1
      });
      renderRatingSlot(slot, state, clientForUi);
      try {
        const data = removing
          ? await deleteRating(client, contextType, itemId)
          : await submitRating(client, contextType, itemId);
        const summary = data && data.summary ? data.summary : {};
        state = {
          avg: Number(summary.avg) || 0,
          count: Number(summary.likes) || Number(summary.count) || 0,
          myRating: Number(data && data.my_like) > 0 || Number(data && data.my_rating) > 0 ? 1 : null,
          saving: false
        };
        renderRatingSlot(slot, state, clientForUi);
        if (options && typeof options.onRatingUpdate === 'function') {
          options.onRatingUpdate({
            type: contextType,
            itemId: itemId,
            avg: state.avg,
            count: state.count,
            myRating: state.myRating
          });
        }
      } catch (err) {
        state = Object.assign(state, {
          avg: previousState.avg,
          count: previousState.count,
          myRating: previousState.myRating,
          saving: false
        });
        renderRatingSlot(slot, state, clientForUi);
        const reason = (err && err.message) ? String(err.message) : 'save_failed';
        showToast('Failed to update like (' + reason + ')', 'error', (options && options.theme) || 'dark');
      }
    });
  }

  function buildWalletUpdateFormUrl(walletId, options) {
    const updateFormUrl = (options && options.updateFormUrl) ? String(options.updateFormUrl).trim() : '';
    const isLoggedIn = boolFromMixed(
      options && (options.isLoggedIn != null ? options.isLoggedIn : options.ratingsIsLoggedIn)
    );
    if (!isLoggedIn || !updateFormUrl || !walletId) return '';
    try {
      const url = new URL(updateFormUrl, window.location.origin);
      url.searchParams.set('wallet', String(walletId));
      return url.toString();
    } catch (e) {
      return '';
    }
  }

  function buildWalletEditActionHtml(wallet, options) {
    if (!canEditWallet(wallet, options)) return '';
    const href = buildWalletUpdateFormUrl(wallet && wallet.id, options);
    if (!href) return '';
    return '<a href="' + escapeHtml(href) + '" class="fides-modal-copy-link fides-modal-edit-link" aria-label="Suggest an update" title="Suggest an update">' + icons.pencil + '</a>';
  }

  function normalizeWalletLinkKey(href) {
    const raw = String(href || '').trim();
    if (!raw) return '';
    try {
      const u = new URL(raw);
      if (u.protocol === 'mailto:') {
        return ('mailto:' + decodeURIComponent(u.pathname || u.href.replace(/^mailto:/i, ''))).toLowerCase();
      }
      const path = u.pathname.replace(/\/$/, '') || '/';
      return (u.origin + path + u.search).toLowerCase();
    } catch (e) {
      return raw.toLowerCase().replace(/\/$/, '');
    }
  }

  function buildWalletModalLinkButton(href, label, iconSvg, matomoName, isPrimary) {
    return '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" class="fides-modal-link' +
      (isPrimary ? ' primary' : '') + '" data-matomo-name="' + escapeHtml(matomoName) + '">' +
      iconSvg + ' ' + escapeHtml(label) + '</a>';
  }

  function buildWalletModalLinksGroupHtml(sectionLabel, linkEntries, groupOptions) {
    if (!linkEntries.length) return '';
    const noPrimary = !!(groupOptions && groupOptions.noPrimary);
    const buttons = linkEntries.map(function(entry, index) {
      const isPrimary = !noPrimary && index === 0;
      if (entry.type === 'mailto') {
        return '<a href="mailto:' + escapeHtml(entry.href) + '" class="fides-modal-link' +
          (isPrimary ? ' primary' : '') + '" data-matomo-name="' + escapeHtml(entry.matomoName) + '">' +
          entry.icon + ' ' + escapeHtml(entry.label) + '</a>';
      }
      if (entry.type === 'internal') {
        return '<a href="' + escapeHtml(entry.href) + '" class="fides-modal-link' +
          (isPrimary ? ' primary' : '') + '" data-matomo-name="' + escapeHtml(entry.matomoName) +
          '" onclick="event.stopPropagation();">' + entry.icon + ' ' + escapeHtml(entry.label) + '</a>';
      }
      return buildWalletModalLinkButton(entry.href, entry.label, entry.icon, entry.matomoName, isPrimary);
    }).join('');
    return '<div class="fides-modal-links-group">' +
      '<div class="fides-modal-links-label">' + escapeHtml(sectionLabel) + '</div>' +
      '<div class="fides-modal-links">' + buttons + '</div></div>';
  }

  function resolveOrganizationContactEmail(contact) {
    const contactObj = contact && typeof contact === 'object' ? contact : {};
    const email = contactObj.email ? String(contactObj.email).trim() : '';
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return email;
    }
    const legacyUrl = contactObj.contactUrl ? String(contactObj.contactUrl).trim() : '';
    if (legacyUrl.toLowerCase().startsWith('mailto:')) {
      const legacyEmail = legacyUrl.slice(7).split('?')[0].trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(legacyEmail)) {
        return legacyEmail;
      }
    }
    return '';
  }

  function buildOrganizationContactFooterHtml(contact, options) {
    if (options && options.tierUiEnabled === true && options.isCommunity === true) return '';
    const contactObj = contact && typeof contact === 'object' ? contact : {};
    const bookMeetingUrl = contactObj.bookMeetingUrl ? String(contactObj.bookMeetingUrl).trim() : '';
    const email = resolveOrganizationContactEmail(contactObj);
    const buttons = [];
    if (email) {
      buttons.push(
        '<a href="mailto:' + escapeHtml(email) + '" class="fides-modal-footer-btn fides-modal-footer-btn--accent" data-matomo-name="Contact">' +
        icons.mail + ' Contact</a>'
      );
    }
    if (bookMeetingUrl) {
      buttons.push(
        '<a href="' + escapeHtml(bookMeetingUrl) + '" target="_blank" rel="noopener noreferrer" class="fides-modal-footer-btn" data-matomo-name="Book a Meeting">' +
        icons.externalLink + ' Book a Meeting</a>'
      );
    }
    if (!buttons.length) return '';
    return '<div class="fides-modal-footer">' + buttons.join('') + '</div>';
  }

  function buildWalletModalFooterHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    const provider = wallet.provider && typeof wallet.provider === 'object' ? wallet.provider : {};
    const contact = provider.contact && typeof provider.contact === 'object' ? provider.contact : {};
    return buildOrganizationContactFooterHtml(contact, { tierUiEnabled: optionsTierUiEnabled(options) });
  }

  function buildWalletModalLinksHtml(wallet, options) {
    if (!walletListingTierIsPro(wallet, options)) return '';
    const productSeen = new Set();
    const productEntries = [];
    const appLinks = wallet.appStoreLinks && typeof wallet.appStoreLinks === 'object' ? wallet.appStoreLinks : {};

    function rememberHttp(href, seenSet) {
      const url = String(href || '').trim();
      if (!url) return '';
      const key = normalizeWalletLinkKey(url);
      if (!key || seenSet.has(key)) return '';
      seenSet.add(key);
      return url;
    }

    function pushProduct(href, label, icon, matomoName) {
      const url = rememberHttp(href, productSeen);
      if (!url) return;
      productEntries.push({ type: 'http', href: url, label: label, icon: icon, matomoName: matomoName });
    }

    if (!walletIsPersonal(wallet)) {
      pushProduct(appLinks.iOS || appLinks.ios, 'App Store', icons.smartphone, 'App Store');
      pushProduct(appLinks.android, 'Google Play', icons.smartphone, 'Google Play');
    }

    const productHtml = buildWalletModalLinksGroupHtml('Product', productEntries);
    if (!productHtml) return '';
    return '<div class="fides-modal-links-sections">' + productHtml + '</div>';
  }

  function openWalletModal(wallet, options) {
    if (!wallet) return;
    const theme = (options && options.theme) || 'dark';
    const tierUi = optionsTierUiEnabled(options);
    const platformLabelsOnly = tierUi && !walletListingTierIsPro(wallet, options);
    selectedContext = { type: 'wallet', item: wallet, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(wallet);

    const organizationCatalogUrl = (options && options.organizationCatalogUrl) || 'https://fides.community/ecosystem-explorer/organization-catalog/';
    const effectiveWalletOrgId = (wallet.orgId && String(wallet.orgId).trim()) ||
      (wallet.provider && wallet.provider.orgId && String(wallet.provider.orgId).trim()) || '';
    const orgCatalogHref = getOrganizationCatalogDeepLink(effectiveWalletOrgId, organizationCatalogUrl);
    const providerDisplayName = (wallet.provider && wallet.provider.name) ? String(wallet.provider.name) : 'Unknown';
    const providerNameInHeader = orgCatalogHref && providerDisplayName
      ? '<a href="' + escapeHtml(orgCatalogHref) + '" class="fides-modal-link-inline" aria-label="View organization in organization catalog" title="Organization catalog" onclick="event.stopPropagation();"><span>' + escapeHtml(providerDisplayName) + '</span></a>'
      : escapeHtml(providerDisplayName);
    const bluePagesUrl = getBluePagesUrl(wallet.provider && wallet.provider.did, options);

    const editActionHtml = buildWalletEditActionHtml(wallet, options);
    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';
    const listingHeaderBadge = buildCatalogListingHeaderBadgeHtml(wallet, options);
    const standardsList = walletStandardsList(wallet);
    const capabilitiesHtml = buildWalletCapabilitiesOrAppStoresHtml(wallet, options);
    const heroSectionHtml = buildWalletHeroSectionHtml(wallet, options);
    const accordionsHtml = buildWalletAccordionsHtml(wallet, options, platformLabelsOnly, standardsList);

    const modalHtml = '<div class="fides-modal-overlay fides-modal-overlay--rp" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (wallet.logo ? '<img src="' + escapeHtml(wallet.logo) + '" alt="' + escapeHtml(wallet.name) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.wallet + '</div>') +
      '<div class="fides-modal-title-wrap"><div class="fides-modal-title-row"><h2 class="fides-modal-title">' + escapeHtml(wallet.name) + '</h2>' + listingHeaderBadge + '</div><p class="fides-modal-provider">' + icons.building + ' ' + providerNameInHeader + (bluePagesUrl ? ' <a href="' + escapeHtml(bluePagesUrl) + '" target="_blank" rel="noopener" class="fides-modal-provider-link">' + icons.externalLink + ' View in Blue Pages</a>' : '') + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + editActionHtml + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div id="fides-modal-rating-slot"></div>' +
      heroSectionHtml +
      capabilitiesHtml +
      accordionsHtml +
      buildWalletModalLinksHtml(wallet, options) +
      '</div>' +
      buildWalletModalFooterHtml(wallet, options) +
      '</div></div>';

    mountModal(modalHtml);
    initModalMediaCarousels();
    initModalAccordions();
    initWalletTechnicalGlossaryLinks(options || {});
    const walletOverlay = document.getElementById('fides-modal-overlay');
    if (walletOverlay) attachModalRating(walletOverlay, 'wallet', wallet.id, options || {}, wallet);
  }

  function getBluePagesUrl(did, options) {
    const base = (options && options.bluePagesUrl) || '';
    if (!base || !did) return null;
    return base.replace(/\/$/, '') + '/' + encodeURIComponent(did) + '/';
  }

  /** English labels — keep in sync with fides-rp-catalog assets/rp-catalog.js (SECTOR_LABELS). */
  const RP_SECTOR_LABELS = {
    public_sector: 'Public Sector',
    finance: 'Finance',
    trade: 'Trade',
    supply_chain: 'Supply Chain',
    manufacturing: 'Manufacturing',
    energy: 'Energy',
    agriculture: 'Agriculture',
    food: 'Food',
    retail: 'Retail',
    healthcare: 'Healthcare',
    education: 'Education',
    construction: 'Construction',
    mobility: 'Mobility',
    digital: 'Digital'
  };

  /** Legacy sector strings → canonical code (same as rp-catalog.js LEGACY_SECTOR_TO_CANONICAL). */
  const RP_LEGACY_SECTOR_TO_CANONICAL = {
    government: 'public_sector',
    finance: 'finance',
    healthcare: 'healthcare',
    education: 'education',
    retail: 'retail',
    travel: 'mobility',
    hospitality: 'retail',
    employment: 'digital',
    telecom: 'digital',
    utilities: 'energy',
    insurance: 'finance',
    'real-estate': 'construction',
    automotive: 'mobility',
    entertainment: 'retail',
    other: 'digital'
  };

  function rpCanonicalSectorCode(code) {
    if (!code || typeof code !== 'string') return '';
    if (Object.prototype.hasOwnProperty.call(RP_SECTOR_LABELS, code)) return code;
    return RP_LEGACY_SECTOR_TO_CANONICAL[code] || code;
  }

  function rpSectorDisplayLabel(code) {
    if (!code || typeof code !== 'string') return '';
    const canonical = rpCanonicalSectorCode(code);
    if (Object.prototype.hasOwnProperty.call(RP_SECTOR_LABELS, canonical)) return RP_SECTOR_LABELS[canonical];
    return code.replace(/[-_]+/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
  }

  const INTERACTION_MODE_LABELS = {
    proximity: 'Proximity',
    remote: 'Remote',
    both: 'Both'
  };

  function getRpInteractionMode(rp) {
    const m = rp && rp.interactionMode;
    if (m === 'proximity' || m === 'remote' || m === 'both') return m;
    return 'remote';
  }

  function buildRpSectorsModalGridHtml(rp) {
    const raw = Array.isArray(rp.sectors) ? rp.sectors : [];
    const sectorCodes = raw.filter(function(s) { return typeof s === 'string' && s.length > 0; }).slice().sort(function(a, b) {
      return rpSectorDisplayLabel(a).localeCompare(rpSectorDisplayLabel(b), 'en', { sensitivity: 'base' });
    });
    if (!sectorCodes.length) return '';
    const inner = sectorCodes.map(function(s) {
      return '<span class="fides-tag sector">' + escapeHtml(rpSectorDisplayLabel(s)) + '</span>';
    }).join('');
    return '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.building + ' Sectors</div><div class="fides-modal-grid-value">' + inner + '</div></div>';
  }

  function getCredentialRefCatalogId(ref) {
    if (!ref || typeof ref !== 'object') return null;
    const id = ref.credentialCatalogId != null ? ref.credentialCatalogId : ref.id;
    return typeof id === 'string' && id.indexOf('cred:') === 0 ? id : null;
  }

  function getAcceptedCredentialRows(rp) {
    const labels = Array.isArray(rp.acceptedCredentials) ? rp.acceptedCredentials : [];
    const refs = Array.isArray(rp.acceptedCredentialRefs) ? rp.acceptedCredentialRefs : [];
    const n = Math.max(labels.length, refs.length);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const credentialId = getCredentialRefCatalogId(refs[i]);
      const raw = typeof labels[i] === 'string' ? String(labels[i]).trim() : '';
      let label = raw;
      if (!label && credentialId) {
        const segs = credentialId.split(':');
        const tail = segs.length ? segs[segs.length - 1] : credentialId;
        label = tail.replace(/-/g, ' ');
      }
      if (!label) continue;
      rows.push({ label: label, credentialId: credentialId });
    }
    return rows;
  }

  function getCredentialCatalogDeepLink(credentialId, catalogBase) {
    if (!credentialId || typeof credentialId !== 'string' || credentialId.indexOf('cred:') !== 0) return null;
    const base = (catalogBase || '').trim();
    if (!base) return null;
    try {
      const u = new URL(base);
      u.searchParams.set('credential', credentialId);
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  function getOrganizationCatalogDeepLink(orgId, catalogBase) {
    if (!orgId || typeof orgId !== 'string' || orgId.indexOf('org:') !== 0) return null;
    const base = (catalogBase || '').trim();
    if (!base) return null;
    try {
      const u = new URL(base);
      u.searchParams.set('org', orgId);
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  function renderAcceptedCredentialTagsHtmlForRpModal(rp, catalogBase) {
    const rows = getAcceptedCredentialRows(rp);
    return rows.map(function(row) {
      const href = row.credentialId ? getCredentialCatalogDeepLink(row.credentialId, catalogBase) : null;
      const safe = escapeHtml(row.label);
      if (href) {
        return '<a href="' + escapeHtml(href) + '" class="fides-tag accepted-credential credential-catalog-link">' + icons.externalLink + ' ' + safe + '</a>';
      }
      return '<span class="fides-tag accepted-credential">' + safe + '</span>';
    }).join('');
  }

  function openRpModal(rp, options) {
    if (!rp) return;
    const theme = (options && options.theme) || 'dark';
    selectedContext = { type: 'rp', item: rp, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(rp);

    const readinessLabels = { 'technical-demo': 'Technical Demo', 'use-case-demo': 'Use Case Demo', 'production-pilot': 'Production Pilot', 'production': 'Production' };
    const statusLabels = { development: 'In Development', beta: 'Beta', live: 'Live', deprecated: 'Deprecated' };
    const walletCatalogUrl = (options && options.walletCatalogUrl) || '';
    const credentialCatalogUrl = (options && options.credentialCatalogUrl) || 'https://fides.community/ecosystem-explorer/credential-catalog/';
    const organizationCatalogUrl = (options && options.organizationCatalogUrl) || 'https://fides.community/ecosystem-explorer/organization-catalog/';
    const providerOrgId = String(rp.orgId || '').trim();
    const orgCatalogHref = getOrganizationCatalogDeepLink(providerOrgId, organizationCatalogUrl);
    const providerDisplayName = rp.provider && rp.provider.name ? String(rp.provider.name) : '';
    const providerNameInHeader = orgCatalogHref && providerDisplayName
      ? '<a href="' + escapeHtml(orgCatalogHref) + '" class="fides-modal-link-inline" aria-label="View organization in organization catalog" title="Organization catalog" onclick="event.stopPropagation();"><span>' + escapeHtml(providerDisplayName) + '</span></a>'
      : escapeHtml(providerDisplayName);
    const bluePagesUrl = getBluePagesUrl(rp.provider && rp.provider.did, options);
    const modalLogoUrl = rp.logo || (rp.country ? 'https://flagcdn.com/w80/' + String(rp.country).toLowerCase() + '.png' : null);
    const acceptedCredentialRows = getAcceptedCredentialRows(rp);
    const interactionMode = getRpInteractionMode(rp);
    const interactionModeLabel = INTERACTION_MODE_LABELS[interactionMode] || interactionMode;

    const supportedWalletsHtml = (rp.supportedWallets || []).map(w => {
      const name = typeof w === 'string' ? w : w.name;
      const walletId = typeof w === 'object' ? w.walletCatalogId : null;
      if (walletId && walletCatalogUrl) {
        const walletUrl = walletCatalogUrl.replace(/\/$/, '') + '/?wallet=' + encodeURIComponent(walletId);
        return '<a href="' + escapeHtml(walletUrl) + '" target="_blank" rel="noopener" class="fides-tag wallet-link">' + escapeHtml(name) + ' ' + icons.externalLinkSmall + '</a>';
      }
      return '<span class="fides-tag supported-wallet">' + escapeHtml(name) + '</span>';
    }).join('');

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (modalLogoUrl ? '<img src="' + escapeHtml(modalLogoUrl) + '" alt="' + escapeHtml(rp.name) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.globe + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(rp.name) + '</h2><p class="fides-modal-provider">' + icons.building + ' ' + providerNameInHeader + (bluePagesUrl ? ' <a href="' + escapeHtml(bluePagesUrl) + '" target="_blank" rel="noopener" class="fides-modal-provider-link">' + icons.externalLink + ' View in Blue Pages</a>' : '') + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div id="fides-modal-rating-slot"></div>' +
      '<div class="fides-modal-badges fides-modal-badges-with-action"><div class="fides-modal-badges-left">' +
      (rp.readiness ? '<span class="fides-modal-badge readiness-' + escapeHtml(rp.readiness) + '">' + escapeHtml(readinessLabels[rp.readiness] || rp.readiness) + '</span>' : '') +
      '<span class="fides-modal-badge interaction-mode interaction-' + escapeHtml(interactionMode) + '">' + escapeHtml(interactionModeLabel) + '</span>' +
      (rp.status ? '<span class="fides-modal-badge status-' + escapeHtml(rp.status) + '">' + escapeHtml(statusLabels[rp.status] || rp.status) + '</span>' : '') +
      '</div>' +
      (rp.website ? '<a href="' + escapeHtml(rp.website) + '" target="_blank" rel="noopener" class="fides-modal-visit-button">' + icons.externalLink + ' Visit Website</a>' : '') +
      '</div>' +
      (rp.description ? '<div class="fides-modal-section"><p class="fides-modal-description">' + escapeHtml(rp.description) + '</p></div>' : '') +
      (rp.video ? getVideoEmbedHtml(rp.video) : '') +
      '<div class="fides-modal-grid">' +
      '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.laptop + ' Interaction mode</div><div class="fides-modal-grid-value"><span class="fides-tag interaction-mode-tag interaction-' + escapeHtml(interactionMode) + '">' + escapeHtml(interactionModeLabel) + '</span></div></div>' +
      buildRpSectorsModalGridHtml(rp) +
      ((acceptedCredentialRows.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' Accepted Credentials</div><div class="fides-modal-grid-value">' + renderAcceptedCredentialTagsHtmlForRpModal(rp, credentialCatalogUrl) + '</div></div>' : '') +
      ((rp.vcFormat && rp.vcFormat.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' VC formats</div><div class="fides-modal-grid-value">' + sortCredentialFormats(rp.vcFormat).map(f => '<span class="fides-tag credential-format">' + escapeHtml(credentialFormatDisplayLabel(f)) + '</span>').join('') + '</div></div>' : '') +
      ((rp.presentationProtocols && rp.presentationProtocols.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Presentation Protocols</div><div class="fides-modal-grid-value">' + rp.presentationProtocols.map(p => '<span class="fides-tag protocol-presentation">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((rp.interoperabilityProfiles && rp.interoperabilityProfiles.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Interop Profiles</div><div class="fides-modal-grid-value">' + rp.interoperabilityProfiles.map(p => '<span class="fides-tag interop">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((rp.supportedWallets && rp.supportedWallets.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.wallet + ' Supported Wallets</div><div class="fides-modal-grid-value">' + supportedWalletsHtml + '</div></div>' : '') +
      '</div>' +
      ((rp.useCases && rp.useCases.length) ? '<div class="fides-modal-features"><h4 class="fides-modal-section-title">Use Cases</h4><ul class="fides-features-list">' + rp.useCases.map(u => '<li>' + icons.check + ' ' + escapeHtml(u) + '</li>').join('') + '</ul></div>' : '') +
      '<div class="fides-modal-links">' +
      (rp.documentation ? '<a href="' + escapeHtml(rp.documentation) + '" target="_blank" rel="noopener" class="fides-modal-link" data-matomo-name="Documentation">' + icons.book + ' Documentation</a>' : '') +
      (rp.testCredentials ? '<a href="' + escapeHtml(rp.testCredentials) + '" target="_blank" rel="noopener" class="fides-modal-link" data-matomo-name="Test credentials">' + icons.fileCheck + ' Test Credentials</a>' : '') +
      '</div>' +
      '</div></div></div>';

    mountModal(modalHtml);
    const rpOverlay = document.getElementById('fides-modal-overlay');
    if (rpOverlay) attachModalRating(rpOverlay, 'rp', rp.id, options || {}, rp);
  }

  function arrayValues(input) {
    return Array.isArray(input) ? input : [];
  }

  function renderTagList(values, className) {
    return arrayValues(values).filter(function(v) { return typeof v === 'string' && v.trim() !== ''; }).map(function(v) {
      return '<span class="fides-tag ' + escapeHtml(className || '') + '">' + escapeHtml(v) + '</span>';
    }).join('');
  }

  function openIssuerModal(issuer, options) {
    if (!issuer) return;
    const theme = (options && options.theme) || 'dark';
    selectedContext = { type: 'issuer', item: issuer, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(issuer);

    const provider = issuer.organization || {};
    const providerName = provider.name ? String(provider.name) : 'Unknown organization';
    const orgCatalogHref = getOrganizationCatalogDeepLink((issuer.orgId || '').trim(), (options && options.organizationCatalogUrl) || 'https://fides.community/ecosystem-explorer/organization-catalog/');
    const providerInHeader = orgCatalogHref
      ? '<a href="' + escapeHtml(orgCatalogHref) + '" class="fides-modal-link-inline" aria-label="View organization in organization catalog" title="Organization catalog" onclick="event.stopPropagation();"><span>' + escapeHtml(providerName) + '</span></a>'
      : escapeHtml(providerName);
    const logo = issuer.logoUri || provider.logoUri || '';
    const vcFormatTags = arrayValues(issuer.credentialConfigurations).map(function(conf) {
      return conf && conf.vcFormat ? credentialFormatDisplayLabel(conf.vcFormat) : '';
    }).filter(Boolean);
    const credentialTypeTags = arrayValues(issuer.credentialConfigurations).map(function(conf) {
      return conf && conf.displayName ? conf.displayName : '';
    }).filter(Boolean);

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (logo ? '<img src="' + escapeHtml(logo) + '" alt="' + escapeHtml(issuer.displayName || issuer.id) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.building + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(issuer.displayName || issuer.id) + '</h2><p class="fides-modal-provider">' + icons.building + ' ' + providerInHeader + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div class="fides-modal-badges">' +
      (issuer.environment ? '<span class="fides-modal-badge">' + escapeHtml(issuer.environment) + '</span>' : '') +
      (issuer.issuanceProtocol ? '<span class="fides-modal-badge">' + escapeHtml(String(issuer.issuanceProtocol).toUpperCase()) + '</span>' : '') +
      '</div>' +
      (issuer.description ? '<div class="fides-modal-section"><p class="fides-modal-description">' + escapeHtml(issuer.description) + '</p></div>' : '') +
      '<div class="fides-modal-grid">' +
      (vcFormatTags.length ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' VC formats</div><div class="fides-modal-grid-value">' + renderTagList(vcFormatTags, 'credential-format') + '</div></div>' : '') +
      (credentialTypeTags.length ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Credential types</div><div class="fides-modal-grid-value">' + renderTagList(credentialTypeTags, '') + '</div></div>' : '') +
      '</div>' +
      '<div class="fides-modal-links">' +
      (issuer.issuerWebsiteUrl ? '<a href="' + escapeHtml(issuer.issuerWebsiteUrl) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Issuer website">' + icons.externalLink + ' Issuer Website</a>' : '') +
      (issuer.oid4vciMetadataUrl ? '<a href="' + escapeHtml(issuer.oid4vciMetadataUrl) + '" target="_blank" rel="noopener" class="fides-modal-link" data-matomo-name="Issuer metadata">' + icons.book + ' OID4VCI metadata</a>' : '') +
      '</div>' +
      '</div></div></div>';

    mountModal(modalHtml);
  }

  function openOrganizationModal(org, options) {
    if (!org) return;
    const theme = (options && options.theme) || 'dark';
    const isCommunity = itemIsCommunity(org);
    selectedContext = { type: 'organization', item: org, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(org);

    const logo = org.logo || '';
    const country = org.country || '';
    const issuerCatalogBase = (options && options.issuerCatalogUrl) || 'https://fides.community/ecosystem-explorer/issuer-catalog/';
    const rpCatalogBase = (options && options.rpCatalogUrl) || 'https://fides.community/ecosystem-explorer/relying-party-catalog/';
    const walletCatalogBase = (options && options.walletCatalogUrl) || 'https://fides.community/community-tools/personal-wallets/';
    const credentialCatalogBase = (options && options.credentialCatalogUrl) || 'https://fides.community/ecosystem-explorer/credential-catalog/';

    const issuerLinks = arrayValues(org.issuers).map(function(i) {
      const issuerId = i && i.id ? i.id : '';
      if (!issuerId) return '';
      const href = issuerCatalogBase ? issuerCatalogBase.replace(/\/$/, '') + '?issuer=' + encodeURIComponent(issuerId) : null;
      const label = i.displayName || issuerId;
      if (href) return '<a href="' + escapeHtml(href) + '" class="fides-tag" target="_blank" rel="noopener">' + escapeHtml(label) + ' ' + icons.externalLinkSmall + '</a>';
      return '<span class="fides-tag">' + escapeHtml(label) + '</span>';
    }).filter(Boolean).join('');

    const walletLinks = arrayValues(org.wallets).map(function(w) {
      const walletId = w && w.id ? w.id : '';
      const href = walletCatalogBase && walletId ? walletCatalogBase.replace(/\/$/, '') + '?wallet=' + encodeURIComponent(walletId) : null;
      const label = (w && w.name) ? w.name : walletId;
      if (!label) return '';
      if (href) return '<a href="' + escapeHtml(href) + '" class="fides-tag wallet-link" target="_blank" rel="noopener">' + escapeHtml(label) + ' ' + icons.externalLinkSmall + '</a>';
      return '<span class="fides-tag wallet-link">' + escapeHtml(label) + '</span>';
    }).filter(Boolean).join('');

    const rpLinks = arrayValues(org.relyingParties).map(function(rp) {
      const rpId = rp && rp.id ? rp.id : '';
      const href = rpCatalogBase && rpId ? rpCatalogBase.replace(/\/$/, '') + '?rp=' + encodeURIComponent(rpId) : null;
      const label = (rp && rp.name) ? rp.name : rpId;
      if (!label) return '';
      if (href) return '<a href="' + escapeHtml(href) + '" class="fides-tag" target="_blank" rel="noopener">' + escapeHtml(label) + ' ' + icons.externalLinkSmall + '</a>';
      return '<span class="fides-tag">' + escapeHtml(label) + '</span>';
    }).filter(Boolean).join('');

    const credentialLinks = arrayValues(org.credentials).map(function(c) {
      const credentialId = c && c.id ? c.id : '';
      const href = credentialCatalogBase && credentialId ? credentialCatalogBase.replace(/\/$/, '') + '?credential=' + encodeURIComponent(credentialId) : null;
      const label = (c && c.displayName) ? c.displayName : credentialId;
      if (!label) return '';
      if (href) return '<a href="' + escapeHtml(href) + '" class="fides-tag credential-catalog-link" target="_blank" rel="noopener">' + escapeHtml(label) + ' ' + icons.externalLinkSmall + '</a>';
      return '<span class="fides-tag credential-catalog-link">' + escapeHtml(label) + '</span>';
    }).filter(Boolean).join('');

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (logo ? '<img src="' + escapeHtml(logo) + '" alt="' + escapeHtml(org.name || org.id) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.building + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(org.name || org.id) + '</h2><p class="fides-modal-provider">' + icons.globe + ' ' + escapeHtml(country || 'Country unknown') + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div class="fides-modal-badges">' +
      (org.sectors && org.sectors.length ? org.sectors.slice(0, 3).map(function(s) { return '<span class="fides-modal-badge">' + escapeHtml(s) + '</span>'; }).join('') : '') +
      '</div>' +
      (org.description ? '<div class="fides-modal-section"><p class="fides-modal-description">' + escapeHtml(org.description) + '</p></div>' : '') +
      '<div class="fides-modal-grid">' +
      (issuerLinks ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.building + ' Issuers</div><div class="fides-modal-grid-value">' + issuerLinks + '</div></div>' : '') +
      (walletLinks ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.wallet + ' Wallets</div><div class="fides-modal-grid-value">' + walletLinks + '</div></div>' : '') +
      (rpLinks ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.laptop + ' Relying Parties</div><div class="fides-modal-grid-value">' + rpLinks + '</div></div>' : '') +
      (credentialLinks ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' Credentials</div><div class="fides-modal-grid-value">' + credentialLinks + '</div></div>' : '') +
      '</div>' +
      '<div class="fides-modal-links">' +
      (!isCommunity && org.website ? '<a href="' + escapeHtml(org.website) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Organization website">' + icons.externalLink + ' Visit Website</a>' : '') +
      '</div>' +
      '</div>' +
      buildOrganizationContactFooterHtml(org.contact, { tierUiEnabled: optionsTierUiEnabled(options), isCommunity: isCommunity }) +
      '</div></div>';

    mountModal(modalHtml);
  }

  function openVocabularyModal(term, options) {
    if (!term) return;
    const theme = (options && options.theme) || 'dark';
    const nested = !!(options && options.nested);
    if (!nested) {
      selectedContext = { type: 'vocabulary', item: term, options: options || {}, theme: theme };
      if (options && typeof options.onOpen === 'function') options.onOpen(term);
    }

    const name = term.name || term.id || '';
    const description = term.description ? String(term.description) : '';
    const aliases = arrayValues(term.aliases).filter(function (a) { return typeof a === 'string' && a.trim() !== ''; });
    const sourceUrl = term.url ? String(term.url).trim() : '';
    const editActionHtml = nested ? '' : buildVocabularyEditActionHtml(term, options);

    const shareButtonHtml = (nested || (options && options.showShare === false))
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const aliasesSection = aliases.length
      ? '<div class="fides-modal-section"><h3 class="fides-modal-section-title">Aliases</h3><p class="fides-modal-description">' + escapeHtml(aliases.join(', ')) + '</p></div>'
      : '';
    const sourceSection = sourceUrl
      ? '<div class="fides-modal-section"><h3 class="fides-modal-section-title">Source</h3><p class="fides-modal-description fides-modal-description--link"><a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(sourceUrl) + '</a></p></div>'
      : '';

    const overlayId = nested ? 'fides-nested-vocab-overlay' : 'fides-modal-overlay';
    const closeBtnId = nested ? 'fides-nested-vocab-close' : 'fides-modal-close';
    const modalHtml = '<div class="fides-modal-overlay fides-modal-overlay--vocabulary' +
      (nested ? ' fides-modal-overlay--nested' : '') + '" id="' + overlayId + '" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal fides-modal--vocabulary" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(name) + '</h2></div>' +
      '</div><div class="fides-modal-header-actions">' + editActionHtml + shareButtonHtml +
      '<button class="fides-modal-close" id="' + closeBtnId + '" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      (nested ? '' : '<div id="fides-modal-rating-slot" class="fides-modal-entity-like-slot"></div>') +
      (description ? '<div class="fides-modal-section"><h3 class="fides-modal-section-title">Description</h3><p class="fides-modal-description">' + escapeHtml(description) + '</p></div>' : '') +
      aliasesSection +
      sourceSection +
      '</div></div></div>';

    if (nested) {
      closeNestedVocabularyModal();
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      attachNestedVocabularyListeners();
      return;
    }

    mountModal(modalHtml);
    const vocabularyOverlay = document.getElementById('fides-modal-overlay');
    if (vocabularyOverlay) attachModalRating(vocabularyOverlay, 'vocabulary', term.id, options || {}, term);
  }

  window.FidesCatalogUI = {
    openWalletModal,
    openRpModal,
    openIssuerModal,
    openOrganizationModal,
    openVocabularyModal,
    closeModal,
    trackMatomoEvent,
    initMatomoLinkTracking,
    userCanEditCatalogItem,
    canEditOrganization,
    canEditWallet,
    resolveWalletOrgId,
    buildCatalogListingHeaderBadgeHtml,
    buildOrganizationContactFooterHtml,
    buildOrganizationHeroSectionHtml,
    initModalMediaCarousels
  };
})();
