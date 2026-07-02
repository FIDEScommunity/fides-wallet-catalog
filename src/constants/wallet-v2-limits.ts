/** Wallet catalog schema v2 — validation limits (keep in sync with JSON Schema). */

export const WALLET_CATALOG_SCHEMA_V2 =
  'https://fides.community/schemas/wallet-catalog/v2' as const;

export const WALLET_CATALOG_SCHEMA_V1 =
  'https://fides.community/schemas/wallet-catalog/v1' as const;

export const WALLET_V2_LIMITS = {
  mediaVideos: 3,
  mediaImages: 10,
  customerStories: 5,
  recognitionsCertifications: 10,
  awardsAndRecognitions: 10,
  additionalDocumentation: 10,
  recognitionTitle: 100,
  licenseOther: 50,
  pricing: 1000,
} as const;

export const WALLET_LICENSE_VALUES = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0-or-later',
  'AGPL-3.0-or-later',
  'LGPL-3.0-or-later',
  'EUPL-1.2',
  'MPL-2.0',
  'BSD-3-Clause',
  'ISC',
  'proprietary',
  'other',
] as const;

export const WALLET_DEPLOYMENT_MODEL_VALUES = ['saas', 'on_premises', 'hybrid'] as const;

export type WalletLicense = (typeof WALLET_LICENSE_VALUES)[number];
export type WalletDeploymentModel = (typeof WALLET_DEPLOYMENT_MODEL_VALUES)[number];
