// Types for the FIDES Wallet Catalog (HTTP API bundle).
// Keep in sync with src/types/wallet.ts (duplicated for Vercel helpers in lib/).

export type WalletType = 'personal' | 'organizational';
export type WalletStatus = 'development' | 'beta' | 'production' | 'deprecated';
export type Platform = 'iOS' | 'Android' | 'Web' | 'Windows' | 'macOS' | 'Linux' | 'CLI';

/** Canonical codes — aligned with credential-catalog and rp-catalog `vcFormat`. */
export type CredentialFormat =
  | 'sd_jwt_vc'
  | 'mdoc'
  | 'jwt_vc'
  | 'vcdm_1_1'
  | 'vcdm_2_0'
  | 'anoncreds'
  | 'idemix'
  | 'apple_wallet_pass'
  | 'google_wallet_pass'
  | 'acdc';

export type IssuanceProtocol = 
  | 'OpenID4VCI'
  | 'DIDComm Issue Credential v1'
  | 'DIDComm Issue Credential v2'
  | 'ISO 18013-5 (Device Retrieval)';

export type PresentationProtocol = 
  | 'OpenID4VP'
  | 'DIDComm Present Proof v1'
  | 'DIDComm Present Proof v2'
  | 'ISO 18013-5'
  | 'SIOPv2';

export type KeyStorage = 
  | 'Software'
  | 'Secure Enclave (iOS)'
  | 'StrongBox (Android)'
  | 'TEE'
  | 'HSM'
  | 'Cloud KMS'
  | 'Smart Card'
  | 'FIDO2/WebAuthn';

export type WalletCapability = 'holder' | 'issuer' | 'verifier';

export type InteroperabilityProfile = 'DIIP v4' | 'DIIP v5' | 'EWC v3' | 'EUDI Wallet ARF' | 'HAIP v1';

/** Qualified eIDAS trust service codes (aligned with organization QTSP catalog). */
export type EidasTrustService =
  | 'Q_CERT_ESIG'
  | 'Q_CERT_ESEAL'
  | 'Q_TIMESTAMP'
  | 'Q_ERDS'
  | 'Q_WAC'
  | 'Q_EARCH'
  | 'Q_VC'
  | 'Q_PRES'
  | 'Q_PRES_ESEAL'
  | 'Q_PRES_ESIG'
  | 'Q_VAL_ESEAL'
  | 'Q_VAL_ESIG'
  | 'Q_REM_MANAGE_Q_SEAL_CD'
  | 'Q_REM_MANAGE_Q_SIG_CD'
  | 'QEAA';

export type WalletLicense =
  | 'MIT'
  | 'Apache-2.0'
  | 'GPL-3.0-or-later'
  | 'AGPL-3.0-or-later'
  | 'LGPL-3.0-or-later'
  | 'EUPL-1.2'
  | 'MPL-2.0'
  | 'BSD-3-Clause'
  | 'ISC'
  | 'proprietary'
  | 'other';

export type WalletDeploymentModel = 'saas' | 'on_premises' | 'hybrid';

/** v2 — titled recognition entry with optional URL. */
export interface RecognitionItem {
  title: string;
  url?: string;
}

/** v2 — promotional videos and images (Pro in public export). */
export interface WalletMedia {
  videos?: string[];
  images?: string[];
}

/** v2 — customer stories, certifications, awards (Pro in public export). */
export interface WalletRecognitions {
  customerStories?: RecognitionItem[];
  certifications?: RecognitionItem[];
  awardsAndRecognitions?: RecognitionItem[];
}

export interface WalletProvider {
  /** Organization catalog id (matches source catalog orgId). */
  orgId: string;
  name: string;
  did?: string; // Optional - not all providers have a DID yet
  website?: string;
  logo?: string;
  country?: string; // ISO 3166-1 alpha-2 country code
  fidesManifestoSupporter?: boolean;
  contact?: {
    email?: string;
    support?: string;
  };
}

export interface Wallet {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  type: WalletType;
  capabilities?: WalletCapability[]; // For organizational wallets: holder, issuer, verifier
  platforms?: Platform[];
  openSource?: boolean;
  license?: WalletLicense;
  /** Required when license is `other`. */
  licenseOther?: string;
  repository?: string;
  deploymentModel?: WalletDeploymentModel;
  slaAvailable?: boolean;
  /** Pro tier in public export. */
  pricing?: string;
  /** Pro tier in public export. */
  media?: WalletMedia;
  /** Pro tier in public export. */
  recognitions?: WalletRecognitions;
  /** Pro tier in public export. */
  additionalDocumentation?: RecognitionItem[];
  vcFormat?: CredentialFormat[];
  issuanceProtocols?: IssuanceProtocol[];
  presentationProtocols?: PresentationProtocol[];
  supportedIdentifiers?: string[];
  keyStorage?: KeyStorage[];
  signingAlgorithms?: string[];
  credentialStatusMethods?: string[];
  eidasTrustServices?: EidasTrustService[];
  interoperabilityProfiles?: InteroperabilityProfile[];
  standards?: string[];
  features?: string[];
  supportedDIDMethods?: string[];
  keyManagement?: string[];
  documentation?: string;
  appStoreLinks?: {
    iOS?: string;
    android?: string;
    web?: string;
  };
  status?: WalletStatus;
  releaseDate?: string;
  createdAt?: string;
  updated?: string;
  updatedAt?: string;
  firstSeenAt?: string;
}

export interface WalletCatalog {
  $schema: string;
  orgId: string;
  wallets: Wallet[];
  lastUpdated?: string;
}

// Normalized wallet with provider info (for display)
export interface NormalizedWallet extends Wallet {
  orgId: string;
  provider: WalletProvider;
  catalogUrl: string;
  fetchedAt: string;
  updatedAt?: string;
  firstSeenAt?: string;
  source?: 'local' | 'github' | 'did'; // Where the catalog was fetched from
}

// Registry entry for registered providers
export interface RegistryEntry {
  did: string;
  catalogUrl: string;
  addedAt: string;
  lastChecked?: string;
  lastSuccessfulFetch?: string;
  status: 'active' | 'error' | 'pending';
  errorMessage?: string;
}

// Aggregated data
export interface AggregatedCatalog {
  wallets: NormalizedWallet[];
  providers: WalletProvider[];
  lastUpdated: string;
  stats: {
    totalWallets: number;
    totalProviders: number;
    byType: Record<WalletType, number>;
    byPlatform: Record<Platform, number>;
    byVcFormat: Record<string, number>;
  };
}

// Filter options
export interface WalletFilters {
  search?: string;
  /** When set, only wallets for this organization catalog id (e.g. org:animo). */
  orgId?: string;
  type?: WalletType[];
  capabilities?: WalletCapability[];
  platforms?: Platform[];
  vcFormat?: CredentialFormat[];
  interoperabilityProfiles?: InteroperabilityProfile[];
  protocols?: string[];
  openSource?: boolean;
  status?: WalletStatus[];
}
