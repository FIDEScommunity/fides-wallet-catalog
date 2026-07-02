(function () {
  const config = window.FIDES_WALLET_FORM_CONFIG || {};
  const mode = config.mode === "update" ? "update" : "create";
  const root =
    document.getElementById(
      mode === "update" ? "fides-wallet-update-form-root" : "fides-wallet-submit-form-root"
    ) || document.querySelector(".fides-wallet-submission-root");
  if (!root) return;

  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const restNonce = String(config.restNonce || "").trim();
  const contactEmail = String(config.contactEmail || "").trim();
  const fieldHelp = config.fieldHelp && typeof config.fieldHelp === "object" ? config.fieldHelp : {};
  const enums = config.enums && typeof config.enums === "object" ? config.enums : {};
  const enumLabels = config.enumLabels && typeof config.enumLabels === "object" ? config.enumLabels : {};
  const enumTitles = config.enumTitles && typeof config.enumTitles === "object" ? config.enumTitles : {};
  const eidasTrustServicesByType =
    config.eidasTrustServicesByType && typeof config.eidasTrustServicesByType === "object"
      ? config.eidasTrustServicesByType
      : {};
  const sectionIntro = String(config.sectionIntro || "").trim();
  const VOCABULARY_URL = config.vocabularyUrl ? String(config.vocabularyUrl) : "";
  const VOCABULARY_FALLBACK_URL = config.vocabularyFallbackUrl ? String(config.vocabularyFallbackUrl) : "";
  let vocabulary = null;
  let preservedPlatforms = [];
  let preservedAppStoreLinks = { iOS: "", android: "", web: "" };

  const FORM_FIELD_TO_VOCAB = {
    vcFormat: "vcFormat",
    issuanceProtocols: "issuanceProtocol",
    presentationProtocols: "presentationProtocol",
    keyStorage: "keyStorage",
    supportedIdentifiers: "identifiers",
    signingAlgorithms: "signingAlgorithm",
    credentialStatusMethods: "credentialStatus",
    interoperabilityProfiles: "interopProfile",
    eidasTrustServices: "eidasTrustServices",
  };

  /** Map form option values to vocabulary.json term keys (when they differ). */
  const FORM_OPTION_TO_VOCAB = {
    issuanceProtocol: {
      OpenID4VCI: "OpenID4VCI",
      "DIDComm Issue Credential v2": "DIDComm v2",
      "DIDComm Issue Credential v1": "DIDComm v1",
    },
    presentationProtocol: {
      "DIDComm Present Proof v2": "DIDComm v2",
    },
    identifiers: {
      "did:web": "didWeb",
      "did:key": "didKey",
      "did:jwk": "didJwk",
      "did:peer": "didPeer",
      "did:ebsi": "didEbsi",
    },
    keyStorage: {
      "Secure Enclave (iOS)": "secureEnclaveIos",
      "StrongBox (Android)": "strongboxAndroid",
      Software: "softwareKeyStorage",
      HSM: "hsm",
      TEE: "tee",
    },
    signingAlgorithm: {
      ES256: "ecdsaEs256",
      "ECDSA ES256": "ecdsaEs256",
    },
    credentialStatus: {
      "JWT Validity": "jwtValidity",
      "IETF Token Status List": "ietfTokenStatusList",
      "PKI Cert Validity": "pkiCertValidity",
    },
    eidasTrustServices: {
      Q_CERT_ESIG: "QESig",
      Q_CERT_ESEAL: "QESeal",
      Q_TIMESTAMP: "QTimestamp",
      Q_ERDS: "QERDS",
      Q_WAC: "QWAC",
      Q_EARCH: "QEArch",
      Q_VC: "QVal",
      Q_PRES: "QPres",
      Q_PRES_ESEAL: "QPresSeal",
      Q_PRES_ESIG: "QPresSig",
      Q_VAL_ESEAL: "QValSeal",
      Q_VAL_ESIG: "QValSig",
      Q_REM_MANAGE_Q_SEAL_CD: "QRemSeal",
      Q_REM_MANAGE_Q_SIG_CD: "QRemSig",
      QEAA: "QEAA",
    },
  };

  let selectedWalletId = mode === "update" ? String(config.preselectWalletId || "").trim() : "";
  let selectedWalletLabel = "";
  let selectedOrgId = "";
  let selectedOrgLabel = "";
  let planTier =
    config.planTier && typeof config.planTier === "object"
      ? { ...config.planTier }
      : { tierUiEnabled: false, tier: "Community", isPro: false, plansUrl: "/plans/", descriptionMaxLength: 2000 };

  const v2Limits = config.v2Limits && typeof config.v2Limits === "object" ? config.v2Limits : {};

  function tierUiEnabled() {
    return planTier.tierUiEnabled === true;
  }

  const WALLET_PRO_FIELD_IDS = [
    "fides-wallet-website",
    "fides-wallet-documentation",
    "fides-wallet-repository",
    "fides-wallet-features",
    "fides-wallet-pricing",
    "fides-wallet-ios",
    "fides-wallet-android",
    "fides-wallet-web-url",
  ];

  function proBadgeHtml() {
    const url = String(planTier.plansUrl || "/plans/");
    return `<a href="${escapeHtml(url)}" class="fides-pro-plan-badge" target="_blank" rel="noopener">Pro plan</a>`;
  }

  function labelWithProIfNeeded(labelText, isProField) {
    if (!tierUiEnabled() || planTier.isPro || !isProField) return labelText;
    return `${labelText} ${proBadgeHtml()}`;
  }

  function updateProFieldLabels() {
    root.querySelectorAll("[data-pro-label]").forEach((el) => {
      const text = el.getAttribute("data-pro-label");
      if (text) el.innerHTML = labelWithProIfNeeded(text, true);
    });
  }

  async function refreshPlanTier(orgId) {
    const id = String(orgId || "").trim();
    if (!id || !apiBase) {
      planTier = {
        tierUiEnabled: planTier.tierUiEnabled,
        tier: "Community",
        isPro: false,
        plansUrl: planTier.plansUrl || "/plans/",
        descriptionMaxLength: 200,
      };
      applyTierFieldState();
      return;
    }
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(`${apiBase}/org-tier?orgId=${encodeURIComponent(id)}`, {
        credentials: "same-origin",
        headers,
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json && typeof json === "object") {
        planTier = { ...planTier, ...json };
      }
    } catch (_err) {
      /* keep current tier */
    }
    applyTierFieldState();
  }

  const WALLET_DESC_MAX_COMMUNITY = 200;
  const WALLET_DESC_MAX_PRO = 2000;

  function walletDescriptionMaxLength() {
    if (!tierUiEnabled()) {
      return WALLET_DESC_MAX_PRO;
    }
    const fromConfig = Number(planTier.descriptionMaxLength);
    if (fromConfig > 0) {
      return fromConfig;
    }
    return planTier.isPro ? WALLET_DESC_MAX_PRO : WALLET_DESC_MAX_COMMUNITY;
  }

  function updateWalletDescriptionLimitUi() {
    const maxLen = walletDescriptionMaxLength();
    const isPro = !!planTier.isPro;
    const descEl = root.querySelector("#fides-wallet-description");
    const labelEl = root.querySelector("#fides-wallet-description-label");
    const noticeEl = root.querySelector("#fides-wallet-description-limit-notice");
    if (descEl) descEl.maxLength = maxLen;
    if (labelEl) {
      labelEl.textContent = "Description *";
    }
    if (noticeEl) {
      const plansUrl = escapeHtml(String(planTier.plansUrl || "/plans/"));
      if (!tierUiEnabled() || isPro) {
        noticeEl.textContent = `You can use up to ${WALLET_DESC_MAX_PRO.toLocaleString("en-US")} characters in the published catalog description.`;
      } else {
        noticeEl.innerHTML = `Community plan: maximum ${WALLET_DESC_MAX_COMMUNITY} characters in the catalog. <a href="${plansUrl}" target="_blank" rel="noopener">Pro plan</a> allows up to ${WALLET_DESC_MAX_PRO.toLocaleString("en-US")} characters.`;
      }
    }
    updateWalletDescriptionCounter();
  }

  function updateWalletDescriptionCounter() {
    const descEl = root.querySelector("#fides-wallet-description");
    const counterEl = root.querySelector("#fides-wallet-description-counter");
    if (!descEl || !counterEl) return;
    const maxLen = Number(descEl.maxLength) || walletDescriptionMaxLength();
    const len = String(descEl.value || "").length;
    counterEl.textContent = `${len.toLocaleString("en-US")} / ${maxLen.toLocaleString("en-US")} characters`;
  }

  function updatePlanTierBadgeEl(badge, visible) {
    if (!badge) return;
    if (!tierUiEnabled() || !visible) {
      badge.hidden = true;
      badge.textContent = "";
      return;
    }
    const isPro = !!planTier.isPro;
    badge.hidden = false;
    badge.textContent = isPro ? "Pro plan" : "Community plan";
    badge.className = `fides-update-banner-plan ${isPro ? "fides-pro-plan-badge" : "fides-free-plan-badge"}`;
    badge.title = isPro
      ? "This organization has a linked Pro account. Extended wallet catalog fields are enabled."
      : "Community plan limits apply to fields published in the catalog.";
  }

  function updatePlanTierBanner() {
    updatePlanTierBadgeEl(
      root.querySelector("#fides-wallet-update-plan-tier-badge"),
      mode === "update" && Boolean(selectedWalletId) && Boolean(selectedOrgId)
    );
    updatePlanTierBadgeEl(
      root.querySelector("#fides-wallet-org-plan-tier-badge"),
      mode === "create" && Boolean(selectedOrgId)
    );
  }

  const RECOGNITION_GROUPS = [
    { key: "customerStories", label: "Customer stories", helpKey: "recognitionsCustomerStories", limitKey: "customerStories", parentKey: "recognitions" },
    { key: "certifications", label: "Certifications", helpKey: "recognitionsCertifications", limitKey: "recognitionsCertifications", parentKey: "recognitions" },
    { key: "awardsAndRecognitions", label: "Awards & recognitions", helpKey: "recognitionsAwards", limitKey: "awardsAndRecognitions", parentKey: "recognitions" },
    { key: "additionalDocumentation", label: "Additional documentation", helpKey: "additionalDocumentation", limitKey: "additionalDocumentation", parentKey: null },
  ];

  const recognitionRowsState = {
    customerStories: [{ title: "", url: "" }],
    certifications: [{ title: "", url: "" }],
    awardsAndRecognitions: [{ title: "", url: "" }],
    additionalDocumentation: [{ title: "", url: "" }],
  };

  function recognitionMax(key) {
    const group = RECOGNITION_GROUPS.find((g) => g.key === key);
    const limit = group ? Number(v2Limits[group.limitKey]) : 0;
    return limit > 0 ? limit : 10;
  }

  function renderRecognitionGroupRows(key) {
    const container = root.querySelector(`#fides-recognition-${key}`);
    const state = recognitionRowsState[key];
    if (!container || !Array.isArray(state)) return;
    const max = recognitionMax(key);
    const lastIndex = state.length - 1;
    container.innerHTML = state
      .map((entry, index) => {
        const isLast = index === lastIndex;
        const canAdd = state.length < max;
        let rowAction = "";
        if (isLast && canAdd) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-add-recognition="${escapeHtml(key)}">Add</button>`;
        } else if (!isLast || state.length > 1) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-remove-recognition="${escapeHtml(key)}:${index}" aria-label="Remove item">Remove</button>`;
        }
        return `
          <div class="fides-media-row" data-recognition-key="${escapeHtml(key)}" data-recognition-index="${index}">
            <div class="fides-media-inputs fides-media-inputs--recognition">
              <input type="text" class="fides-recognition-title fides-media-field-input" data-recognition-title="${escapeHtml(key)}:${index}" placeholder="Title" maxlength="${Number(v2Limits.recognitionTitle) || 100}" value="${escapeHtml(entry.title || "")}" />
              <input type="url" class="fides-recognition-url fides-media-field-input" data-recognition-url="${escapeHtml(key)}:${index}" placeholder="https://… (optional)" value="${escapeHtml(entry.url || "")}" />
              ${rowAction}
            </div>
          </div>`;
      })
      .join("");
  }

  function setRecognitionRowsFromPayload(walletPayload) {
    const payload = walletPayload && typeof walletPayload === "object" ? walletPayload : {};
    const rec = payload.recognitions && typeof payload.recognitions === "object" ? payload.recognitions : {};
    RECOGNITION_GROUPS.forEach(({ key, parentKey }) => {
      const source = parentKey === "recognitions" ? rec : payload;
      let items = Array.isArray(source[key]) ? source[key] : [];
      if (
        key === "certifications" &&
        parentKey === "recognitions" &&
        !items.length &&
        Array.isArray(payload.certifications) &&
        payload.certifications.length
      ) {
        items = payload.certifications.map((title) => ({ title: String(title) }));
      }
      const max = recognitionMax(key);
      const sliced = items.slice(0, max).map((item) => ({
        title: item && item.title ? String(item.title) : "",
        url: item && item.url ? String(item.url) : "",
      }));
      recognitionRowsState[key] = sliced.length ? sliced : [{ title: "", url: "" }];
      renderRecognitionGroupRows(key);
    });
  }

  function readRecognitionGroup(key) {
    const state = recognitionRowsState[key];
    if (!Array.isArray(state)) return [];
    return state
      .map((entry) => {
        const title = String(entry.title || "").trim();
        const url = String(entry.url || "").trim();
        if (!title) return null;
        return url ? { title, url } : { title };
      })
      .filter(Boolean)
      .slice(0, recognitionMax(key));
  }

  function initRecognitionControls() {
    RECOGNITION_GROUPS.forEach(({ key }) => {
      const container = root.querySelector(`#fides-recognition-${key}`);
      if (!container) return;

      container.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const titleAttr = target.getAttribute("data-recognition-title");
        const urlAttr = target.getAttribute("data-recognition-url");
        const attr = titleAttr || urlAttr;
        if (!attr) return;
        const [groupKey, indexRaw] = attr.split(":");
        const index = Number(indexRaw);
        if (!groupKey || !Number.isFinite(index) || !recognitionRowsState[groupKey]?.[index]) return;
        if (titleAttr) recognitionRowsState[groupKey][index].title = target.value;
        if (urlAttr) recognitionRowsState[groupKey][index].url = target.value;
      });

      container.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const addKey = target.getAttribute("data-add-recognition");
        if (addKey) {
          const state = recognitionRowsState[addKey];
          if (!state || state.length >= recognitionMax(addKey)) return;
          state.push({ title: "", url: "" });
          renderRecognitionGroupRows(addKey);
          applyTierFieldState();
          return;
        }
        const removeAttr = target.getAttribute("data-remove-recognition");
        if (!removeAttr) return;
        const [groupKey, indexRaw] = removeAttr.split(":");
        const index = Number(indexRaw);
        const state = recognitionRowsState[groupKey];
        if (!state || !Number.isFinite(index) || state.length <= 1) return;
        state.splice(index, 1);
        renderRecognitionGroupRows(groupKey);
        applyTierFieldState();
      });

      renderRecognitionGroupRows(key);
    });
  }

  function deriveOpenSourceFromLicense(license, licenseOther) {
    const value = String(license || "").trim();
    if (!value) return undefined;
    if (value === "proprietary") return false;
    if (value === "other" && /proprietary/i.test(String(licenseOther || ""))) return false;
    return true;
  }

  function updateLicenseOtherVisibility() {
    const licenseEl = root.querySelector("#fides-wallet-license");
    const otherEl = root.querySelector("#fides-wallet-license-other");
    const otherRow = root.querySelector("#fides-wallet-license-other-row");
    if (!licenseEl || !otherEl) return;
    const editable = licenseEl.value === "other";
    otherEl.disabled = !editable;
    otherEl.readOnly = !editable;
    otherEl.required = editable;
    otherEl.classList.toggle("fides-input-pro-locked", !editable);
    if (otherRow) {
      otherRow.hidden = !editable;
      otherRow.setAttribute("aria-hidden", editable ? "false" : "true");
      otherRow.classList.toggle("is-hidden", !editable);
    }
    if (!editable) otherEl.value = "";
  }

  function initLicenseOtherVisibility() {
    const licenseEl = root.querySelector("#fides-wallet-license");
    if (licenseEl) {
      licenseEl.addEventListener("change", updateLicenseOtherVisibility);
      updateLicenseOtherVisibility();
    }
  }

  function applyTierFieldState() {
    const isPro = !!planTier.isPro;
    WALLET_PRO_FIELD_IDS.forEach((fieldId) => {
      const el = root.querySelector(`#${fieldId}`);
      if (!el) return;
      el.disabled = !isPro;
      el.readOnly = !isPro;
      el.classList.toggle("fides-input-pro-locked", !isPro);
      const row = el.closest(".fides-form-row");
      if (row) row.classList.toggle("fides-form-row--pro-locked", !isPro);
    });
    root.querySelectorAll(".fides-form-section--pro-tier").forEach((section) => {
      section.classList.toggle("fides-form-section--pro-locked", !isPro);
    });
    root.querySelectorAll(".fides-recognition-group input, .fides-recognition-group .fides-media-action-btn").forEach((el) => {
      el.disabled = !isPro;
    });
    const mediaSection = root.querySelector(".fides-wallet-media-section");
    if (mediaSection) {
      mediaSection.classList.toggle("fides-form-section--pro-locked", !isPro);
      mediaSection.querySelectorAll("input, button").forEach((el) => {
        el.disabled = !isPro;
      });
    }
    updateLicenseOtherVisibility();
    updateWalletDescriptionLimitUi();
    updatePlanTierBanner();
    updateProFieldLabels();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function helpText(key) {
    const text = fieldHelp[key];
    return typeof text === "string" ? text.trim() : "";
  }

  function helpHtml(key) {
    const text = helpText(key);
    return text ? `<p class="fides-help">${escapeHtml(text)}</p>` : "";
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function enumList(key) {
    return Array.isArray(enums[key]) ? enums[key] : [];
  }

  function enumLabelList(key) {
    const labels = enumLabels[key];
    return labels && typeof labels === "object" ? labels : {};
  }

  function enumTitleList(key) {
    const titles = enumTitles[key];
    return titles && typeof titles === "object" ? titles : {};
  }

  function enumDisplayLabel(fieldKey, value) {
    const labels = enumLabelList(fieldKey);
    return labels[value] || value;
  }

  function checkboxGroupHtml(name, values, idPrefix, labels) {
    const labelMap = labels && typeof labels === "object" ? labels : {};
    return values
      .map((value) => {
        const display = labelMap[value] || value;
        return `
        <label class="fides-form-choice">
          <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}" data-field="${escapeHtml(idPrefix)}" />
          <span>${escapeHtml(display)}</span>
        </label>`;
      })
      .join("");
  }

  function eidasTrustServicesForWalletType(walletType) {
    const typeKey = walletType === "organizational" ? "organizational" : "personal";
    const allowed = eidasTrustServicesByType[typeKey];
    return Array.isArray(allowed) && allowed.length ? allowed : enumList("eidasTrustServices");
  }

  function renderEidasTrustServiceChoices() {
    const container = root.querySelector("#fides-wallet-eidas-trust-services-choices");
    if (!container) return;
    const typeEl = root.querySelector("#fides-wallet-type");
    const walletType = typeEl ? String(typeEl.value || "personal") : "personal";
    const values = eidasTrustServicesForWalletType(walletType);
    const allowed = new Set(values);
    const checked = new Set(getCheckedValues("eidasTrustServices"));
    checked.forEach((value) => {
      if (!allowed.has(value)) checked.delete(value);
    });
    const abbrLabels = enumLabelList("eidasTrustServices");
    const fullTitles = enumTitleList("eidasTrustServices");
    container.innerHTML = values
      .map((value) => {
        const display = abbrLabels[value] || value;
        const title = fullTitles[value] || display;
        const isChecked = checked.has(value);
        return `
        <label class="fides-form-choice" title="${escapeHtml(title)}">
          <input type="checkbox" name="eidasTrustServices" value="${escapeHtml(value)}" data-field="eidasTrustServices"${isChecked ? " checked" : ""} />
          <span>${escapeHtml(display)}</span>
        </label>`;
      })
      .join("");
  }

  function selectOptionsHtml(values, selected) {
    return values
      .map((value) => {
        const sel = String(selected || "") === value ? " selected" : "";
        return `<option value="${escapeHtml(value)}"${sel}>${escapeHtml(value)}</option>`;
      })
      .join("");
  }

  function labeledSelectOptionsHtml(values, labelMap, selected) {
    const labels = labelMap && typeof labelMap === "object" ? labelMap : {};
    return values
      .map((value) => {
        const sel = String(selected || "") === value ? " selected" : "";
        const label = labels[value] || value;
        return `<option value="${escapeHtml(value)}"${sel}>${escapeHtml(label)}</option>`;
      })
      .join("");
  }

  function accordionSection(title, intro, bodyHtml, extraClass) {
    const introHtml = intro ? `<p class="fides-form-section-intro">${escapeHtml(intro)}</p>` : "";
    const sectionClass = extraClass ? ` fides-form-accordion ${extraClass}` : " fides-form-accordion";
    return `
      <details class="fides-form-section${sectionClass}">
        <summary class="fides-form-accordion-summary">
          <span class="fides-form-accordion-heading">
            <span class="fides-form-section-title">${escapeHtml(title)}</span>
            <span class="fides-form-accordion-badge">Optional</span>
          </span>
          <span class="fides-form-accordion-chevron" aria-hidden="true"></span>
        </summary>
        <div class="fides-form-accordion-panel">
          ${introHtml}
          <div class="fides-form-section-body">
            ${bodyHtml}
          </div>
        </div>
      </details>`;
  }

  function submissionItemUrl(walletId) {
    const id = String(walletId || "").trim();
    if (!/^[a-z0-9-]+$/.test(id)) return "";
    return `${apiBase}/submissions/wallet/${encodeURIComponent(id)}`;
  }

  function formOrgPickerHtml() {
    return `
        <div id="fides-wallet-org-picker" class="fides-form-section-body fides-org-update-picker-body">
          <div id="fides-wallet-org-search-block" class="fides-linked-field">
            <label for="fides-wallet-org-search">Organization *</label>
            ${helpHtml("orgSearch")}
            <div class="fides-linked-inputs">
              <input id="fides-wallet-org-search" type="text" autocomplete="off" placeholder="Start typing organization name…" />
            </div>
            <div class="fides-lookup-panel">
              <p id="fides-wallet-org-hint" class="fides-lookup-hint" hidden></p>
              <ul id="fides-wallet-org-results" class="fides-lookup-results" role="listbox" aria-label="Organization search results"></ul>
            </div>
          </div>
          <div id="fides-wallet-org-banner" class="fides-update-banner-row" hidden>
            <div class="fides-update-banner">
              <span class="fides-update-banner-label">Organization:</span>
              <strong id="fides-wallet-org-name"></strong>
              <code id="fides-wallet-org-id-display"></code>
              <span id="fides-wallet-org-plan-tier-badge" class="fides-update-banner-plan" hidden></span>
            </div>
            <button type="button" class="fides-secondary-btn" id="fides-wallet-org-change">Choose different</button>
          </div>
        </div>`;
  }

  function recognitionGroupsHtml(keys) {
    const allowed = Array.isArray(keys) ? new Set(keys) : null;
    return RECOGNITION_GROUPS.filter(({ key }) => !allowed || allowed.has(key))
      .map(
      ({ key, label, helpKey }) => `
        <div class="fides-form-row fides-recognition-group fides-form-section--pro-tier" data-recognition-key="${key}">
          <label class="fides-form-label" data-pro-label="${escapeHtml(label)}">${labelWithProIfNeeded(label, true)}</label>
          ${helpHtml(helpKey)}
          <div class="fides-recognition-rows fides-media-rows" id="fides-recognition-${key}" aria-live="polite"></div>
        </div>`
    ).join("");
  }

  function formMediaSectionHtml() {
    return `
        <section class="fides-form-section fides-form-section--pro-tier fides-wallet-media-section" aria-labelledby="fides-wallet-media-section-title" hidden>
          <div class="fides-form-accordion-heading">
            <h3 id="fides-wallet-media-section-title" class="fides-form-section-title" data-pro-label="Media">${labelWithProIfNeeded("Media", true)}</h3>
          </div>
          <p class="fides-form-section-intro">Visuals shown on your public wallet listing — add cover images and optional demo videos.</p>
          <div class="fides-form-section-body fides-media-section-body">
            <div class="fides-form-grid fides-media-grid">
              <div class="fides-media-col">
                <label>Cover images</label>
                <p class="fides-help fides-media-col-help">${escapeHtml(helpText("mediaImages") || "Screenshot or product image URLs.")}</p>
                <div id="fides-wallet-image-rows" class="fides-media-rows" aria-live="polite"></div>
              </div>
              <div class="fides-media-col">
                <label>Demo videos</label>
                <p class="fides-help fides-media-col-help">${escapeHtml(helpText("mediaVideos") || "YouTube or Vimeo links to demos.")}</p>
                <div id="fides-wallet-video-rows" class="fides-media-rows" aria-live="polite"></div>
              </div>
            </div>
            <p id="fides-wallet-image-upload-status" class="fides-lookup-hint" hidden></p>
          </div>
        </section>`;
  }

  function formCoreFieldsHtml() {
    const walletTypes = enumList("walletType");
    const statuses = enumList("status");
    return `
      <div class="fides-form-section-body fides-wallet-fields" hidden>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-name">Wallet name *</label>
            ${helpHtml("name")}
            <input id="fides-wallet-name" name="name" type="text" required maxlength="200" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-id">Wallet id *</label>
            ${helpHtml("id")}
            <input id="fides-wallet-id" name="id" type="text" required maxlength="80" pattern="[a-z0-9-]+" ${mode === "update" ? "readonly aria-readonly=\"true\"" : ""} />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-type">Type *</label>
            ${helpHtml("type")}
            <select id="fides-wallet-type" name="type" required>
              ${labeledSelectOptionsHtml(walletTypes, enumLabelList("walletType"), "personal")}
            </select>
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-status">Status *</label>
            ${helpHtml("status")}
            <select id="fides-wallet-status" name="status" required>
              ${selectOptionsHtml(statuses, "production")}
            </select>
          </div>
        </div>
        <div class="fides-form-row">
          <label for="fides-wallet-description" id="fides-wallet-description-label">Description *</label>
          ${helpHtml("description")}
          <textarea id="fides-wallet-description" name="description" required maxlength="2000" placeholder="Short description of the wallet and its purpose."></textarea>
          <div class="fides-field-meta">
            <p class="fides-description-limit-notice fides-pro-field-notice" id="fides-wallet-description-limit-notice"></p>
            <p class="fides-description-counter" id="fides-wallet-description-counter" aria-live="polite"></p>
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair fides-form-grid-pair--aligned fides-wallet-capabilities-platforms-grid">
          <div class="fides-form-row fides-wallet-capabilities-row" hidden>
            <span class="fides-form-label" id="fides-wallet-capabilities-label">Capabilities (business)</span>
            ${helpHtml("capabilities")}
            <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-capabilities-label">
              ${checkboxGroupHtml("capabilities", enumList("capabilities"), "capabilities")}
            </div>
          </div>
          <div class="fides-form-row fides-wallet-platforms-row">
            <span class="fides-form-label" id="fides-wallet-platforms-label">Platforms *</span>
            ${helpHtml("platforms")}
            <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-platforms-label">
              ${checkboxGroupHtml("platforms", enumList("platforms"), "platforms")}
            </div>
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-logo">Logo URL</label>
            ${helpHtml("logo")}
            <input id="fides-wallet-logo" name="logo" type="url" placeholder="https://…/logo.png" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-website" data-pro-label="Website">${labelWithProIfNeeded("Website", true)}</label>
            ${helpHtml("website")}
            <input id="fides-wallet-website" name="website" type="url" placeholder="https://…" />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair fides-wallet-business-fields-row" hidden aria-hidden="true">
          <div class="fides-form-row">
            <label for="fides-wallet-deployment-model">Deployment model</label>
            ${helpHtml("deploymentModel")}
            <select id="fides-wallet-deployment-model" name="deploymentModel">
              <option value="">—</option>
              ${labeledSelectOptionsHtml(enumList("deploymentModel"), enumLabelList("deploymentModel"), "")}
            </select>
          </div>
          <div class="fides-form-row">
            <span class="fides-form-label" id="fides-wallet-sla-label">SLA available</span>
            ${helpHtml("slaAvailable")}
            <div class="fides-form-choices fides-form-choices-inline" role="group" aria-labelledby="fides-wallet-sla-label">
              <label class="fides-form-choice">
                <input id="fides-wallet-sla-available" name="slaAvailable" type="checkbox" />
                <span>Yes</span>
              </label>
            </div>
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-license">License</label>
            ${helpHtml("license")}
            <select id="fides-wallet-license" name="license">
              <option value="">—</option>
              ${labeledSelectOptionsHtml(enumList("license"), enumLabelList("license"), "")}
            </select>
          </div>
          <div class="fides-form-row" id="fides-wallet-license-other-row">
            <label for="fides-wallet-license-other">License (other)</label>
            ${helpHtml("licenseOther")}
            <input id="fides-wallet-license-other" name="licenseOther" type="text" maxlength="${Number(v2Limits.licenseOther) || 50}" placeholder="Custom license name" disabled />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-documentation" data-pro-label="Documentation URL">${labelWithProIfNeeded("Documentation URL", true)}</label>
            ${helpHtml("documentation")}
            <input id="fides-wallet-documentation" name="documentation" type="url" placeholder="https://…" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-repository" data-pro-label="Repository URL">${labelWithProIfNeeded("Repository URL", true)}</label>
            ${helpHtml("repository")}
            <input id="fides-wallet-repository" name="repository" type="url" placeholder="https://github.com/…" />
          </div>
        </div>
        <div class="fides-form-row fides-form-section--pro-tier">
          <label for="fides-wallet-pricing" data-pro-label="Pricing">${labelWithProIfNeeded("Pricing", true)}</label>
          ${helpHtml("pricing")}
          <textarea id="fides-wallet-pricing" name="pricing" rows="3" maxlength="${Number(v2Limits.pricing) || 1000}" placeholder="e.g. Free for citizens. Enterprise pricing on request."></textarea>
        </div>
        ${
          contactEmail
            ? `<div class="fides-form-row">
          <label for="fides-wallet-contact">Contact email *</label>
          ${helpHtml("contactEmail")}
          <input id="fides-wallet-contact" class="fides-input-locked" type="email" value="${escapeHtml(contactEmail)}" readonly aria-readonly="true" tabindex="-1" />
        </div>`
            : `<p class="fides-form-message is-error">Your WordPress profile must have a valid email address before you can submit.</p>`
        }
        <input type="hidden" id="fides-wallet-org-id" name="orgId" value="" />
      </div>
    `;
  }

  function formAccordionSectionsHtml() {
    return `
        ${accordionSection(
          "Formats & protocols",
          "Credential formats, protocols, and interoperability profiles.",
          `
            <div class="fides-form-row" data-vocab-field="vcFormat">
              <span class="fides-form-label">VC formats</span>
              ${helpHtml("vcFormat")}
              <div class="fides-form-choices">${checkboxGroupHtml("vcFormat", enumList("vcFormat"), "vcFormat", enumLabelList("vcFormat"))}</div>
            </div>
            <div class="fides-form-row" data-vocab-field="issuanceProtocols">
              <span class="fides-form-label">Issuance protocols</span>
              ${helpHtml("issuanceProtocols")}
              <div class="fides-form-choices">${checkboxGroupHtml("issuanceProtocols", enumList("issuanceProtocols"), "issuanceProtocols")}</div>
            </div>
            <div class="fides-form-row" data-vocab-field="presentationProtocols">
              <span class="fides-form-label">Presentation protocols</span>
              ${helpHtml("presentationProtocols")}
              <div class="fides-form-choices">${checkboxGroupHtml("presentationProtocols", enumList("presentationProtocols"), "presentationProtocols")}</div>
            </div>
            <div class="fides-form-row" data-vocab-field="interoperabilityProfiles">
              <span class="fides-form-label">Interop profiles</span>
              ${helpHtml("interoperabilityProfiles")}
              <div class="fides-form-choices">${checkboxGroupHtml("interoperabilityProfiles", enumList("interoperabilityProfiles"), "interoperabilityProfiles")}</div>
            </div>`,
        )}
        ${accordionSection(
          "Keys & identifiers",
          "Cryptographic and identifier details for technical readers.",
          `
            <div class="fides-form-row" data-vocab-field="supportedIdentifiers">
              <span class="fides-form-label" id="fides-wallet-supported-identifiers-label">Identifiers</span>
              ${helpHtml("supportedIdentifiers")}
              <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-supported-identifiers-label">
                ${checkboxGroupHtml("supportedIdentifiers", enumList("supportedIdentifiers"), "supportedIdentifiers")}
              </div>
            </div>
            <div class="fides-form-row" data-vocab-field="keyStorage">
              <span class="fides-form-label">Key storage</span>
              ${helpHtml("keyStorage")}
              <div class="fides-form-choices">${checkboxGroupHtml("keyStorage", enumList("keyStorage"), "keyStorage")}</div>
            </div>
            <div class="fides-form-row" data-vocab-field="signingAlgorithms">
              <span class="fides-form-label" id="fides-wallet-signing-algorithms-label">Signing algorithms</span>
              ${helpHtml("signingAlgorithms")}
              <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-signing-algorithms-label">
                ${checkboxGroupHtml("signingAlgorithms", enumList("signingAlgorithms"), "signingAlgorithms")}
              </div>
            </div>
            <div class="fides-form-row" data-vocab-field="credentialStatusMethods">
              <span class="fides-form-label" id="fides-wallet-credential-status-label">Credential status</span>
              ${helpHtml("credentialStatusMethods")}
              <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-credential-status-label">
                ${checkboxGroupHtml(
                  "credentialStatusMethods",
                  enumList("credentialStatusMethods"),
                  "credentialStatusMethods",
                  enumLabelList("credentialStatusMethods")
                )}
              </div>
            </div>`,
        )}
        ${accordionSection(
          "eIDAS Trust Services",
          "",
          `
            <div class="fides-form-row" data-vocab-field="eidasTrustServices">
              ${helpHtml("eidasTrustServices")}
              <div class="fides-form-choices" id="fides-wallet-eidas-trust-services-choices" role="group" aria-label="eIDAS trust services"></div>
            </div>`,
        )}
        ${accordionSection(
          "Features",
          "Stand-out product capabilities shown on the catalog detail page.",
          `
            <div class="fides-form-row">
              <label for="fides-wallet-standards">Standards</label>
              ${helpHtml("standards")}
              <input id="fides-wallet-standards" name="standards" type="text" placeholder="ARF 1.4" />
            </div>
            <div class="fides-form-row fides-form-section--pro-tier">
              <label for="fides-wallet-features" data-pro-label="Features">${labelWithProIfNeeded("Features", true)}</label>
              ${helpHtml("features")}
              <input id="fides-wallet-features" name="features" type="text" placeholder="Biometric authentication, QR scanning" />
            </div>`,
        )}
        ${accordionSection(
          "Additional product information",
          "Extra product links shown in the wallet modal. Product page and documentation URL are configured above; add more documentation rows here.",
          recognitionGroupsHtml(["additionalDocumentation"]),
        )}
        ${accordionSection(
          "Recognitions",
          "Trust signals about this wallet: customer references, product certifications, and awards. Each row needs a title; a link is optional.",
          recognitionGroupsHtml(["customerStories", "certifications", "awardsAndRecognitions"]),
        )}
        ${accordionSection(
          "App store links",
          "Links to download native apps or open the web wallet in a browser.",
          `
            <div class="fides-form-grid fides-form-grid-pair fides-form-section--pro-tier">
              <div class="fides-form-row">
                <label for="fides-wallet-ios" data-pro-label="iOS App Store">${labelWithProIfNeeded("iOS App Store", true)}</label>
                <input id="fides-wallet-ios" name="appStoreIos" type="url" placeholder="https://apps.apple.com/…" />
              </div>
              <div class="fides-form-row">
                <label for="fides-wallet-android" data-pro-label="Google Play">${labelWithProIfNeeded("Google Play", true)}</label>
                <input id="fides-wallet-android" name="appStoreAndroid" type="url" placeholder="https://play.google.com/…" />
              </div>
            </div>
            <div class="fides-form-row">
              <label for="fides-wallet-web-url" data-pro-label="Web wallet URL">${labelWithProIfNeeded("Web wallet URL", true)}</label>
              ${helpHtml("appStoreWeb")}
              <input id="fides-wallet-web-url" name="appStoreWeb" type="url" placeholder="https://wallet.example.com" />
            </div>`,
          "fides-wallet-app-store-links-section"
        )}
    `;
  }

  const sectionTitle = mode === "update" ? "Suggest a wallet update" : "Submit a wallet";
  const sectionIntroHtml = sectionIntro
    ? `<p class="fides-form-section-intro">${escapeHtml(sectionIntro)}</p>`
    : "";

  root.innerHTML = `
    <section class="fides-use-case-card">
      <form id="fides-wallet-form" class="fides-use-case-form fides-wallet-form" novalidate>
        <section class="fides-form-section fides-form-section-first" aria-labelledby="fides-wallet-section-title">
          <div class="fides-form-accordion-heading">
            <h3 id="fides-wallet-section-title" class="fides-form-section-title">${escapeHtml(sectionTitle)}</h3>
          </div>
          ${sectionIntroHtml}
          ${
            mode === "update"
              ? `<div id="fides-wallet-update-picker" class="fides-form-section-body fides-org-update-picker-body">
            <div id="fides-wallet-search-block" class="fides-linked-field">
              <label for="fides-wallet-search">Find wallet *</label>
              ${helpHtml("walletSearch")}
              <div class="fides-linked-inputs">
                <input id="fides-wallet-search" type="text" autocomplete="off" placeholder="Start typing…" />
              </div>
              <div class="fides-lookup-panel">
                <p id="fides-wallet-lookup-hint" class="fides-lookup-hint" hidden></p>
                <ul id="fides-wallet-lookup-results" class="fides-lookup-results" role="listbox" aria-label="Search results"></ul>
              </div>
            </div>
            <div id="fides-wallet-update-banner" class="fides-update-banner-row" hidden>
              <div class="fides-update-banner">
                <span class="fides-update-banner-label">Updating:</span>
                <strong id="fides-wallet-update-name"></strong>
                <code id="fides-wallet-update-id"></code>
                <span id="fides-wallet-update-plan-tier-badge" class="fides-update-banner-plan" hidden></span>
              </div>
              <button type="button" class="fides-secondary-btn" id="fides-wallet-change">Choose different</button>
            </div>
          </div>`
              : mode === "create"
                ? formOrgPickerHtml()
                : ""
          }
          ${formCoreFieldsHtml()}
        </section>
        ${formMediaSectionHtml()}
        <div class="fides-wallet-optional-sections" hidden>
          ${formAccordionSectionsHtml()}
        </div>
        <div id="fides-wallet-submit-block" class="fides-org-submit-block" hidden>
          <div class="fides-consent">
            <label><input type="checkbox" name="consentPublish" required /> I confirm this information may be published *</label>
          </div>
          <div class="fides-form-actions">
            <button type="submit">${mode === "update" ? "Submit update proposal" : "Submit wallet"}</button>
          </div>
        </div>
        <p id="fides-wallet-form-message" class="fides-form-message" aria-live="polite"></p>
      </form>
    </section>
  `;

  const form = root.querySelector("#fides-wallet-form");
  const messageEl = root.querySelector("#fides-wallet-form-message");
  const fieldsWrap = root.querySelector(".fides-wallet-fields");
  const nameInput = root.querySelector("#fides-wallet-name");
  const idInput = root.querySelector("#fides-wallet-id");
  const orgIdInput = root.querySelector("#fides-wallet-org-id");
  const submitBlock = root.querySelector("#fides-wallet-submit-block");
  const searchInput = root.querySelector("#fides-wallet-search");
  const lookupResults = root.querySelector("#fides-wallet-lookup-results");
  const lookupHint = root.querySelector("#fides-wallet-lookup-hint");
  const updateBanner = root.querySelector("#fides-wallet-update-banner");
  const searchBlock = root.querySelector("#fides-wallet-search-block");
  const updateNameEl = root.querySelector("#fides-wallet-update-name");
  const updateIdEl = root.querySelector("#fides-wallet-update-id");
  const changeBtn = root.querySelector("#fides-wallet-change");
  const imageRowsEl = root.querySelector("#fides-wallet-image-rows");
  const videoRowsEl = root.querySelector("#fides-wallet-video-rows");
  const imageUploadStatusEl = root.querySelector("#fides-wallet-image-upload-status");
  const imageRowsState = [{ url: "" }];
  const videoRowsState = [{ url: "" }];

  function mediaImageMax() {
    return Number(v2Limits.mediaImages) || 10;
  }

  function mediaVideoMax() {
    return Number(v2Limits.mediaVideos) || 3;
  }

  function collectMediaUrls(state) {
    return state.map((entry) => String(entry.url || "").trim()).filter(Boolean);
  }

  function setImageUploadStatus(text) {
    if (!imageUploadStatusEl) return;
    if (!text) {
      imageUploadStatusEl.hidden = true;
      imageUploadStatusEl.textContent = "";
      return;
    }
    imageUploadStatusEl.hidden = false;
    imageUploadStatusEl.textContent = text;
  }

  function renderImageRows() {
    if (!imageRowsEl) return;
    const max = mediaImageMax();
    const lastIndex = imageRowsState.length - 1;
    imageRowsEl.innerHTML = imageRowsState
      .map((entry, index) => {
        const isLast = index === lastIndex;
        const canAdd = imageRowsState.length < max;
        let rowAction = "";
        if (isLast && canAdd) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-add-image="1">Add</button>`;
        } else if (!isLast || imageRowsState.length > 1) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-remove-image="${index}" aria-label="Remove image">Remove</button>`;
        }
        return `
          <div class="fides-media-row" data-image-index="${index}">
            <div class="fides-media-inputs fides-media-inputs--image">
              <input type="url" class="fides-media-url-input" data-image-url="${index}" value="${escapeHtml(entry.url || "")}" placeholder="https://…" inputmode="url" autocomplete="url" />
              <label class="fides-secondary-btn fides-media-action-btn fides-upload-btn">
                Upload
                <input type="file" data-image-file="${index}" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
              </label>
              ${rowAction}
            </div>
            ${
              entry.url
                ? `<div class="fides-image-preview"><img src="${escapeHtml(entry.url)}" alt="Image preview" loading="lazy" /></div>`
                : ""
            }
          </div>`;
      })
      .join("");
  }

  function renderVideoRows() {
    if (!videoRowsEl) return;
    const max = mediaVideoMax();
    const lastIndex = videoRowsState.length - 1;
    videoRowsEl.innerHTML = videoRowsState
      .map((entry, index) => {
        const isLast = index === lastIndex;
        const canAdd = videoRowsState.length < max;
        let rowAction = "";
        if (isLast && canAdd) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-add-video="1">Add</button>`;
        } else if (!isLast || videoRowsState.length > 1) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-remove-video="${index}" aria-label="Remove video">Remove</button>`;
        }
        return `
          <div class="fides-media-row" data-video-index="${index}">
            <div class="fides-media-inputs fides-media-inputs--video">
              <input type="url" class="fides-media-url-input" data-video-url="${index}" value="${escapeHtml(entry.url || "")}" placeholder="https://youtube.com/…" inputmode="url" autocomplete="url" />
              ${rowAction}
            </div>
          </div>`;
      })
      .join("");
  }

  function setMediaRowsFromUrls(images, videos) {
    imageRowsState.length = 0;
    const imageUrls = (Array.isArray(images) ? images : []).slice(0, mediaImageMax());
    if (imageUrls.length) {
      imageUrls.forEach((url) => imageRowsState.push({ url: String(url) }));
    } else {
      imageRowsState.push({ url: "" });
    }
    videoRowsState.length = 0;
    const videoUrls = (Array.isArray(videos) ? videos : []).slice(0, mediaVideoMax());
    if (videoUrls.length) {
      videoUrls.forEach((url) => videoRowsState.push({ url: String(url) }));
    } else {
      videoRowsState.push({ url: "" });
    }
    renderImageRows();
    renderVideoRows();
    setImageUploadStatus("");
  }

  async function uploadImageFile(file, rowIndex) {
    if (!file || !apiBase) {
      setImageUploadStatus("Missing API configuration.");
      return;
    }
    setImageUploadStatus("Uploading…");
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(`${apiBase}/submissions/card-image`, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: formData,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setImageUploadStatus(json.message || "Image upload failed.");
        return;
      }
      const url = json.url ? String(json.url) : "";
      if (!url) {
        setImageUploadStatus("Upload succeeded but no URL was returned.");
        return;
      }
      if (imageRowsState[rowIndex]) {
        imageRowsState[rowIndex].url = url;
      }
      renderImageRows();
      applyTierFieldState();
      setImageUploadStatus("Image uploaded.");
    } catch (_err) {
      setImageUploadStatus("Image upload failed due to a network error.");
    }
  }

  function initWalletMediaControls() {
    renderImageRows();
    renderVideoRows();

    if (imageRowsEl) {
      imageRowsEl.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-image-url")) return;
        const index = Number(target.getAttribute("data-image-url"));
        if (!Number.isFinite(index) || !imageRowsState[index]) return;
        imageRowsState[index].url = target.value.trim();
        renderImageRows();
        applyTierFieldState();
      });

      imageRowsEl.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-image-file")) return;
        const index = Number(target.getAttribute("data-image-file"));
        const file = target.files && target.files[0];
        target.value = "";
        if (!Number.isFinite(index) || !file) return;
        uploadImageFile(file, index);
      });

      imageRowsEl.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-add-image")) {
          if (imageRowsState.length >= mediaImageMax()) return;
          imageRowsState.push({ url: "" });
          renderImageRows();
          applyTierFieldState();
          return;
        }
        const indexAttr = target.getAttribute("data-remove-image");
        if (indexAttr == null) return;
        const index = Number(indexAttr);
        if (!Number.isFinite(index) || imageRowsState.length <= 1) return;
        imageRowsState.splice(index, 1);
        renderImageRows();
        applyTierFieldState();
      });
    }

    if (videoRowsEl) {
      videoRowsEl.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-video-url")) return;
        const index = Number(target.getAttribute("data-video-url"));
        if (!Number.isFinite(index) || !videoRowsState[index]) return;
        videoRowsState[index].url = target.value.trim();
      });

      videoRowsEl.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-add-video")) {
          if (videoRowsState.length >= mediaVideoMax()) return;
          videoRowsState.push({ url: "" });
          renderVideoRows();
          applyTierFieldState();
          return;
        }
        const indexAttr = target.getAttribute("data-remove-video");
        if (indexAttr == null) return;
        const index = Number(indexAttr);
        if (!Number.isFinite(index) || videoRowsState.length <= 1) return;
        videoRowsState.splice(index, 1);
        renderVideoRows();
        applyTierFieldState();
      });
    }
  }

  initRecognitionControls();
  initLicenseOtherVisibility();
  initWalletMediaControls();
  applyTierFieldState();
  updateWalletTypeDependentFields();

  const walletDescInput = root.querySelector("#fides-wallet-description");
  if (walletDescInput) {
    walletDescInput.addEventListener("input", updateWalletDescriptionCounter);
    updateWalletDescriptionCounter();
  }

  function setMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.className = `fides-form-message ${type ? `is-${type}` : ""}`.trim();
    if (type === "error" && text) {
      messageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function fieldLabelForControl(el) {
    if (!(el instanceof HTMLElement)) return "";
    const row = el.closest(".fides-form-row, .fides-linked-field, .fides-consent");
    if (!row) return "";
    const label = row.querySelector(":scope > label, :scope > .fides-form-label");
    return label ? String(label.textContent || "").replace(/\*/g, "").trim() : "";
  }

  function openValidationAncestors(el) {
    let node = el instanceof HTMLElement ? el : null;
    while (node) {
      if (node instanceof HTMLDetailsElement && !node.open) {
        node.open = true;
      }
      if (node.hidden && node.classList) {
        if (
          node.classList.contains("fides-wallet-fields") ||
          node.classList.contains("fides-wallet-media-section") ||
          node.classList.contains("fides-wallet-optional-sections")
        ) {
          node.hidden = false;
        }
      }
      node = node.parentElement;
    }
  }

  function clearValidationHighlights() {
    form.querySelectorAll(
      ".fides-form-row--invalid, .fides-form-choices--invalid, .fides-linked-field--invalid, .fides-consent--invalid"
    ).forEach((row) => {
      row.classList.remove(
        "fides-form-row--invalid",
        "fides-form-choices--invalid",
        "fides-linked-field--invalid",
        "fides-consent--invalid"
      );
    });
    form.querySelectorAll(".fides-form-field-invalid").forEach((el) => {
      el.classList.remove("fides-form-field-invalid");
      el.removeAttribute("aria-invalid");
    });
  }

  function validateLicenseOtherField() {
    updateLicenseOtherVisibility();
    const licenseEl = root.querySelector("#fides-wallet-license");
    const otherEl = root.querySelector("#fides-wallet-license-other");
    if (!licenseEl || !otherEl || licenseEl.value !== "other") return true;
    if (String(otherEl.value || "").trim()) return true;
    otherEl.disabled = false;
    otherEl.readOnly = false;
    otherEl.required = true;
    highlightInvalidControl(otherEl, 'Please specify the license when "Other" is selected.');
    return false;
  }

  function highlightInvalidControl(el, message) {
    clearValidationHighlights();
    if (!(el instanceof HTMLElement)) {
      if (message) setMessage(message, "error");
      return;
    }
    openValidationAncestors(el);
    const row = el.closest(".fides-form-row, .fides-linked-field, .fides-consent");
    const choices = el.closest(".fides-form-choices");
    if (choices) {
      choices.classList.add("fides-form-choices--invalid");
      const choicesRow = choices.closest(".fides-form-row, .fides-linked-field");
      if (choicesRow) {
        choicesRow.classList.add(
          choicesRow.classList.contains("fides-linked-field") ? "fides-linked-field--invalid" : "fides-form-row--invalid"
        );
      }
    } else if (row) {
      if (row.classList.contains("fides-consent")) {
        row.classList.add("fides-consent--invalid");
      } else if (row.classList.contains("fides-linked-field")) {
        row.classList.add("fides-linked-field--invalid");
      } else {
        row.classList.add("fides-form-row--invalid");
      }
    }
    if (el.matches("input, select, textarea")) {
      el.classList.add("fides-form-field-invalid");
      el.setAttribute("aria-invalid", "true");
      if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const label = fieldLabelForControl(el);
    setMessage(message || (label ? `Please complete: ${label}` : "Please complete all required fields."), "error");
  }

  function highlightInvalidRow(row, message) {
    clearValidationHighlights();
    if (!(row instanceof HTMLElement)) {
      setMessage(message || "Please complete required fields.", "error");
      return;
    }
    openValidationAncestors(row);
    row.classList.add(row.classList.contains("fides-linked-field") ? "fides-linked-field--invalid" : "fides-form-row--invalid");
    const choices = row.querySelector(".fides-form-choices");
    if (choices) choices.classList.add("fides-form-choices--invalid");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    setMessage(message || "Please complete required fields.", "error");
  }

  function firstInvalidControl() {
    const controls = form.querySelectorAll("input, select, textarea");
    for (const el of controls) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) {
        continue;
      }
      if (el.disabled || el.type === "hidden" || el.type === "file") continue;
      if (!el.checkValidity()) return el;
    }
    return null;
  }

  function getCheckedValues(name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => String(el.value));
  }

  function setCheckedValues(name, values) {
    const set = new Set((values || []).map(String));
    form.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      el.checked = set.has(String(el.value));
    });
  }

  function parseListInput(value) {
    return String(value || "")
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function listToInput(values) {
    return Array.isArray(values) ? values.join(", ") : "";
  }

  function updateWalletTypeDependentFields() {
    const typeEl = root.querySelector("#fides-wallet-type");
    const isBusiness = typeEl && typeEl.value === "organizational";

    const capabilitiesRow = root.querySelector(".fides-wallet-capabilities-row");
    const platformsRow = root.querySelector(".fides-wallet-platforms-row");
    const capabilitiesPlatformsGrid = root.querySelector(".fides-wallet-capabilities-platforms-grid");
    if (capabilitiesRow) {
      capabilitiesRow.hidden = !isBusiness;
      capabilitiesRow.setAttribute("aria-hidden", isBusiness ? "false" : "true");
      capabilitiesRow.classList.toggle("is-hidden", !isBusiness);
      capabilitiesRow.querySelectorAll('input[name="capabilities"]').forEach((el) => {
        el.disabled = !isBusiness;
        if (!isBusiness) el.checked = false;
      });
    }
    if (platformsRow) {
      platformsRow.hidden = isBusiness;
      platformsRow.setAttribute("aria-hidden", isBusiness ? "true" : "false");
      platformsRow.classList.toggle("is-hidden", isBusiness);
      platformsRow.querySelectorAll('input[name="platforms"]').forEach((el) => {
        el.disabled = isBusiness;
        if (isBusiness) el.checked = false;
      });
      if (!isBusiness) {
        setCheckedValues("platforms", preservedPlatforms);
      }
    }
    if (capabilitiesPlatformsGrid) {
      capabilitiesPlatformsGrid.classList.toggle("fides-wallet-capabilities-platforms-grid--platforms-only", !isBusiness);
      capabilitiesPlatformsGrid.classList.toggle("fides-wallet-capabilities-platforms-grid--capabilities-only", isBusiness);
    }

    const businessRow = root.querySelector(".fides-wallet-business-fields-row");
    if (businessRow) {
      businessRow.hidden = !isBusiness;
      businessRow.setAttribute("aria-hidden", isBusiness ? "false" : "true");
      businessRow.classList.toggle("is-hidden", !isBusiness);
      const deployEl = root.querySelector("#fides-wallet-deployment-model");
      const slaEl = root.querySelector("#fides-wallet-sla-available");
      if (deployEl) {
        deployEl.disabled = !isBusiness;
        if (!isBusiness) deployEl.value = "";
      }
      if (slaEl) {
        slaEl.disabled = !isBusiness;
        if (!isBusiness) slaEl.checked = false;
      }
    }

    const appStoreLinksSection = root.querySelector(".fides-wallet-app-store-links-section");
    if (appStoreLinksSection) {
      appStoreLinksSection.hidden = isBusiness;
      appStoreLinksSection.setAttribute("aria-hidden", isBusiness ? "true" : "false");
      appStoreLinksSection.classList.toggle("is-hidden", isBusiness);
      if (isBusiness && appStoreLinksSection.open) appStoreLinksSection.open = false;
      ["#fides-wallet-ios", "#fides-wallet-android", "#fides-wallet-web-url"].forEach((selector) => {
        const el = root.querySelector(selector);
        if (!el) return;
        el.disabled = isBusiness;
        if (isBusiness) el.value = "";
      });
      if (!isBusiness) {
        const ios = root.querySelector("#fides-wallet-ios");
        const android = root.querySelector("#fides-wallet-android");
        const web = root.querySelector("#fides-wallet-web-url");
        if (ios) ios.value = preservedAppStoreLinks.iOS || "";
        if (android) android.value = preservedAppStoreLinks.android || "";
        if (web) web.value = preservedAppStoreLinks.web || "";
      }
    }

    renderEidasTrustServiceChoices();
  }

  function fillForm(payload) {
    if (!payload || typeof payload !== "object") return;
    if (nameInput) nameInput.value = payload.name || "";
    if (idInput) idInput.value = payload.id || "";
    if (orgIdInput) orgIdInput.value = payload.orgId || "";
    selectedOrgId = payload.orgId || selectedOrgId;
    const typeEl = root.querySelector("#fides-wallet-type");
    const statusEl = root.querySelector("#fides-wallet-status");
    if (typeEl) typeEl.value = payload.type || "personal";
    if (statusEl) statusEl.value = payload.status || "production";
    updateWalletTypeDependentFields();
    const descEl = root.querySelector("#fides-wallet-description");
    if (descEl) {
      descEl.value = payload.description || "";
      updateWalletDescriptionCounter();
    }
    const setVal = (sel, key) => {
      const el = root.querySelector(sel);
      if (el) el.value = payload[key] || "";
    };
    setVal("#fides-wallet-website", "website");
    setVal("#fides-wallet-logo", "logo");
    const media = payload.media && typeof payload.media === "object" ? payload.media : {};
    let videos = Array.isArray(media.videos) ? media.videos : [];
    if (!videos.length && payload.video) {
      videos = [String(payload.video)];
    }
    setMediaRowsFromUrls(Array.isArray(media.images) ? media.images : [], videos);
    setVal("#fides-wallet-documentation", "documentation");
    const licenseEl = root.querySelector("#fides-wallet-license");
    if (licenseEl) licenseEl.value = payload.license || "";
    setVal("#fides-wallet-license-other", "licenseOther");
    updateLicenseOtherVisibility();
    const deployEl = root.querySelector("#fides-wallet-deployment-model");
    if (deployEl) deployEl.value = payload.deploymentModel || "";
    const slaEl = root.querySelector("#fides-wallet-sla-available");
    if (slaEl) slaEl.checked = Boolean(payload.slaAvailable);
    setVal("#fides-wallet-pricing", "pricing");
    setVal("#fides-wallet-repository", "repository");
    preservedPlatforms = Array.isArray(payload.platforms) ? [...payload.platforms] : [];
    setCheckedValues("platforms", payload.platforms || []);
    setCheckedValues("vcFormat", payload.vcFormat || []);
    setCheckedValues("issuanceProtocols", payload.issuanceProtocols || []);
    setCheckedValues("presentationProtocols", payload.presentationProtocols || []);
    setCheckedValues("interoperabilityProfiles", payload.interoperabilityProfiles || []);
    if (typeEl && typeEl.value === "organizational") {
      setCheckedValues("capabilities", payload.capabilities || []);
    }
    setCheckedValues("keyStorage", payload.keyStorage || []);
    setCheckedValues(
      "supportedIdentifiers",
      payload.supportedIdentifiers || payload.didMethods || []
    );
    setCheckedValues("signingAlgorithms", payload.signingAlgorithms || []);
    setCheckedValues("credentialStatusMethods", payload.credentialStatusMethods || []);
    setCheckedValues("eidasTrustServices", payload.eidasTrustServices || []);
    renderEidasTrustServiceChoices();
    const st = root.querySelector("#fides-wallet-standards");
    if (st) st.value = listToInput(payload.standards);
    const ft = root.querySelector("#fides-wallet-features");
    if (ft) ft.value = listToInput(payload.features);
    const rec =
      payload.recognitions && typeof payload.recognitions === "object" ? { ...payload.recognitions } : {};
    if (
      (!rec.certifications || !rec.certifications.length) &&
      Array.isArray(payload.certifications) &&
      payload.certifications.length
    ) {
      rec.certifications = payload.certifications.map((title) => ({ title: String(title) }));
    }
    setRecognitionRowsFromPayload({ ...payload, recognitions: rec });
    const links = payload.appStoreLinks && typeof payload.appStoreLinks === "object" ? payload.appStoreLinks : {};
    preservedAppStoreLinks = {
      iOS: String(links.iOS || links.ios || "").trim(),
      android: String(links.android || "").trim(),
      web: String(links.web || "").trim(),
    };
    setVal("#fides-wallet-ios", "iOS");
    const ios = root.querySelector("#fides-wallet-ios");
    if (ios) ios.value = links.iOS || "";
    const android = root.querySelector("#fides-wallet-android");
    if (android) android.value = links.android || "";
    const web = root.querySelector("#fides-wallet-web-url");
    if (web) web.value = links.web || "";
    updateWalletTypeDependentFields();
    applyTierFieldState();
  }

  function buildPayload() {
    const walletType = root.querySelector("#fides-wallet-type")
      ? String(root.querySelector("#fides-wallet-type").value || "").trim()
      : "";
    const links = {};
    const ios = root.querySelector("#fides-wallet-ios");
    const android = root.querySelector("#fides-wallet-android");
    const web = root.querySelector("#fides-wallet-web-url");
    if (walletType !== "organizational") {
      if (ios && ios.value.trim()) links.iOS = ios.value.trim();
      if (android && android.value.trim()) links.android = android.value.trim();
      if (web && web.value.trim()) links.web = web.value.trim();
    }

    const videoMax = mediaVideoMax();
    const imageMax = mediaImageMax();
    const videos = collectMediaUrls(videoRowsState).slice(0, videoMax);
    const images = collectMediaUrls(imageRowsState).slice(0, imageMax);

    const payload = {
      orgId: orgIdInput ? String(orgIdInput.value || selectedOrgId || "").trim() : selectedOrgId,
      id: idInput ? String(idInput.value || "").trim() : "",
      name: nameInput ? String(nameInput.value || "").trim() : "",
      type: root.querySelector("#fides-wallet-type") ? String(root.querySelector("#fides-wallet-type").value || "").trim() : "",
      status: root.querySelector("#fides-wallet-status") ? String(root.querySelector("#fides-wallet-status").value || "").trim() : "",
      description: root.querySelector("#fides-wallet-description")
        ? String(root.querySelector("#fides-wallet-description").value || "").trim()
        : "",
      platforms: walletType === "organizational" ? preservedPlatforms : getCheckedValues("platforms"),
      website: root.querySelector("#fides-wallet-website") ? String(root.querySelector("#fides-wallet-website").value || "").trim() : "",
      logo: root.querySelector("#fides-wallet-logo") ? String(root.querySelector("#fides-wallet-logo").value || "").trim() : "",
      documentation: root.querySelector("#fides-wallet-documentation")
        ? String(root.querySelector("#fides-wallet-documentation").value || "").trim()
        : "",
      repository: root.querySelector("#fides-wallet-repository") ? String(root.querySelector("#fides-wallet-repository").value || "").trim() : "",
      vcFormat: getCheckedValues("vcFormat"),
      issuanceProtocols: getCheckedValues("issuanceProtocols"),
      presentationProtocols: getCheckedValues("presentationProtocols"),
      interoperabilityProfiles: getCheckedValues("interoperabilityProfiles"),
    };
    if (walletType === "organizational") {
      payload.capabilities = getCheckedValues("capabilities");
    } else if (walletType === "personal") {
      payload.capabilities = ["holder"];
    }
    Object.assign(payload, {
      keyStorage: getCheckedValues("keyStorage"),
      supportedIdentifiers: getCheckedValues("supportedIdentifiers"),
      signingAlgorithms: getCheckedValues("signingAlgorithms"),
      credentialStatusMethods: getCheckedValues("credentialStatusMethods"),
      eidasTrustServices: getCheckedValues("eidasTrustServices"),
      standards: parseListInput(root.querySelector("#fides-wallet-standards")?.value),
      features: parseListInput(root.querySelector("#fides-wallet-features")?.value),
    });
    const licenseVal = root.querySelector("#fides-wallet-license")
      ? String(root.querySelector("#fides-wallet-license").value || "").trim()
      : "";
    if (licenseVal) payload.license = licenseVal;
    if (licenseVal === "other") {
      payload.licenseOther = root.querySelector("#fides-wallet-license-other")
        ? String(root.querySelector("#fides-wallet-license-other").value || "").trim()
        : "";
    }
    const derivedOpenSource = deriveOpenSourceFromLicense(licenseVal, payload.licenseOther);
    if (derivedOpenSource !== undefined) payload.openSource = derivedOpenSource;
    const deploymentVal = root.querySelector("#fides-wallet-deployment-model")
      ? String(root.querySelector("#fides-wallet-deployment-model").value || "").trim()
      : "";
    if (walletType === "organizational" && deploymentVal) payload.deploymentModel = deploymentVal;
    if (walletType === "organizational" && root.querySelector("#fides-wallet-sla-available")?.checked) {
      payload.slaAvailable = true;
    }
    const pricingVal = root.querySelector("#fides-wallet-pricing")
      ? String(root.querySelector("#fides-wallet-pricing").value || "").trim()
      : "";
    if (pricingVal) payload.pricing = pricingVal;
    if (videos.length || images.length) {
      payload.media = {};
      if (videos.length) payload.media.videos = videos;
      if (images.length) payload.media.images = images;
    }
    const recognitions = {};
    RECOGNITION_GROUPS.forEach(({ key, parentKey }) => {
      const items = readRecognitionGroup(key);
      if (!items.length) return;
      if (parentKey === "recognitions") {
        recognitions[key] = items;
      } else {
        payload[key] = items;
      }
    });
    if (Object.keys(recognitions).length) payload.recognitions = recognitions;
    if (walletType === "organizational") {
      const preservedLinks = {};
      if (preservedAppStoreLinks.iOS) preservedLinks.iOS = preservedAppStoreLinks.iOS;
      if (preservedAppStoreLinks.android) preservedLinks.android = preservedAppStoreLinks.android;
      if (preservedAppStoreLinks.web) preservedLinks.web = preservedAppStoreLinks.web;
      if (Object.keys(preservedLinks).length) payload.appStoreLinks = preservedLinks;
    } else if (Object.keys(links).length) {
      payload.appStoreLinks = links;
    }
    return payload;
  }

  function revealFields(show) {
    if (fieldsWrap) fieldsWrap.hidden = !show;
    const mediaSection = root.querySelector(".fides-wallet-media-section");
    if (mediaSection) mediaSection.hidden = !show;
    const optionalSections = root.querySelector(".fides-wallet-optional-sections");
    if (optionalSections) optionalSections.hidden = !show;
    if (show) updateWalletTypeDependentFields();
  }

  function showUpdateSelectionUi() {
    const hasSelection = Boolean(selectedWalletId);
    if (updateBanner) updateBanner.hidden = !hasSelection;
    if (searchBlock) searchBlock.hidden = hasSelection;
    if (submitBlock && mode === "update") submitBlock.hidden = !hasSelection;
    if (!hasSelection) {
      if (updateNameEl) updateNameEl.textContent = "";
      if (updateIdEl) updateIdEl.textContent = "";
      return;
    }
    if (updateNameEl) updateNameEl.textContent = selectedWalletLabel || selectedWalletId;
    if (updateIdEl) updateIdEl.textContent = selectedWalletId;
    updatePlanTierBanner();
  }

  async function selectWallet(item) {
    selectedWalletId = String(item.id || "").trim();
    selectedWalletLabel = String(item.label || selectedWalletId).trim();
    if (lookupResults) lookupResults.innerHTML = "";
    if (lookupHint) lookupHint.hidden = true;
    showUpdateSelectionUi();
    await loadItemPayload(selectedWalletId);
  }

  function resetUpdateSelection() {
    selectedWalletId = "";
    selectedWalletLabel = "";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    if (lookupResults) lookupResults.innerHTML = "";
    if (lookupHint) lookupHint.hidden = true;
    showUpdateSelectionUi();
    revealFields(false);
    fillForm({});
    setMessage("", "");
  }

  function showOrgSelectionUi() {
    const banner = root.querySelector("#fides-wallet-org-banner");
    const orgSearchBlock = root.querySelector("#fides-wallet-org-search-block");
    const hasSelection = Boolean(selectedOrgId);
    if (banner) banner.hidden = !hasSelection;
    if (orgSearchBlock) orgSearchBlock.hidden = hasSelection;
    if (submitBlock && mode === "create") submitBlock.hidden = !hasSelection;
    if (orgIdInput) orgIdInput.value = selectedOrgId;
    const nameEl = root.querySelector("#fides-wallet-org-name");
    const idEl = root.querySelector("#fides-wallet-org-id-display");
    if (!hasSelection) {
      if (nameEl) nameEl.textContent = "";
      if (idEl) idEl.textContent = "";
      revealFields(false);
      return;
    }
    if (nameEl) nameEl.textContent = selectedOrgLabel || selectedOrgId;
    if (idEl) idEl.textContent = selectedOrgId;
    revealFields(true);
    updatePlanTierBanner();
  }

  async function loadItemPayload(walletId) {
    const url = submissionItemUrl(walletId);
    if (!url) {
      setMessage("Invalid wallet id.", "error");
      return;
    }
    setMessage("Loading wallet details…", "");
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(url, { credentials: "same-origin", headers });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(json.message || "Could not load wallet details.", "error");
        return;
      }
      fillForm(json.payload || {});
      selectedOrgId = json.payload?.orgId || selectedOrgId;
      await refreshPlanTier(selectedOrgId);
      revealFields(true);
      setMessage("", "");
    } catch {
      setMessage("Could not load wallet details due to a network error.", "error");
    }
  }

  async function lookupFetch(type, query) {
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    const response = await fetch(`${apiBase}/lookups/${type}?q=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      headers,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Lookup failed.");
    return {
      content: Array.isArray(json.content) ? json.content : [],
      totalMatches: Number(json.totalMatches) || 0,
    };
  }

  function renderLookupOption(item, idx) {
    const title = escapeHtml(item.label || item.id || "Unnamed");
    const subtitle = item.subtitle ? escapeHtml(item.subtitle) : "";
    return (
      `<li><button type="button" class="fides-lookup-option" data-idx="${idx}" ` +
      `aria-label="Select ${title}${subtitle ? `, ${subtitle}` : ""}">` +
      `<span class="fides-lookup-option-main">` +
      `<span class="fides-lookup-option-title">${title}</span>` +
      (subtitle ? `<span class="fides-lookup-option-subtitle">${subtitle}</span>` : "") +
      `</span>` +
      `<span class="fides-lookup-option-action">Select</span>` +
      `</button></li>`
    );
  }

  function wireLookup(input, resultsEl, hintEl, type, onSelect) {
    if (!input || !resultsEl) return;
    let debounceTimer = null;
    input.addEventListener("input", () => {
      const query = input.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        resultsEl.innerHTML = "";
        if (hintEl) {
          hintEl.hidden = true;
          hintEl.textContent = "";
        }
        if (query.length < 2) return;
        try {
          const { content: items, totalMatches } = await lookupFetch(type, query);
          if (!items.length) {
            if (hintEl) {
              hintEl.hidden = false;
              hintEl.textContent =
                type === "wallet"
                  ? "No matches. Check the spelling or contact us if the wallet is missing."
                  : "No matches.";
            }
            return;
          }
          const total = totalMatches || items.length;
          if (hintEl) {
            hintEl.hidden = false;
            hintEl.textContent =
              total === 1 ? "1 match — click to select" : `${total} matches — click to select`;
          }
          resultsEl.innerHTML = items.map((item, idx) => renderLookupOption(item, idx)).join("");
          resultsEl.querySelectorAll("button[data-idx]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const picked = items[Number(btn.getAttribute("data-idx"))];
              if (picked) onSelect(picked);
            });
          });
        } catch (err) {
          if (hintEl) {
            hintEl.hidden = false;
            hintEl.textContent = err.message || "Lookup failed.";
          }
        }
      }, 250);
    });
  }

  if (mode === "create") {
    showOrgSelectionUi();
    wireLookup(
      root.querySelector("#fides-wallet-org-search"),
      root.querySelector("#fides-wallet-org-results"),
      root.querySelector("#fides-wallet-org-hint"),
      "organization",
      (item) => {
        selectedOrgId = String(item.id || "").trim();
        selectedOrgLabel = String(item.label || selectedOrgId).trim();
        if (root.querySelector("#fides-wallet-org-results")) {
          root.querySelector("#fides-wallet-org-results").innerHTML = "";
        }
        const orgHint = root.querySelector("#fides-wallet-org-hint");
        if (orgHint) orgHint.hidden = true;
        refreshPlanTier(selectedOrgId);
        showOrgSelectionUi();
      }
    );
    const orgChange = root.querySelector("#fides-wallet-org-change");
    if (orgChange) {
      orgChange.addEventListener("click", () => {
        selectedOrgId = "";
        selectedOrgLabel = "";
        const orgSearch = root.querySelector("#fides-wallet-org-search");
        if (orgSearch) {
          orgSearch.value = "";
          orgSearch.focus();
        }
        fillForm({});
        showOrgSelectionUi();
        setMessage("", "");
      });
    }
    if (nameInput && idInput) {
      nameInput.addEventListener("input", () => {
        if (!idInput.value || idInput.dataset.autoId === "1") {
          idInput.value = slugify(nameInput.value);
          idInput.dataset.autoId = "1";
        }
      });
      idInput.addEventListener("input", () => {
        idInput.dataset.autoId = "0";
      });
    }
  }

  if (mode === "update") {
    showUpdateSelectionUi();
    revealFields(false);
    wireLookup(
      searchInput,
      lookupResults,
      lookupHint,
      "wallet",
      (item) => {
        selectWallet(item);
      }
    );
    if (changeBtn) {
      changeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        resetUpdateSelection();
      });
    }
    if (selectedWalletId) {
      selectedWalletLabel = selectedWalletId;
      showUpdateSelectionUi();
      loadItemPayload(selectedWalletId);
    }
  }

  const typeEl = root.querySelector("#fides-wallet-type");
  if (typeEl) {
    typeEl.addEventListener("change", updateWalletTypeDependentFields);
    updateWalletTypeDependentFields();
  }

  form.addEventListener(
    "invalid",
    (event) => {
      event.preventDefault();
      const target = event.target;
      if (target instanceof HTMLElement) {
        highlightInvalidControl(target);
      }
    },
    true
  );

  form.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      target.classList.remove("fides-form-field-invalid");
      const row = target.closest(
        ".fides-form-row--invalid, .fides-form-choices--invalid, .fides-linked-field--invalid, .fides-consent--invalid"
      );
      if (row) {
        row.classList.remove(
          "fides-form-row--invalid",
          "fides-form-choices--invalid",
          "fides-linked-field--invalid",
          "fides-consent--invalid"
        );
      }
      const choices = target.closest(".fides-form-choices--invalid");
      if (choices) choices.classList.remove("fides-form-choices--invalid");
    },
    true
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateLicenseOtherVisibility();
    if (!validateLicenseOtherField()) {
      return;
    }
    const invalidControl = firstInvalidControl();
    if (invalidControl) {
      highlightInvalidControl(invalidControl);
      return;
    }
    if (!contactEmail) {
      setMessage("Your WordPress profile must have a valid email address before submitting.", "error");
      return;
    }
    if (mode === "create" && !selectedOrgId) {
      const orgSearch = root.querySelector("#fides-wallet-org-search");
      highlightInvalidControl(orgSearch || root.querySelector("#fides-wallet-org-search-block"), "Select the organization for this wallet.");
      return;
    }
    if (mode === "update" && !selectedWalletId) {
      const walletSearch = root.querySelector("#fides-wallet-search");
      highlightInvalidControl(walletSearch || root.querySelector("#fides-wallet-search-block"), "Select the wallet you want to update.");
      return;
    }

    const payload = buildPayload();
    if (!payload.orgId) {
      highlightInvalidControl(orgIdInput, "Organization is required.");
      return;
    }
    if (!payload.id || !/^[a-z0-9-]+$/.test(payload.id)) {
      highlightInvalidControl(idInput, "Wallet id is required (lowercase letters, numbers, hyphens).");
      return;
    }
    if (!payload.name) {
      highlightInvalidControl(nameInput, "Wallet name is required.");
      return;
    }
    if (!payload.description) {
      highlightInvalidControl(root.querySelector("#fides-wallet-description"), "Description is required.");
      return;
    }
    if (payload.type === "personal" && !payload.platforms.length) {
      highlightInvalidRow(root.querySelector(".fides-wallet-platforms-row"), "Select at least one platform.");
      return;
    }
    if (payload.license === "other" && !(payload.licenseOther || "").trim()) {
      highlightInvalidControl(root.querySelector("#fides-wallet-license-other"), 'Please specify the license when "Other" is selected.');
      return;
    }

    const url =
      mode === "update" ? submissionItemUrl(selectedWalletId) : `${apiBase}/submissions/wallet`;
    if (!url) {
      setMessage("Invalid wallet id.", "error");
      return;
    }

    setMessage("Submitting…", "");
    const headers = { "Content-Type": "application/json" };
    if (restNonce) headers["X-WP-Nonce"] = restNonce;

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(json.message || "Submission failed.", "error");
        return;
      }
      const ref = json.itemId || json.id || payload.id;
      setMessage(
        mode === "update"
          ? `Update proposal received${ref ? ` for ${ref}` : ""}. It will be reviewed before publication.`
          : `Submission received${ref ? ` (${ref})` : ""}. It will be reviewed before publication.`,
        "success"
      );
      if (mode === "create") {
        form.reset();
        selectedOrgId = "";
        selectedOrgLabel = "";
        showOrgSelectionUi();
      } else {
        selectedWalletId = "";
        selectedWalletLabel = "";
        revealFields(false);
        showUpdateSelectionUi();
      }
    } catch {
      setMessage("Submission failed due to a network error.", "error");
    }
  });

  function isFidesLocalDevHost() {
    try {
      const host = window.location.hostname || "";
      const href = window.location.href || "";
      return host.includes(".local") || href.includes(".local");
    } catch (_err) {
      return false;
    }
  }

  async function loadVocabulary(primaryUrl, fallbackUrl) {
    let first = primaryUrl;
    let second = fallbackUrl;
    if (isFidesLocalDevHost() && primaryUrl && fallbackUrl) {
      first = fallbackUrl;
      second = primaryUrl;
    }
    const tryLoad = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return data.terms || null;
    };
    if (first) {
      try {
        return await tryLoad(first);
      } catch (e) {
        console.warn("Wallet form vocabulary load failed (first):", e.message);
      }
    }
    if (second) {
      try {
        return await tryLoad(second);
      } catch (e) {
        console.warn("Wallet form vocabulary load failed (second):", e.message);
      }
    }
    return null;
  }

  function hideVocabularyPopup() {
    const overlay = document.querySelector(".fides-vocab-overlay");
    const popup = document.querySelector(".fides-vocab-popup");
    if (overlay) overlay.remove();
    if (popup) popup.remove();
  }

  function formChoiceLabelText(label) {
    const span = label.querySelector("span");
    return span ? span.textContent.trim() : label.textContent.trim();
  }

  function resolveFormOptionVocabKey(fieldKey, value) {
    const vocabGroup = FORM_FIELD_TO_VOCAB[fieldKey] || fieldKey;
    const groupMap = FORM_OPTION_TO_VOCAB[vocabGroup] || FORM_OPTION_TO_VOCAB[fieldKey];
    if (groupMap && groupMap[value] !== undefined) {
      return groupMap[value];
    }
    return value;
  }

  function showFormVocabularyPopup(button, groupEl, fieldKey, vocabKey) {
    hideVocabularyPopup();
    if (!vocabulary) return;
    const groupTerm = vocabulary[vocabKey];
    const labelEl = groupEl.querySelector(
      ".fides-form-label-with-info .fides-form-label, .fides-form-label-with-info label, :scope > .fides-form-label"
    );
    const categoryName = labelEl ? labelEl.textContent.replace(/\s*\*$/, "").trim() : "";
    let html = "";
    if (categoryName) {
      html += '<p class="fides-vocab-popup-title"><strong>' + escapeHtml(categoryName) + "</strong></p>";
    }
    if (groupTerm && groupTerm.description) {
      html += '<p class="fides-vocab-popup-intro">' + escapeHtml(groupTerm.description) + "</p>";
    }
    const choicesEl = groupEl.querySelector(".fides-form-choices");
    if (choicesEl) {
      const labels = choicesEl.querySelectorAll("label.fides-form-choice");
      if (labels.length > 0) {
        const listItems = [];
        labels.forEach((label) => {
          const input = label.querySelector("input");
          const value = input ? String(input.value || "").trim() : "";
          let labelText = formChoiceLabelText(label);
          if (!labelText || labelText === value) {
            labelText = enumDisplayLabel(fieldKey, value);
          }
          const optionVocabKey = resolveFormOptionVocabKey(fieldKey, value);
          const term = optionVocabKey ? vocabulary[optionVocabKey] : null;
          const desc = term && term.description ? escapeHtml(term.description) : "";
          if (desc) {
            listItems.push({ labelText, desc });
          }
        });
        if (listItems.length > 0) {
          html += '<ul class="fides-vocab-popup-list">';
          listItems.forEach((item) => {
            html += "<li><strong>" + escapeHtml(item.labelText) + "</strong>: " + item.desc + "</li>";
          });
          html += "</ul>";
        }
      }
    }
    if (!html) html = "<p>No description available.</p>";

    const popup = document.createElement("div");
    popup.className = "fides-vocab-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "Field explanation");
    popup.innerHTML = html;
    const overlay = document.createElement("div");
    overlay.className = "fides-vocab-overlay";
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    const margin = 20;
    const rect = button.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const left = Math.max(margin, Math.min(rect.right + 40, w - pw - margin));
    const top = Math.max(margin, Math.min((h - ph) / 2, h - ph - margin));
    popup.style.left = left + "px";
    popup.style.top = top + "px";

    setTimeout(() => {
      overlay.classList.add("visible");
      popup.classList.add("visible");
    }, 10);

    const close = (e) => {
      if (e && e.target.closest && e.target.closest(".fides-vocab-popup")) return;
      hideVocabularyPopup();
      document.removeEventListener("click", close, true);
      document.removeEventListener("keydown", onKeydown);
    };
    function onKeydown(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeydown);
    setTimeout(() => document.addEventListener("click", close, true), 0);
  }

  function initFormVocabularyInfo(containerEl) {
    if (!vocabulary) return;
    hideVocabularyPopup();
    containerEl.querySelectorAll(".fides-vocab-info").forEach((btn) => btn.remove());
    containerEl.querySelectorAll(".fides-form-row[data-vocab-field]").forEach((groupEl) => {
      const fieldKey = groupEl.getAttribute("data-vocab-field") || "";
      const vocabKey = FORM_FIELD_TO_VOCAB[fieldKey] || fieldKey;
      if (!vocabulary[vocabKey]) return;
      const labelEl = groupEl.querySelector(":scope > .fides-form-label");
      if (!labelEl) return;

      const infoBtn = document.createElement("button");
      infoBtn.type = "button";
      infoBtn.className = "fides-vocab-info";
      infoBtn.dataset.group = vocabKey;
      infoBtn.setAttribute("aria-label", "Show help for this field");
      infoBtn.setAttribute("title", "Show help");
      infoBtn.textContent = "i";
      infoBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        showFormVocabularyPopup(e.currentTarget, groupEl, fieldKey, vocabKey);
      });

      const parent = labelEl.parentNode;
      if (parent && parent.classList && parent.classList.contains("fides-form-label-with-info")) {
        parent.appendChild(infoBtn);
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "fides-form-label-with-info";
      parent.insertBefore(wrapper, labelEl);
      wrapper.appendChild(labelEl);
      wrapper.appendChild(infoBtn);
    });
  }

  if (VOCABULARY_URL || VOCABULARY_FALLBACK_URL) {
    loadVocabulary(VOCABULARY_URL, VOCABULARY_FALLBACK_URL)
      .then((terms) => {
        vocabulary = terms;
        if (vocabulary) initFormVocabularyInfo(root);
      })
      .catch(() => {});
  }
})();
