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

