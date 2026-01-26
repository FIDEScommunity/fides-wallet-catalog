// Types for the FIDES Wallet Catalog

export type WalletType = 'personal' | 'organizational';
export type WalletStatus = 'development' | 'beta' | 'production' | 'deprecated';
export type Platform = 'iOS' | 'Android' | 'Web' | 'Windows' | 'macOS' | 'Linux' | 'CLI';

export type CredentialFormat = 
  | 'SD-JWT'
  | 'SD-JWT-VC'
  | 'mDL/mDoc'
  | 'AnonCreds'
  | 'JWT-VC'
  | 'JSON-LD VC'
  | 'X.509'
  | 'CBOR-LD';

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

export interface WalletProvider {
  name: string;
  did?: string; // Optional - not all providers have a DID yet
  website?: string;
  logo?: string;
  country?: string; // ISO 3166-1 alpha-2 country code
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
  video?: string;
  type: WalletType;
  capabilities?: WalletCapability[]; // For organizational wallets: holder, issuer, verifier
  platforms?: Platform[];
  openSource?: boolean;
  license?: string;
  repository?: string;
  credentialFormats?: CredentialFormat[];
  issuanceProtocols?: IssuanceProtocol[];
  presentationProtocols?: PresentationProtocol[];
  supportedIdentifiers?: string[];
  keyStorage?: KeyStorage[];
  signingAlgorithms?: string[];
  credentialStatusMethods?: string[];
  certifications?: string[];
  interoperabilityProfiles?: InteroperabilityProfile[];
  standards?: string[];
  features?: string[];
  documentation?: string;
  appStoreLinks?: {
    iOS?: string;
    android?: string;
    web?: string;
  };
  status?: WalletStatus;
  releaseDate?: string;
}

export interface WalletCatalog {
  $schema: string;
  provider: WalletProvider;
  wallets: Wallet[];
  lastUpdated?: string;
}

// Normalized wallet with provider info (for display)
export interface NormalizedWallet extends Wallet {
  provider: WalletProvider;
  catalogUrl: string;
  fetchedAt: string;
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
    byCredentialFormat: Record<string, number>;
  };
}

// Filter options
export interface WalletFilters {
  search?: string;
  type?: WalletType[];
  capabilities?: WalletCapability[];
  platforms?: Platform[];
  credentialFormats?: CredentialFormat[];
  interoperabilityProfiles?: InteroperabilityProfile[];
  protocols?: string[];
  openSource?: boolean;
  status?: WalletStatus[];
}
