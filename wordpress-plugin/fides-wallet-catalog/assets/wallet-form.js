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
  const sectionIntro = String(config.sectionIntro || "").trim();
  const VOCABULARY_URL = config.vocabularyUrl ? String(config.vocabularyUrl) : "";
  const VOCABULARY_FALLBACK_URL = config.vocabularyFallbackUrl ? String(config.vocabularyFallbackUrl) : "";
  let vocabulary = null;

  const FORM_FIELD_TO_VOCAB = {
    vcFormat: "vcFormat",
    issuanceProtocols: "issuanceProtocol",
    presentationProtocols: "presentationProtocol",
    keyStorage: "keyStorage",
    supportedIdentifiers: "identifiers",
    signingAlgorithms: "signingAlgorithm",
    credentialStatusMethods: "credentialStatus",
    interoperabilityProfiles: "interopProfile",
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
  };

  let selectedWalletId = mode === "update" ? String(config.preselectWalletId || "").trim() : "";
  let selectedWalletLabel = "";
  let selectedOrgId = "";
  let selectedOrgLabel = "";

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

  function accordionSection(title, bodyHtml, introText) {
    const intro = introText
      ? `<p class="fides-form-section-intro">${escapeHtml(introText)}</p>`
      : "";
    return `
      <details class="fides-form-section fides-form-accordion">
        <summary class="fides-form-accordion-summary">
          <span class="fides-form-accordion-heading">
            <span class="fides-form-section-title">${escapeHtml(title)}</span>
            <span class="fides-form-accordion-badge">Optional</span>
          </span>
          <span class="fides-form-accordion-chevron" aria-hidden="true"></span>
        </summary>
        <div class="fides-form-accordion-panel">
          ${intro}
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
            </div>
            <button type="button" class="fides-secondary-btn" id="fides-wallet-org-change">Choose different</button>
          </div>
        </div>`;
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
          <label for="fides-wallet-description">Description *</label>
          ${helpHtml("description")}
          <textarea id="fides-wallet-description" name="description" required maxlength="4000"></textarea>
        </div>
        <div class="fides-form-row fides-wallet-capabilities-row" hidden>
          <span class="fides-form-label" id="fides-wallet-capabilities-label">Capabilities (business)</span>
          ${helpHtml("capabilities")}
          <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-capabilities-label">
            ${checkboxGroupHtml("capabilities", enumList("capabilities"), "capabilities")}
          </div>
        </div>
        <div class="fides-form-row">
          <span class="fides-form-label" id="fides-wallet-platforms-label">Platforms *</span>
          ${helpHtml("platforms")}
          <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-platforms-label">
            ${checkboxGroupHtml("platforms", enumList("platforms"), "platforms")}
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-website">Website</label>
            ${helpHtml("website")}
            <input id="fides-wallet-website" name="website" type="url" placeholder="https://…" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-logo">Logo URL</label>
            ${helpHtml("logo")}
            <input id="fides-wallet-logo" name="logo" type="url" placeholder="https://…/logo.png" />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-video">Video URL</label>
            ${helpHtml("video")}
            <input id="fides-wallet-video" name="video" type="url" placeholder="https://…" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-documentation">Documentation URL</label>
            ${helpHtml("documentation")}
            <input id="fides-wallet-documentation" name="documentation" type="url" placeholder="https://…" />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <span class="fides-form-label" id="fides-wallet-open-source-label">Open source</span>
            ${helpHtml("openSource")}
            <div class="fides-form-choices fides-form-choices-inline" role="group" aria-labelledby="fides-wallet-open-source-label">
              <label class="fides-form-choice">
                <input id="fides-wallet-open-source" name="openSource" type="checkbox" />
                <span>Yes</span>
              </label>
            </div>
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-license">License</label>
            ${helpHtml("license")}
            <input id="fides-wallet-license" name="license" type="text" placeholder="Apache-2.0" />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-wallet-repository">Repository URL</label>
            ${helpHtml("repository")}
            <input id="fides-wallet-repository" name="repository" type="url" placeholder="https://github.com/…" />
          </div>
          <div class="fides-form-row">
            <label for="fides-wallet-release-date">Release date</label>
            ${helpHtml("releaseDate")}
            <input id="fides-wallet-release-date" name="releaseDate" type="date" />
          </div>
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
            </div>`,
          "Select the credential formats and protocols this wallet supports."
        )}
        ${accordionSection(
          "Technical details",
          `
            <div class="fides-form-row" data-vocab-field="keyStorage">
              <span class="fides-form-label">Key storage</span>
              ${helpHtml("keyStorage")}
              <div class="fides-form-choices">${checkboxGroupHtml("keyStorage", enumList("keyStorage"), "keyStorage")}</div>
            </div>
            <div class="fides-form-row" data-vocab-field="supportedIdentifiers">
              <span class="fides-form-label" id="fides-wallet-supported-identifiers-label">Supported identifiers</span>
              ${helpHtml("supportedIdentifiers")}
              <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-supported-identifiers-label">
                ${checkboxGroupHtml("supportedIdentifiers", enumList("supportedIdentifiers"), "supportedIdentifiers")}
              </div>
            </div>
            <div class="fides-form-row" data-vocab-field="signingAlgorithms">
              <span class="fides-form-label" id="fides-wallet-signing-algorithms-label">Signing algorithms</span>
              ${helpHtml("signingAlgorithms")}
              <div class="fides-form-choices" role="group" aria-labelledby="fides-wallet-signing-algorithms-label">
                ${checkboxGroupHtml("signingAlgorithms", enumList("signingAlgorithms"), "signingAlgorithms")}
              </div>
            </div>
            <div class="fides-form-row" data-vocab-field="credentialStatusMethods">
              <span class="fides-form-label" id="fides-wallet-credential-status-label">Credential status methods</span>
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
          "Cryptographic and identifier details for technical readers."
        )}
        ${accordionSection(
          "Interop, standards & features",
          `
            <div class="fides-form-row" data-vocab-field="interoperabilityProfiles">
              <span class="fides-form-label">Interoperability profiles</span>
              ${helpHtml("interoperabilityProfiles")}
              <div class="fides-form-choices">${checkboxGroupHtml("interoperabilityProfiles", enumList("interoperabilityProfiles"), "interoperabilityProfiles")}</div>
            </div>
            <div class="fides-form-row">
              <label for="fides-wallet-standards">Standards</label>
              ${helpHtml("standards")}
              <input id="fides-wallet-standards" name="standards" type="text" placeholder="ARF 1.4" />
            </div>
            <div class="fides-form-row">
              <label for="fides-wallet-features">Features</label>
              ${helpHtml("features")}
              <input id="fides-wallet-features" name="features" type="text" placeholder="Biometric authentication, QR scanning" />
            </div>
            <div class="fides-form-row">
              <label for="fides-wallet-certifications">Certifications</label>
              ${helpHtml("certifications")}
              <input id="fides-wallet-certifications" name="certifications" type="text" />
            </div>`,
          "Profiles, standards, and features shown on the catalog detail page."
        )}
        ${accordionSection(
          "App store links",
          `
            <div class="fides-form-grid fides-form-grid-pair">
              <div class="fides-form-row">
                <label for="fides-wallet-ios">iOS App Store</label>
                <input id="fides-wallet-ios" name="appStoreIos" type="url" placeholder="https://apps.apple.com/…" />
              </div>
              <div class="fides-form-row">
                <label for="fides-wallet-android">Google Play</label>
                <input id="fides-wallet-android" name="appStoreAndroid" type="url" placeholder="https://play.google.com/…" />
              </div>
            </div>
            <div class="fides-form-row">
              <label for="fides-wallet-web-install">Web install URL</label>
              <input id="fides-wallet-web-install" name="appStoreWeb" type="url" placeholder="https://…" />
            </div>`,
          "Links where users can install or try the wallet."
        )}
    `;
  }

  const sectionTitle = mode === "update" ? "Suggest a wallet update" : "Submit a wallet";
  const sectionIntroHtml = sectionIntro
    ? `<p class="fides-form-section-intro">${escapeHtml(sectionIntro)}</p>`
    : "";

  root.innerHTML = `
    <section class="fides-use-case-card">
      <form id="fides-wallet-form" class="fides-use-case-form fides-wallet-form">
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

  function setMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.className = `fides-form-message ${type ? `is-${type}` : ""}`.trim();
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

  function updateCapabilitiesVisibility() {
    const row = root.querySelector(".fides-wallet-capabilities-row");
    const typeEl = root.querySelector("#fides-wallet-type");
    if (!row || !typeEl) return;
    const isBusiness = typeEl.value === "organizational";
    row.hidden = !isBusiness;
    row.setAttribute("aria-hidden", isBusiness ? "false" : "true");
    row.classList.toggle("is-hidden", !isBusiness);
    row.querySelectorAll('input[name="capabilities"]').forEach((el) => {
      el.disabled = !isBusiness;
      if (!isBusiness) el.checked = false;
    });
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
    updateCapabilitiesVisibility();
    const descEl = root.querySelector("#fides-wallet-description");
    if (descEl) descEl.value = payload.description || "";
    const setVal = (sel, key) => {
      const el = root.querySelector(sel);
      if (el) el.value = payload[key] || "";
    };
    setVal("#fides-wallet-website", "website");
    setVal("#fides-wallet-logo", "logo");
    setVal("#fides-wallet-video", "video");
    setVal("#fides-wallet-documentation", "documentation");
    setVal("#fides-wallet-license", "license");
    setVal("#fides-wallet-repository", "repository");
    setVal("#fides-wallet-release-date", "releaseDate");
    const osEl = root.querySelector("#fides-wallet-open-source");
    if (osEl) osEl.checked = Boolean(payload.openSource);
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
    const st = root.querySelector("#fides-wallet-standards");
    if (st) st.value = listToInput(payload.standards);
    const ft = root.querySelector("#fides-wallet-features");
    if (ft) ft.value = listToInput(payload.features);
    const cert = root.querySelector("#fides-wallet-certifications");
    if (cert) cert.value = listToInput(payload.certifications);
    const links = payload.appStoreLinks && typeof payload.appStoreLinks === "object" ? payload.appStoreLinks : {};
    setVal("#fides-wallet-ios", "iOS");
    const ios = root.querySelector("#fides-wallet-ios");
    if (ios) ios.value = links.iOS || "";
    const android = root.querySelector("#fides-wallet-android");
    if (android) android.value = links.android || "";
    const web = root.querySelector("#fides-wallet-web-install");
    if (web) web.value = links.web || "";
    updateCapabilitiesVisibility();
  }

  function buildPayload() {
    const links = {};
    const ios = root.querySelector("#fides-wallet-ios");
    const android = root.querySelector("#fides-wallet-android");
    const web = root.querySelector("#fides-wallet-web-install");
    if (ios && ios.value.trim()) links.iOS = ios.value.trim();
    if (android && android.value.trim()) links.android = android.value.trim();
    if (web && web.value.trim()) links.web = web.value.trim();

    const payload = {
      orgId: orgIdInput ? String(orgIdInput.value || selectedOrgId || "").trim() : selectedOrgId,
      id: idInput ? String(idInput.value || "").trim() : "",
      name: nameInput ? String(nameInput.value || "").trim() : "",
      type: root.querySelector("#fides-wallet-type") ? String(root.querySelector("#fides-wallet-type").value || "").trim() : "",
      status: root.querySelector("#fides-wallet-status") ? String(root.querySelector("#fides-wallet-status").value || "").trim() : "",
      description: root.querySelector("#fides-wallet-description")
        ? String(root.querySelector("#fides-wallet-description").value || "").trim()
        : "",
      platforms: getCheckedValues("platforms"),
      website: root.querySelector("#fides-wallet-website") ? String(root.querySelector("#fides-wallet-website").value || "").trim() : "",
      logo: root.querySelector("#fides-wallet-logo") ? String(root.querySelector("#fides-wallet-logo").value || "").trim() : "",
      video: root.querySelector("#fides-wallet-video") ? String(root.querySelector("#fides-wallet-video").value || "").trim() : "",
      documentation: root.querySelector("#fides-wallet-documentation")
        ? String(root.querySelector("#fides-wallet-documentation").value || "").trim()
        : "",
      license: root.querySelector("#fides-wallet-license") ? String(root.querySelector("#fides-wallet-license").value || "").trim() : "",
      repository: root.querySelector("#fides-wallet-repository") ? String(root.querySelector("#fides-wallet-repository").value || "").trim() : "",
      releaseDate: root.querySelector("#fides-wallet-release-date")
        ? String(root.querySelector("#fides-wallet-release-date").value || "").trim()
        : "",
      openSource: Boolean(root.querySelector("#fides-wallet-open-source") && root.querySelector("#fides-wallet-open-source").checked),
      vcFormat: getCheckedValues("vcFormat"),
      issuanceProtocols: getCheckedValues("issuanceProtocols"),
      presentationProtocols: getCheckedValues("presentationProtocols"),
      interoperabilityProfiles: getCheckedValues("interoperabilityProfiles"),
    };
    const walletType = payload.type;
    if (walletType === "organizational") {
      payload.capabilities = getCheckedValues("capabilities");
    }
    Object.assign(payload, {
      keyStorage: getCheckedValues("keyStorage"),
      supportedIdentifiers: getCheckedValues("supportedIdentifiers"),
      signingAlgorithms: getCheckedValues("signingAlgorithms"),
      credentialStatusMethods: getCheckedValues("credentialStatusMethods"),
      standards: parseListInput(root.querySelector("#fides-wallet-standards")?.value),
      features: parseListInput(root.querySelector("#fides-wallet-features")?.value),
      certifications: parseListInput(root.querySelector("#fides-wallet-certifications")?.value),
    });
    if (Object.keys(links).length) payload.appStoreLinks = links;
    return payload;
  }

  function revealFields(show) {
    if (fieldsWrap) fieldsWrap.hidden = !show;
    const optionalSections = root.querySelector(".fides-wallet-optional-sections");
    if (optionalSections) optionalSections.hidden = !show;
    if (show) updateCapabilitiesVisibility();
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
    typeEl.addEventListener("change", updateCapabilitiesVisibility);
    updateCapabilitiesVisibility();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!contactEmail) {
      setMessage("Your WordPress profile must have a valid email address before submitting.", "error");
      return;
    }
    if (mode === "create" && !selectedOrgId) {
      setMessage("Select the organization for this wallet.", "error");
      return;
    }
    if (mode === "update" && !selectedWalletId) {
      setMessage("Select the wallet you want to update.", "error");
      return;
    }

    const payload = buildPayload();
    if (!payload.orgId) {
      setMessage("Organization is required.", "error");
      return;
    }
    if (!payload.id || !/^[a-z0-9-]+$/.test(payload.id)) {
      setMessage("Wallet id is required (lowercase letters, numbers, hyphens).", "error");
      return;
    }
    if (!payload.name) {
      setMessage("Wallet name is required.", "error");
      return;
    }
    if (!payload.description) {
      setMessage("Description is required.", "error");
      return;
    }
    if (!payload.platforms.length) {
      setMessage("Select at least one platform.", "error");
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
