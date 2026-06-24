# FIDES Wallet Catalog Schema Reference

Quick reference for wallet providers to see which fields accept fixed values (enums) vs free text.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Required field |
| 🔒 | Fixed values (enum) - must use exact values listed |
| 📝 | Free text |
| 🔗 | URL format |
| 📧 | Email format |
| 🆔 | Pattern-based (regex) |

---

## Catalog root

| Field | Required | Type | Valid Values |
|-------|----------|------|--------------|
| `orgId` | ✅ | 🆔 | Organization catalog id: `org:` + slug (e.g. `org:animo`). Must exist in the FIDES organization catalog. Name, DID, website, logo, country, and contact are resolved at crawl time from there — not duplicated in this file. |

---

## Wallet Fields

| Field | Required | Type | Valid Values |
|-------|----------|------|--------------|
| `id` | ✅ | 🆔 | lowercase, hyphens only (`my-wallet`) |
| `name` | ✅ | 📝 | Any text |
| `type` | ✅ | 🔒 | `personal`, `organizational` |
| `description` | | 📝 | Any text |
| `logo` | | 🔗 | URL |
| `website` | | 🔗 | URL |
| `video` | | 🔗 | URL to demo or promotional video |
| `openSource` | | | `true`, `false` |
| `license` | | 📝 | SPDX format recommended (`MIT`, `Apache-2.0`, `GPL-3.0`, `EUPL-1.2`) |
| `repository` | | 🔗 | URL |
| `releaseDate` | | 🆔 | `YYYY-MM-DD` |
| `createdAt` | | 🔗 | ISO 8601 date-time (optional provider timestamp) |
| `updated` | | 🔗 | ISO 8601 date-time (legacy wallet update key) |
| `updatedAt` | | 🔗 | ISO 8601 date-time (preferred wallet update key) |
| `documentation` | | 🔗 | URL |

---

## Platforms & Status

| Field | Type | Valid Values |
|-------|------|--------------|
| `platforms` | 🔒 | `iOS`, `Android`, `Web`, `Windows`, `macOS`, `Linux`, `CLI` |
| `status` | 🔒 | `development`, `beta`, `production`, `deprecated` |
| `capabilities` | 🔒 | `holder`, `issuer`, `verifier` |

---

## VC formats & protocols

| Field | Type | Valid Values |
|-------|------|--------------|
| `vcFormat` | 🔒 | `sd_jwt_vc`, `mdoc`, `jwt_vc`, `vcdm_1_1`, `vcdm_2_0`, `anoncreds`, `idemix`, `apple_wallet_pass`, `google_wallet_pass`, `acdc` |
| `issuanceProtocols` | 🔒 | `OpenID4VCI`, `DIDComm Issue Credential v1`, `DIDComm Issue Credential v2`, `ISO 18013-5 (Device Retrieval)` |
| `presentationProtocols` | 🔒 | `OpenID4VP`, `DIDComm Present Proof v1`, `DIDComm Present Proof v2`, `ISO 18013-5`, `SIOPv2` |
| `interoperabilityProfiles` | 🔒 | `DIIP v4`, `EWC v3`, `EUDI Wallet ARF`, `HAIP v1` |

**Crawler note:** Until `main` on GitHub contains the same format codes, run `FIDES_WALLET_SKIP_GITHUB_CRAWL=1 npm run crawl` to rebuild `data/aggregated.json` from the local `community-catalogs/` tree only (avoids validating remote JSON against the new schema).

---

## Key Management

| Field | Type | Valid Values |
|-------|------|--------------|
| `keyStorage` | 🔒 | `Software`, `Secure Enclave (iOS)`, `StrongBox (Android)`, `TEE`, `HSM`, `Cloud KMS`, `Smart Card`, `FIDO2/WebAuthn` |
| `signingAlgorithms` | 🔒 | `ES256`, `ES384`, `ES512`, `ES256K`, `EdDSA`, `RS256`, `PS256`, `BBS+`, `ML-DSA (FIPS 204)` |
| `supportedIdentifiers` | 🔒 | Canonical: `did:web`, `did:key`, `did:jwk`, `did:peer`, `did:ebsi`, `did:ion`, `did:cheqd`, `did:webvh`, `did:indy`, `did:ethr`, `did:polygon`, `did:dock`, `did:eth`, `did:gatc`, `did:isbe`, `did:kscirc`, `x509`. Legacy aliases accepted in catalog JSON: `X.509`/`X509` → `x509`, `jwk` → `did:jwk`. |
| `credentialStatusMethods` | 🔒 | Canonical: `StatusList2021`, `RevocationList2020`, `OCSP`, `CRL`, `IETF Token Status List`, `Bitstring Status List`. Legacy aliases: `W3C Verifiable Credentials Status List v2021` → `StatusList2021`, `Token Status List` → `IETF Token Status List`, `BitstringStatusList v1.0` → `Bitstring Status List`. |

---

## Free Text Arrays

| Field | Type | Description |
|-------|------|-------------|
| `certifications` | 📝 | e.g., `EUDI Wallet LSP`, `ISO 27001`, `SOC 2`, `Common Criteria` |
| `standards` | 📝 | e.g., `ARF 1.4`, `mDL ISO 18013-5`, `EBSI` |
| `features` | 📝 | e.g., `Biometric authentication`, `Backup & recovery`, `Multi-device sync`, `Offline support` |

---

## App Store Links

| Field | Type | Description |
|-------|------|-------------|
| `appStoreLinks.iOS` | 🔗 | Apple App Store URL |
| `appStoreLinks.android` | 🔗 | Google Play Store URL |
| `appStoreLinks.web` | 🔗 | Web application URL |

---

## Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "My Company",
    "country": "NL",
    "website": "https://example.com"
  },
  "wallets": [
    {
      "id": "my-wallet",
      "name": "My Wallet",
      "type": "personal",
      "platforms": ["iOS", "Android"],
      "vcFormat": ["sd_jwt_vc", "mdoc"],
      "issuanceProtocols": ["OpenID4VCI"],
      "presentationProtocols": ["OpenID4VP"],
      "status": "production"
    }
  ]
}
```

---

## Full Example

```json
{
  "$schema": "https://fides.community/schemas/wallet-catalog/v1",
  "provider": {
    "name": "Example Corp",
    "website": "https://example.com",
    "logo": "https://example.com/logo.png",
    "country": "NL",
    "contact": {
      "email": "support@example.com",
      "support": "https://example.com/support"
    }
  },
  "wallets": [
    {
      "id": "example-wallet",
      "name": "Example Wallet",
      "description": "A personal wallet for verifiable credentials",
      "type": "personal",
      "logo": "https://example.com/wallet-logo.png",
      "website": "https://example.com/wallet",
      "video": "https://www.youtube.com/watch?v=example",
      "platforms": ["iOS", "Android"],
      "openSource": true,
      "license": "Apache-2.0",
      "repository": "https://github.com/example/wallet",
      "vcFormat": ["sd_jwt_vc", "mdoc"],
      "issuanceProtocols": ["OpenID4VCI"],
      "presentationProtocols": ["OpenID4VP", "ISO 18013-5"],
      "keyStorage": ["Secure Enclave (iOS)", "StrongBox (Android)"],
      "signingAlgorithms": ["ES256", "EdDSA"],
      "interoperabilityProfiles": ["DIIP v4", "EUDI Wallet ARF"],
      "status": "production",
      "appStoreLinks": {
        "iOS": "https://apps.apple.com/app/example-wallet/id123456789",
        "android": "https://play.google.com/store/apps/details?id=com.example.wallet"
      }
    }
  ]
}
```

---

## Need a value added?

If you need a new enum value (e.g., a new credential format or protocol), open an issue or PR on GitHub:
https://github.com/FIDEScommunity/fides-wallet-catalog

## Notes on Crawler-managed Fields

The aggregated output (`data/aggregated.json`) contains additional crawler-managed fields such as:
- `fetchedAt`
- `firstSeenAt`

These are not required in provider `wallet-catalog.json` files.

---

*© 2026 FIDES Labs BV*
