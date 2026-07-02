import {
  WALLET_CATALOG_SCHEMA_V2,
  WALLET_LICENSE_VALUES,
  WALLET_V2_LIMITS,
  type WalletLicense,
} from '../constants/wallet-v2-limits.js';
import type { RecognitionItem, WalletMedia, WalletRecognitions } from '../types/wallet.js';

const LICENSE_SET = new Set<string>(WALLET_LICENSE_VALUES);

/** Map common v1 free-text license strings to v2 enum values. */
const LICENSE_ALIASES: Record<string, WalletLicense> = {
  'AGPL-3.0': 'AGPL-3.0-or-later',
  'AGPL-3.0-only': 'AGPL-3.0-or-later',
  'GPL-3.0': 'GPL-3.0-or-later',
  'GPL-3.0-only': 'GPL-3.0-or-later',
  'GPL-3.0-or-later': 'GPL-3.0-or-later',
  'LGPL-3.0': 'LGPL-3.0-or-later',
  'Apache 2.0': 'Apache-2.0',
  'Apache-2': 'Apache-2.0',
  'Apache2': 'Apache-2.0',
  'BSD-3': 'BSD-3-Clause',
  'EUPL-1.1': 'EUPL-1.2',
};

export function isWalletCatalogV1Schema(schemaUrl: unknown): boolean {
  return (
    typeof schemaUrl === 'string' &&
    (schemaUrl.endsWith('/wallet-catalog/v1') || schemaUrl.includes('wallet-catalog/v1'))
  );
}

export function isWalletCatalogV2Schema(schemaUrl: unknown): boolean {
  return (
    typeof schemaUrl === 'string' &&
    (schemaUrl.endsWith('/wallet-catalog/v2') || schemaUrl.includes('wallet-catalog/v2'))
  );
}

export function normalizeLicenseValue(raw: unknown): { license?: WalletLicense; licenseOther?: string } {
  if (typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};

  if (LICENSE_SET.has(trimmed)) {
    return { license: trimmed as WalletLicense };
  }

  const alias = LICENSE_ALIASES[trimmed] ?? LICENSE_ALIASES[trimmed.toLowerCase()];
  if (alias) return { license: alias };

  if (/apache/i.test(trimmed) && /2(\.0)?/i.test(trimmed)) {
    return { license: 'Apache-2.0' };
  }
  if (/^mit$/i.test(trimmed)) return { license: 'MIT' };
  if (/^isc$/i.test(trimmed)) return { license: 'ISC' };
  if (/eupl/i.test(trimmed)) return { license: 'EUPL-1.2' };
  if (/mpl/i.test(trimmed) && /2/i.test(trimmed)) return { license: 'MPL-2.0' };
  if (/bsd/i.test(trimmed) && /3/i.test(trimmed)) return { license: 'BSD-3-Clause' };
  if (/proprietary/i.test(trimmed)) return { license: 'proprietary' };

  return {
    license: 'other',
    licenseOther: trimmed.slice(0, WALLET_V2_LIMITS.licenseOther),
  };
}

function trimRecognitionItems(raw: unknown, maxItems: number): RecognitionItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const titleRaw = (entry as RecognitionItem).title;
      const title = typeof titleRaw === 'string'
        ? titleRaw.trim().slice(0, WALLET_V2_LIMITS.recognitionTitle)
        : '';
      const urlRaw = (entry as RecognitionItem).url;
      const url = typeof urlRaw === 'string' ? urlRaw.trim() : undefined;
      if (!title) return null;
      return url ? { title, url } : { title };
    })
    .filter((item): item is RecognitionItem => item !== null)
    .slice(0, maxItems);
  return items.length ? items : undefined;
}

function trimStringList(raw: unknown, maxItems: number): RecognitionItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => ({ title: value.trim().slice(0, WALLET_V2_LIMITS.recognitionTitle) }))
    .slice(0, maxItems);
  return items.length ? items : undefined;
}

function buildMedia(wallet: Record<string, unknown>): WalletMedia | undefined {
  const existing = wallet.media;
  const videos: string[] = [];
  const images: string[] = [];

  if (existing && typeof existing === 'object') {
    const mediaObj = existing as WalletMedia;
    for (const url of mediaObj.videos ?? []) {
      if (typeof url === 'string' && url.trim()) videos.push(url.trim());
    }
    for (const url of mediaObj.images ?? []) {
      if (typeof url === 'string' && url.trim()) images.push(url.trim());
    }
  }

  if (typeof wallet.video === 'string' && wallet.video.trim()) {
    const url = wallet.video.trim();
    if (!videos.includes(url)) videos.unshift(url);
  }

  const media: WalletMedia = {};
  if (videos.length) media.videos = videos.slice(0, WALLET_V2_LIMITS.mediaVideos);
  if (images.length) media.images = images.slice(0, WALLET_V2_LIMITS.mediaImages);
  return media.videos?.length || media.images?.length ? media : undefined;
}

function buildRecognitions(wallet: Record<string, unknown>): WalletRecognitions | undefined {
  const existing =
    wallet.recognitions && typeof wallet.recognitions === 'object'
      ? (wallet.recognitions as WalletRecognitions)
      : undefined;

  const recognitions: WalletRecognitions = {};
  const customerStories =
    trimRecognitionItems(existing?.customerStories, WALLET_V2_LIMITS.customerStories);
  const certifications =
    trimRecognitionItems(existing?.certifications, WALLET_V2_LIMITS.recognitionsCertifications) ??
    trimStringList(wallet.certifications, WALLET_V2_LIMITS.recognitionsCertifications);
  const awardsAndRecognitions = trimRecognitionItems(
    existing?.awardsAndRecognitions,
    WALLET_V2_LIMITS.awardsAndRecognitions
  );

  if (customerStories) recognitions.customerStories = customerStories;
  if (certifications) recognitions.certifications = certifications;
  if (awardsAndRecognitions) recognitions.awardsAndRecognitions = awardsAndRecognitions;

  return Object.keys(recognitions).length ? recognitions : undefined;
}

/** Migrate one wallet object from v1 field shapes to v2. Idempotent for already-v2 wallets. */
export function migrateWalletV1ToV2(wallet: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...wallet };
  delete out.video;
  delete out.certifications;

  const media = buildMedia(wallet);
  if (media) out.media = media;
  else delete out.media;

  const recognitions = buildRecognitions(wallet);
  if (recognitions) out.recognitions = recognitions;
  else delete out.recognitions;

  if ('license' in wallet) {
    const normalized = normalizeLicenseValue(wallet.license);
    if (normalized.license) {
      out.license = normalized.license;
      if (normalized.license === 'other' && normalized.licenseOther) {
        out.licenseOther = normalized.licenseOther;
      } else {
        delete out.licenseOther;
      }
    } else {
      delete out.license;
      delete out.licenseOther;
    }
  }

  if (typeof out.pricing === 'string') {
    const pricing = out.pricing.trim();
    if (pricing) out.pricing = pricing.slice(0, WALLET_V2_LIMITS.pricing);
    else delete out.pricing;
  }

  return out;
}

/** Migrate a provider wallet-catalog.json document to v2. */
export function migrateCatalogDocumentV1ToV2(doc: Record<string, unknown>): Record<string, unknown> {
  const wallets = Array.isArray(doc.wallets) ? doc.wallets : [];
  return {
    ...doc,
    $schema: WALLET_CATALOG_SCHEMA_V2,
    wallets: wallets.map((wallet) =>
      migrateWalletV1ToV2(
        wallet && typeof wallet === 'object' ? (wallet as Record<string, unknown>) : {}
      )
    ),
  };
}

/** Migrate document when v1 or normalize wallets on already-v2 documents. */
export function migrateCatalogDocumentToV2(doc: Record<string, unknown>): Record<string, unknown> {
  const migrated = migrateCatalogDocumentV1ToV2(doc);
  if (isWalletCatalogV2Schema(doc.$schema) && !isWalletCatalogV1Schema(doc.$schema)) {
    return migrated;
  }
  return migrated;
}
