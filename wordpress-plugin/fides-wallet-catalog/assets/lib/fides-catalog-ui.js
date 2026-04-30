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
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    key: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    penLine: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    laptop: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>'
  };

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

  function renderPlatformTag(wallet, platform) {
    const link = getAppStoreLink(wallet, platform);
    const icon = platform === 'iOS' || platform === 'Android' ? icons.smartphone : icons.globe;
    if (link) return '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" class="fides-tag platform clickable">' + icon + ' ' + escapeHtml(platform) + '</a>';
    return '<span class="fides-tag platform">' + icon + ' ' + escapeHtml(platform) + '</span>';
  }

  function getVideoEmbedUrl(videoUrl) {
    if (!videoUrl) return null;
    const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/);
    if (yt && yt[1]) return 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1';
    const vimeo = videoUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeo && vimeo[1]) return 'https://player.vimeo.com/video/' + vimeo[1];
    return null;
  }

  function getVideoEmbedHtml(videoUrl) {
    const embedUrl = getVideoEmbedUrl(videoUrl);
    if (embedUrl) {
      return '<div class="fides-video-container"><iframe src="' + escapeHtml(embedUrl) + '" frameborder="0" class="fides-video-iframe" title="Video player"></iframe></div>';
    }
    return '<div class="fides-video-fallback"><a href="' + escapeHtml(videoUrl) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Video">' + icons.play + ' Watch Video (External)</a></div>';
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

  function closeModal() {
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
        selectedContext = null;
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
    return url.toString();
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
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function mountModal(html) {
    closeModal();
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    attachModalListeners();
  }

  function openWalletModal(wallet, options) {
    if (!wallet) return;
    const theme = (options && options.theme) || 'dark';
    selectedContext = { type: 'wallet', item: wallet, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(wallet);

    const typeLabels = { personal: 'Personal', organizational: 'Organizational' };
    const statusLabels = { development: 'In Development', beta: 'Beta', production: 'Production', deprecated: 'Deprecated' };
    const statusClasses = { development: 'status-dev', beta: 'status-beta', production: 'status-prod', deprecated: 'status-deprecated' };
    const organizationCatalogUrl = (options && options.organizationCatalogUrl) || 'https://fides.community/ecosystem-explorer/organization-catalog/';
    const effectiveWalletOrgId = (wallet.orgId && String(wallet.orgId).trim()) ||
      (wallet.provider && wallet.provider.orgId && String(wallet.provider.orgId).trim()) || '';
    const orgCatalogHref = getOrganizationCatalogDeepLink(effectiveWalletOrgId, organizationCatalogUrl);
    const providerDisplayName = (wallet.provider && wallet.provider.name) ? String(wallet.provider.name) : 'Unknown';
    const providerNameInHeader = orgCatalogHref && providerDisplayName
      ? '<a href="' + escapeHtml(orgCatalogHref) + '" class="fides-modal-link-inline" aria-label="View organization in organization catalog" title="Organization catalog" onclick="event.stopPropagation();"><span>' + escapeHtml(providerDisplayName) + '</span></a>'
      : escapeHtml(providerDisplayName);
    const bluePagesUrl = getBluePagesUrl(wallet.provider && wallet.provider.did, options);

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay fides-modal-overlay--rp" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (wallet.logo ? '<img src="' + escapeHtml(wallet.logo) + '" alt="' + escapeHtml(wallet.name) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.wallet + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(wallet.name) + '</h2><p class="fides-modal-provider">' + icons.building + ' ' + providerNameInHeader + (bluePagesUrl ? ' <a href="' + escapeHtml(bluePagesUrl) + '" target="_blank" rel="noopener" class="fides-modal-provider-link">' + icons.externalLink + ' View in Blue Pages</a>' : '') + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div class="fides-modal-badges">' +
      '<span class="fides-modal-badge type-' + escapeHtml(wallet.type) + '">' + escapeHtml(typeLabels[wallet.type]) + '</span>' +
      ((wallet.type === 'organizational' && wallet.capabilities) ? wallet.capabilities.map(c => '<span class="fides-modal-badge capability-' + escapeHtml(c) + '">' + escapeHtml(c.charAt(0).toUpperCase() + c.slice(1)) + '</span>').join('') : '') +
      (wallet.status ? '<span class="fides-modal-badge ' + escapeHtml(statusClasses[wallet.status] || '') + '">' + escapeHtml(statusLabels[wallet.status] || wallet.status) + '</span>' : '') +
      '<span class="fides-modal-badge ' + (wallet.openSource ? 'open-source' : 'proprietary') + '">' + (wallet.openSource ? (icons.github + ' Open Source' + (wallet.license ? ' (' + escapeHtml(wallet.license) + ')' : '')) : 'Proprietary') + '</span>' +
      '</div>' +
      (wallet.description ? '<div class="fides-modal-section"><p class="fides-modal-description">' + escapeHtml(wallet.description) + '</p></div>' : '') +
      (wallet.video ? getVideoEmbedHtml(wallet.video) : '') +
      '<div class="fides-modal-grid">' +
      ((wallet.platforms && wallet.platforms.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.smartphone + ' Platforms ' + (wallet.type !== 'organizational' ? '<span class="fides-label-hint">(click to access)</span>' : '') + '</div><div class="fides-modal-grid-value">' + wallet.platforms.map(p => renderPlatformTag(wallet, p)).join('') + '</div></div>' : '') +
      ((wallet.vcFormat && wallet.vcFormat.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' VC formats</div><div class="fides-modal-grid-value">' + sortCredentialFormats(wallet.vcFormat).map(f => '<span class="fides-tag credential-format">' + escapeHtml(credentialFormatDisplayLabel(f)) + '</span>').join('') + '</div></div>' : '') +
      (((wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.download + ' Issuance Protocols</div><div class="fides-modal-grid-value">' + (wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || []).map(p => '<span class="fides-tag protocol-issuance">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      (((wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Presentation Protocols</div><div class="fides-modal-grid-value">' + (wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || []).map(p => '<span class="fides-tag protocol-presentation">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((((wallet.supportedIdentifiers || wallet.didMethods) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.key + ' Identifiers</div><div class="fides-modal-grid-value">' + ((wallet.supportedIdentifiers || wallet.didMethods) || []).map(d => '<span class="fides-tag did-method">' + escapeHtml(d) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.keyStorage && wallet.keyStorage.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.key + ' Key Storage</div><div class="fides-modal-grid-value">' + wallet.keyStorage.map(k => '<span class="fides-tag">' + escapeHtml(k) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.signingAlgorithms && wallet.signingAlgorithms.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.penLine + ' Signing Algorithms</div><div class="fides-modal-grid-value">' + wallet.signingAlgorithms.map(a => '<span class="fides-tag">' + escapeHtml(a) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.credentialStatusMethods && wallet.credentialStatusMethods.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Credential Status</div><div class="fides-modal-grid-value">' + wallet.credentialStatusMethods.map(m => '<span class="fides-tag">' + escapeHtml(m) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.interoperabilityProfiles && wallet.interoperabilityProfiles.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Interop Profiles</div><div class="fides-modal-grid-value">' + wallet.interoperabilityProfiles.map(p => '<span class="fides-tag interop">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      (wallet.releaseDate ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.calendar + ' Release date</div><div class="fides-modal-grid-value">' + escapeHtml(new Date(wallet.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })) + '</div></div>' : '') +
      '</div>' +
      ((wallet.features && wallet.features.length) ? '<div class="fides-modal-features"><h4 class="fides-modal-section-title">Features</h4><ul class="fides-features-list">' + wallet.features.map(f => '<li>' + icons.check + ' ' + escapeHtml(f) + '</li>').join('') + '</ul></div>' : '') +
      '<div class="fides-modal-links">' +
      (wallet.website ? '<a href="' + escapeHtml(wallet.website) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Visit website">' + icons.externalLink + ' Visit Website</a>' : '') +
      (wallet.openSource && wallet.repository ? '<a href="' + escapeHtml(wallet.repository) + '" target="_blank" rel="noopener" class="fides-modal-link" data-matomo-name="Repository">' + icons.github + ' View Repository</a>' : '') +
      (wallet.documentation ? '<a href="' + escapeHtml(wallet.documentation) + '" target="_blank" rel="noopener" class="fides-modal-link" data-matomo-name="Documentation">' + icons.book + ' Documentation</a>' : '') +
      '</div>' +
      '</div></div></div>';

    mountModal(modalHtml);
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
      (org.website ? '<a href="' + escapeHtml(org.website) + '" target="_blank" rel="noopener" class="fides-modal-link primary" data-matomo-name="Organization website">' + icons.externalLink + ' Visit Website</a>' : '') +
      '</div>' +
      '</div></div></div>';

    mountModal(modalHtml);
  }

  window.FidesCatalogUI = {
    openWalletModal,
    openRpModal,
    openIssuerModal,
    openOrganizationModal,
    closeModal,
    trackMatomoEvent,
    initMatomoLinkTracking
  };
})();
