(function() {
  'use strict';

  if (window.FidesCatalogUI) return;

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
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    penLine: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
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
    return '<div class="fides-video-fallback"><a href="' + escapeHtml(videoUrl) + '" target="_blank" rel="noopener" class="fides-modal-link primary">' + icons.play + ' Watch Video (External)</a></div>';
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
    const protocolsObj = wallet.protocols || {};

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (wallet.logo ? '<img src="' + escapeHtml(wallet.logo) + '" alt="' + escapeHtml(wallet.name) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.wallet + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(wallet.name) + '</h2><p class="fides-modal-provider">' + icons.building + ' ' + escapeHtml(wallet.provider && wallet.provider.name) + '</p></div>' +
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
      ((wallet.credentialFormats && wallet.credentialFormats.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' Credential Formats</div><div class="fides-modal-grid-value">' + sortCredentialFormats(wallet.credentialFormats).map(f => '<span class="fides-tag credential-format">' + escapeHtml(f) + '</span>').join('') + '</div></div>' : '') +
      (((wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.download + ' Issuance Protocols</div><div class="fides-modal-grid-value">' + (wallet.issuanceProtocols || (wallet.protocols && wallet.protocols.issuance) || []).map(p => '<span class="fides-tag protocol-issuance">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      (((wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Presentation Protocols</div><div class="fides-modal-grid-value">' + (wallet.presentationProtocols || (wallet.protocols && wallet.protocols.presentation) || []).map(p => '<span class="fides-tag protocol-presentation">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((((wallet.supportedIdentifiers || wallet.didMethods) || []).length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.key + ' Identifiers</div><div class="fides-modal-grid-value">' + ((wallet.supportedIdentifiers || wallet.didMethods) || []).map(d => '<span class="fides-tag did-method">' + escapeHtml(d) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.keyStorage && wallet.keyStorage.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.key + ' Key Storage</div><div class="fides-modal-grid-value">' + wallet.keyStorage.map(k => '<span class="fides-tag">' + escapeHtml(k) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.signingAlgorithms && wallet.signingAlgorithms.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.penLine + ' Signing Algorithms</div><div class="fides-modal-grid-value">' + wallet.signingAlgorithms.map(a => '<span class="fides-tag">' + escapeHtml(a) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.credentialStatusMethods && wallet.credentialStatusMethods.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Credential Status</div><div class="fides-modal-grid-value">' + wallet.credentialStatusMethods.map(m => '<span class="fides-tag">' + escapeHtml(m) + '</span>').join('') + '</div></div>' : '') +
      ((wallet.interoperabilityProfiles && wallet.interoperabilityProfiles.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Interop Profiles</div><div class="fides-modal-grid-value">' + wallet.interoperabilityProfiles.map(p => '<span class="fides-tag interop">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      '</div>' +
      ((wallet.features && wallet.features.length) ? '<div class="fides-modal-features"><h4 class="fides-modal-section-title">Features</h4><ul class="fides-features-list">' + wallet.features.map(f => '<li>' + icons.check + ' ' + escapeHtml(f) + '</li>').join('') + '</ul></div>' : '') +
      '<div class="fides-modal-links">' +
      (wallet.website ? '<a href="' + escapeHtml(wallet.website) + '" target="_blank" rel="noopener" class="fides-modal-link primary">' + icons.externalLink + ' Visit Website</a>' : '') +
      (wallet.openSource && wallet.repository ? '<a href="' + escapeHtml(wallet.repository) + '" target="_blank" rel="noopener" class="fides-modal-link">' + icons.github + ' View Repository</a>' : '') +
      (wallet.documentation ? '<a href="' + escapeHtml(wallet.documentation) + '" target="_blank" rel="noopener" class="fides-modal-link">' + icons.book + ' Documentation</a>' : '') +
      '</div>' +
      '<div class="fides-modal-provider-section"><h4 class="fides-modal-section-title">Provider Information</h4><div class="fides-modal-provider-info">' +
      '<div class="fides-modal-provider-detail"><span class="fides-modal-provider-label">Organization:</span><span class="fides-modal-provider-value">' + escapeHtml(wallet.provider && wallet.provider.name) + '</span></div>' +
      ((wallet.provider && wallet.provider.did) ? '<div class="fides-modal-provider-detail"><span class="fides-modal-provider-label">DID:</span><code class="fides-modal-provider-did">' + escapeHtml(wallet.provider.did) + '</code></div>' : '') +
      (wallet.releaseDate ? '<div class="fides-modal-provider-detail"><span class="fides-modal-provider-label">Release Date:</span><span class="fides-modal-provider-value">' + escapeHtml(new Date(wallet.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })) + '</span></div>' : '') +
      '</div></div>' +
      '</div></div></div>';

    mountModal(modalHtml);
  }

  function getBluePagesUrl(did, options) {
    const base = (options && options.bluePagesUrl) || '';
    if (!base || !did) return null;
    return base.replace(/\/$/, '') + '/' + encodeURIComponent(did) + '/';
  }

  function openRpModal(rp, options) {
    if (!rp) return;
    const theme = (options && options.theme) || 'dark';
    selectedContext = { type: 'rp', item: rp, options: options || {}, theme: theme };
    if (options && typeof options.onOpen === 'function') options.onOpen(rp);

    const readinessLabels = { 'technical-demo': 'Technical Demo', 'use-case-demo': 'Use Case Demo', 'production-pilot': 'Production Pilot', 'production': 'Production' };
    const statusLabels = { development: 'In Development', beta: 'Beta', live: 'Live', deprecated: 'Deprecated' };
    const walletCatalogUrl = (options && options.walletCatalogUrl) || '';
    const bluePagesUrl = getBluePagesUrl(rp.provider && rp.provider.did, options);
    const modalLogoUrl = rp.logo || (rp.country ? 'https://flagcdn.com/w80/' + String(rp.country).toLowerCase() + '.png' : null);

    const supportedWalletsHtml = (rp.supportedWallets || []).map(w => {
      const name = typeof w === 'string' ? w : w.name;
      const walletId = typeof w === 'object' ? w.walletCatalogId : null;
      if (walletId && walletCatalogUrl) {
        const walletUrl = walletCatalogUrl.replace(/\/$/, '') + '/?wallet=' + encodeURIComponent(walletId);
        return '<a href="' + escapeHtml(walletUrl) + '" target="_blank" rel="noopener" class="fides-tag wallet-link">' + escapeHtml(name) + ' ' + icons.externalLinkSmall + '</a>';
      }
      return '<span class="fides-tag">' + escapeHtml(name) + '</span>';
    }).join('');

    const shareButtonHtml = (options && options.showShare === false)
      ? ''
      : '<button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link">' + icons.share + '</button>';

    const modalHtml = '<div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="' + escapeHtml(theme) + '">' +
      '<div class="fides-modal" role="dialog" aria-modal="true">' +
      '<div class="fides-modal-header"><div class="fides-modal-header-content">' +
      (modalLogoUrl ? '<img src="' + escapeHtml(modalLogoUrl) + '" alt="' + escapeHtml(rp.name) + '" class="fides-modal-logo">' : '<div class="fides-modal-logo-placeholder">' + icons.globe + '</div>') +
      '<div class="fides-modal-title-wrap"><h2 class="fides-modal-title">' + escapeHtml(rp.name) + '</h2><p class="fides-modal-provider">' + icons.building + ' ' + escapeHtml(rp.provider && rp.provider.name) + (bluePagesUrl ? ' <a href="' + escapeHtml(bluePagesUrl) + '" target="_blank" rel="noopener" class="fides-modal-provider-link">' + icons.externalLink + ' View in Blue Pages</a>' : '') + '</p></div>' +
      '</div><div class="fides-modal-header-actions">' + shareButtonHtml + '<button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">' + icons.xLarge + '</button></div></div>' +
      '<div class="fides-modal-body">' +
      '<div class="fides-modal-badges fides-modal-badges-with-action"><div class="fides-modal-badges-left">' +
      (rp.readiness ? '<span class="fides-modal-badge readiness-' + escapeHtml(rp.readiness) + '">' + escapeHtml(readinessLabels[rp.readiness] || rp.readiness) + '</span>' : '') +
      (rp.status ? '<span class="fides-modal-badge status-' + escapeHtml(rp.status) + '">' + escapeHtml(statusLabels[rp.status] || rp.status) + '</span>' : '') +
      '</div>' +
      (rp.website ? '<a href="' + escapeHtml(rp.website) + '" target="_blank" rel="noopener" class="fides-modal-visit-button">' + icons.externalLink + ' Visit Website</a>' : '') +
      '</div>' +
      (rp.description ? '<div class="fides-modal-section"><p class="fides-modal-description">' + escapeHtml(rp.description) + '</p></div>' : '') +
      (rp.video ? getVideoEmbedHtml(rp.video) : '') +
      '<div class="fides-modal-grid">' +
      ((rp.sectors && rp.sectors.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.building + ' Sectors</div><div class="fides-modal-grid-value">' + rp.sectors.map(s => '<span class="fides-tag sector">' + escapeHtml(s) + '</span>').join('') + '</div></div>' : '') +
      ((rp.acceptedCredentials && rp.acceptedCredentials.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' Accepted Credentials</div><div class="fides-modal-grid-value">' + rp.acceptedCredentials.map(c => '<span class="fides-tag">' + escapeHtml(c) + '</span>').join('') + '</div></div>' : '') +
      ((rp.credentialFormats && rp.credentialFormats.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.fileCheck + ' Credential Formats</div><div class="fides-modal-grid-value">' + rp.credentialFormats.map(f => '<span class="fides-tag">' + escapeHtml(f) + '</span>').join('') + '</div></div>' : '') +
      ((rp.presentationProtocols && rp.presentationProtocols.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Presentation Protocols</div><div class="fides-modal-grid-value">' + rp.presentationProtocols.map(p => '<span class="fides-tag">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((rp.interoperabilityProfiles && rp.interoperabilityProfiles.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.shield + ' Interop Profiles</div><div class="fides-modal-grid-value">' + rp.interoperabilityProfiles.map(p => '<span class="fides-tag interop">' + escapeHtml(p) + '</span>').join('') + '</div></div>' : '') +
      ((rp.supportedWallets && rp.supportedWallets.length) ? '<div class="fides-modal-grid-item"><div class="fides-modal-grid-label">' + icons.wallet + ' Supported Wallets</div><div class="fides-modal-grid-value">' + supportedWalletsHtml + '</div></div>' : '') +
      '</div>' +
      ((rp.useCases && rp.useCases.length) ? '<div class="fides-modal-features"><h4 class="fides-modal-section-title">Use Cases</h4><ul class="fides-features-list">' + rp.useCases.map(u => '<li>' + icons.check + ' ' + escapeHtml(u) + '</li>').join('') + '</ul></div>' : '') +
      '<div class="fides-modal-links">' +
      (rp.documentation ? '<a href="' + escapeHtml(rp.documentation) + '" target="_blank" rel="noopener" class="fides-modal-link">' + icons.book + ' Documentation</a>' : '') +
      (rp.testCredentials ? '<a href="' + escapeHtml(rp.testCredentials) + '" target="_blank" rel="noopener" class="fides-modal-link">' + icons.fileCheck + ' Test Credentials</a>' : '') +
      '</div>' +
      '<div class="fides-modal-provider-section"><h4 class="fides-modal-section-title">Provider Information</h4><div class="fides-modal-provider-info">' +
      '<div class="fides-modal-provider-detail"><span class="fides-modal-provider-label">Organization:</span><span class="fides-modal-provider-value">' + escapeHtml(rp.provider && rp.provider.name) + '</span></div>' +
      ((rp.provider && rp.provider.website) ? '<div class="fides-modal-provider-detail"><span class="fides-modal-provider-label">Website:</span><a href="' + escapeHtml(rp.provider.website) + '" target="_blank" rel="noopener" class="fides-modal-provider-value">' + escapeHtml(rp.provider.website) + '</a></div>' : '') +
      '</div></div>' +
      '</div></div></div>';

    mountModal(modalHtml);
  }

  window.FidesCatalogUI = {
    openWalletModal,
    openRpModal,
    closeModal
  };
})();
