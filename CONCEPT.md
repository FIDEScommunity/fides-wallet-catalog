# FIDES Wallet Catalog - Conceptual Design

## Problem Statement

The FIDES Community currently maintains wallet catalogs manually on their WordPress website. This is:
- Labor-intensive
- Only manageable by FIDES
- Quickly outdated

## Solution: Decentralized Wallet Catalogs

Wallet providers publish their own wallet information in a standardized format, linked to their DID document.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Wallet Provider                               │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │  DID Document   │───▶│  Wallet Catalog Descriptor (JSON)       │ │
│  │  did:web:...    │    │  - List of wallets                      │ │
│  │                 │    │  - Properties per wallet                 │ │
│  │  services: [{   │    │  - Hosted on own domain                  │ │
│  │    type:        │    └─────────────────────────────────────────┘ │
│  │    "WalletCatalog"│                                              │
│  │    endpoint:    │                                                │
│  │    "https://..."│                                                │
│  │  }]             │                                                │
│  └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
           │
           │ (periodic crawling)
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIDES Aggregator Service                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   DID Registry  │───▶│    Crawler      │───▶│   Database      │ │
│  │   (list of DIDs)│    │   (validation)  │    │   (cache)       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
           │
           │ (API / embed)
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FIDES Website (WordPress)                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Wallet Catalog Widget                                          ││
│  │  - Search functionality                                          ││
│  │  - Filters (platform, type, protocols, etc.)                     ││
│  │  - Visually attractive presentation                              ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Why Linked Resources Instead of Inline in DID Document?

1. **Flexibility**: Wallet information can be rich and extensive, DID documents are meant to stay small
2. **Version control**: The JSON file can be versioned
3. **Caching**: Easier to cache and process
4. **Standardization**: Follows the pattern of e.g. `.well-known/did.json` and linked verifiable credentials

## Alternative: DID per Wallet

It's also possible to create a separate DID per wallet:
- `did:web:animo.id:wallets:paradise` 

**Advantages:**
- Each wallet has its own identity
- Can be used for credential issuance metadata

**Disadvantages:**
- More complex to manage
- More DIDs to resolve for crawler
- Overhead for small organizations

**Recommendation:** Start with Linked Resources model, extend to DID-per-wallet later if needed.

## Wallet Properties (Schema)

Based on [OpenWallet Foundation Digital Wallet Overview](https://openwallet-foundation.github.io/digital-wallet-and-agent-overviews-sig/#/wallets):

### General Information
- `name` - Name of the wallet
- `description` - Description
- `logo` - URL to logo
- `website` - Website URL
- `company` - Organization name
- `companyUrl` - Organization website

### Type & Platform
- `type` - "personal" | "organizational" | "both"
- `platforms` - ["iOS", "Android", "Web", "Desktop", "CLI"]
- `openSource` - boolean
- `license` - "MIT", "Apache-2.0", etc.
- `repository` - URL to source code

### Credential Formats
- `credentialFormats` - ["SD-JWT", "mDL/mDoc", "AnonCreds", "JWT-VC", "JSON-LD VC", "X.509"]

### Protocols
- `issuanceProtocols` - ["OpenID4VCI", "DIDComm Issue Credential"]
- `presentationProtocols` - ["OpenID4VP", "DIDComm Present Proof", "ISO 18013-5"]

### Identifiers
- `supportedDIDMethods` - ["did:web", "did:key", "did:jwk", "did:peer"]
- `keyManagement` - ["Software", "Hardware (Secure Enclave)", "HSM", "Cloud"]

### Standards & Certifications
- `certifications` - ["EUDI Wallet", "ISO 27001"]
- `standards` - ["ARF", "HAIP"]

### Contact
- `contact` - Contact information
- `documentation` - Link to documentation
