import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { NormalizedWallet } from '../types/wallet.js';
import type { EudiTrackerEnrichment } from '../types/wallet.js';

const EUDI_TRACKER_URL =
  'https://raw.githubusercontent.com/L3-iGrant/eudi-wallet-tracker/main/data/eudi-status.json';

const MAP_PATH = path.join(process.cwd(), 'data/eudi-tracker-wallet-map.json');

/** ISO codes we never enrich (per product decision). */
const EXCLUDED_ISO = new Set(['GB']);

interface IGrantSource {
  title: string;
  url: string;
  date?: string | null;
}

interface IGrantCountry {
  name: string;
  isoAlpha2: string;
  status: string;
  walletName?: string | null;
  walletProvider?: string | null;
  assuranceLevel?: string | null;
  lspParticipation?: string[];
  launchOrPilotDate?: string | null;
  notableIssuers?: string[];
  qtspPartner?: string | null;
  notes?: string | null;
  sources?: IGrantSource[];
}

interface IGrantPayload {
  lastUpdated?: string;
  statusOrder?: string[];
  countries?: IGrantCountry[];
}

interface WalletMapFile {
  mappings?: Record<string, string>;
}

function walletKey(wallet: NormalizedWallet): string {
  return `${wallet.orgId}:${wallet.id}`;
}

function statusOrderIndex(statusOrder: string[] | undefined, status: string): number | null {
  if (!statusOrder || !status) return null;
  const idx = statusOrder.indexOf(status);
  return idx >= 0 ? idx : null;
}

function countryNameToTrackerSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countryToEnrichment(
  country: IGrantCountry,
  payload: IGrantPayload,
  fetchedAt: string
): EudiTrackerEnrichment {
  const iso = country.isoAlpha2.toUpperCase();
  const trackerPageSlug = countryNameToTrackerSlug(country.name);
  return {
    source: 'https://github.com/L3-iGrant/eudi-wallet-tracker',
    sourceLastUpdated: payload.lastUpdated,
    fetchedAt,
    countryName: country.name,
    isoAlpha2: iso,
    trackerPageSlug,
    trackerPageUrl: `https://eudi-wallet-tracker.igrant.io/tracker/${trackerPageSlug}`,
    badgeSvgUrl: `https://eudi-wallet-tracker.igrant.io/badge/${iso}.svg`,
    status: country.status,
    statusOrder: statusOrderIndex(payload.statusOrder, country.status),
    walletName: country.walletName ?? undefined,
    walletProvider: country.walletProvider ?? undefined,
    assuranceLevel: country.assuranceLevel ?? undefined,
    lspParticipation: country.lspParticipation?.length ? country.lspParticipation : undefined,
    launchOrPilotDate: country.launchOrPilotDate ?? undefined,
    notableIssuers: country.notableIssuers?.length ? country.notableIssuers : undefined,
    qtspPartner: country.qtspPartner ?? undefined,
    notes: country.notes ?? undefined,
    sources: country.sources?.length
      ? country.sources.map((s) => ({
          title: s.title,
          url: s.url,
          date: s.date ?? undefined,
        }))
      : undefined,
  };
}

async function loadWalletMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!existsSync(MAP_PATH)) {
    console.warn(`  iGrant map not found: ${MAP_PATH}`);
    return map;
  }
  const raw = await fs.readFile(MAP_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as WalletMapFile;
  for (const [key, iso] of Object.entries(parsed.mappings || {})) {
    if (typeof iso === 'string' && iso.length === 2) {
      map.set(key, iso.toUpperCase());
    }
  }
  return map;
}

async function fetchIGrantPayload(): Promise<IGrantPayload | null> {
  try {
    const res = await fetch(EUDI_TRACKER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as IGrantPayload;
  } catch (err) {
    console.warn('  Could not fetch iGrant EUDI tracker:', (err as Error).message);
    return null;
  }
}

/**
 * Attach iGrant landscape data to matched wallets (aggregated output only — not in community schema).
 */
export async function enrichWalletsWithEudiTracker(
  wallets: NormalizedWallet[]
): Promise<NormalizedWallet[]> {
  const walletMap = await loadWalletMap();
  const payload = await fetchIGrantPayload();
  if (!payload?.countries?.length) {
    console.log('  Skipping iGrant enrichment (tracker unavailable)');
    return wallets;
  }

  const byIso = new Map<string, IGrantCountry>();
  for (const country of payload.countries) {
    if (country.isoAlpha2) {
      byIso.set(country.isoAlpha2.toUpperCase(), country);
    }
  }

  const fetchedAt = new Date().toISOString();
  let matched = 0;

  const enriched = wallets.map((wallet) => {
    if (wallet.type !== 'personal') return wallet;

    const iso = walletMap.get(walletKey(wallet));
    if (!iso || EXCLUDED_ISO.has(iso)) return wallet;

    const country = byIso.get(iso);
    if (!country) return wallet;

    matched += 1;
    return {
      ...wallet,
      eudiTracker: countryToEnrichment(country, payload, fetchedAt),
    };
  });

  console.log(`  iGrant EUDI tracker: enriched ${matched} wallet(s) (source updated ${payload.lastUpdated || 'unknown'})`);
  return enriched;
}
