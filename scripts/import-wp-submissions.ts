#!/usr/bin/env tsx
/**
 * Import published WordPress wallet submissions into community-catalogs/.
 *
 * Merges one wallet object per export entry into the provider's wallet-catalog.json
 * (grouped by org slug). Preserves sibling wallets in the same file.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const STATE_PATH = path.join(ROOT, 'data/wp-submission-state.json');
const MARKER_FILENAME = '.wordpress-source';
const COMMUNITY_FILENAME = 'wallet-catalog.json';
const SECRET_HEADER = 'X-FIDES-Catalog-Secret';

export type WpExportEntry = {
  itemId: string;
  slug: string;
  filename: string;
  source: string;
  document: Record<string, unknown>;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type WpExportPayload = {
  schemaVersion: string;
  catalogType: string;
  generatedAt: string;
  entries: WpExportEntry[];
};

export type ManagedWallet = {
  slug: string;
  walletId: string;
};

export type WpSubmissionState = {
  schemaVersion: '1.0.0';
  catalogType: string;
  lastImportAt: string | null;
  managedWallets: ManagedWallet[];
};

type WalletRecord = Record<string, unknown> & { id?: string };

type WalletCatalogDoc = {
  $schema?: string;
  orgId?: string;
  wallets?: WalletRecord[];
  lastUpdated?: string;
};

type SlugGroup = {
  slug: string;
  entries: WpExportEntry[];
};

type ImportPlan = {
  groups: SlugGroup[];
  prune: ManagedWallet[];
  skipped: Array<{ slug: string; reason: string }>;
};

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply');
  const wpUrl =
    (() => {
      const idx = argv.indexOf('--wp-url');
      if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
      return (
        process.env.FIDES_WP_EXPORT_URL
        ?? 'http://utrecht-demo.local/wp-json/fides-catalog/v1/export/wallet'
      );
    })();
  const secret =
    (() => {
      const idx = argv.indexOf('--secret');
      if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
      return process.env.FIDES_CATALOG_SECRET ?? process.env.WP_INVALIDATE_SECRET ?? '';
    })();
  return { apply, wpUrl, secret };
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export function emptyState(catalogType = 'wallet'): WpSubmissionState {
  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: null,
    managedWallets: [],
  };
}

export async function readState(): Promise<WpSubmissionState> {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as WpSubmissionState;
    if (!parsed || !Array.isArray(parsed.managedWallets)) {
      return emptyState();
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyState();
    }
    throw err;
  }
}

export function walletFromEntry(entry: WpExportEntry): WalletRecord | null {
  const wallets = entry.document.wallets;
  if (!Array.isArray(wallets) || !wallets.length) return null;
  const wallet = wallets[0];
  if (!wallet || typeof wallet !== 'object') return null;
  const id = String((wallet as WalletRecord).id || entry.itemId || '').trim();
  if (!id) return null;
  return { ...(wallet as WalletRecord), id };
}

export function mergeWalletIntoCatalog(
  base: WalletCatalogDoc | null,
  entry: WpExportEntry,
): WalletCatalogDoc {
  const wallet = walletFromEntry(entry);
  if (!wallet) {
    throw new Error(`Export entry ${entry.itemId} has no wallet object.`);
  }
  const orgId = String(entry.document.orgId || '').trim();
  const wallets = Array.isArray(base?.wallets) ? [...base.wallets] : [];
  const idx = wallets.findIndex((w) => String(w.id || '') === String(wallet.id));
  if (idx >= 0) {
    wallets[idx] = { ...wallets[idx], ...wallet };
  } else {
    wallets.push(wallet);
  }
  return {
    $schema: 'https://fides.community/schemas/wallet-catalog/v1',
    orgId: orgId || base?.orgId,
    wallets,
    lastUpdated: new Date().toISOString(),
  };
}

export function buildImportPlan(entries: WpExportEntry[], previous: WpSubmissionState): ImportPlan {
  const plan: ImportPlan = { groups: [], prune: [], skipped: [] };
  const groupMap = new Map<string, WpExportEntry[]>();
  const currentManaged = new Map<string, ManagedWallet>();

  for (const entry of entries) {
    const slug = entry.slug.trim();
    const walletId = entry.itemId.trim();
    if (!slug || !walletId || entry.filename !== COMMUNITY_FILENAME) {
      plan.skipped.push({ slug: slug || '(missing)', reason: 'invalid entry metadata' });
      continue;
    }
    if (!isSafeSlug(slug)) {
      plan.skipped.push({ slug, reason: 'unsafe slug' });
      continue;
    }
    if (!walletFromEntry(entry)) {
      plan.skipped.push({ slug, reason: `missing wallet in document (${walletId})` });
      continue;
    }
    const list = groupMap.get(slug) ?? [];
    list.push(entry);
    groupMap.set(slug, list);
    currentManaged.set(`${slug}:${walletId}`, { slug, walletId });
  }

  for (const [, list] of groupMap) {
    plan.groups.push({ slug: list[0]!.slug, entries: list });
  }

  for (const managed of previous.managedWallets) {
    const key = `${managed.slug}:${managed.walletId}`;
    if (!currentManaged.has(key)) {
      plan.prune.push(managed);
    }
  }

  return plan;
}

export async function fetchWpExport(wpUrl: string, secret: string): Promise<WpExportPayload> {
  if (!secret.trim()) {
    throw new Error('Missing catalog secret. Set FIDES_CATALOG_SECRET or WP_INVALIDATE_SECRET.');
  }
  const response = await fetch(wpUrl, {
    method: 'GET',
    headers: { Accept: 'application/json', [SECRET_HEADER]: secret },
    signal: AbortSignal.timeout(60_000),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `WP export failed (HTTP ${response.status}, ${contentType}): ${body.slice(0, 300)}`,
    );
  }
  if (!contentType.includes('json')) {
    throw new Error(
      `WP export returned non-JSON (HTTP ${response.status}, ${contentType}). `
      + `Body starts with: ${body.slice(0, 200).replace(/\s+/g, ' ')}`,
    );
  }
  let payload: WpExportPayload;
  try {
    payload = JSON.parse(body) as WpExportPayload;
  } catch {
    throw new Error(
      `WP export JSON parse failed (HTTP ${response.status}). Body starts with: ${body.slice(0, 200).replace(/\s+/g, ' ')}`,
    );
  }
  if (!payload?.entries) throw new Error('WP export response is missing entries array.');
  return payload;
}

async function readCatalogAt(slug: string): Promise<WalletCatalogDoc | null> {
  const filePath = path.join(COMMUNITY_DIR, slug, COMMUNITY_FILENAME);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as WalletCatalogDoc;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function markerExists(slug: string): Promise<boolean> {
  try {
    await fs.access(path.join(COMMUNITY_DIR, slug, MARKER_FILENAME));
    return true;
  } catch {
    return false;
  }
}

async function readMarker(slug: string): Promise<{ wallets?: Record<string, unknown> } | null> {
  try {
    const raw = await fs.readFile(path.join(COMMUNITY_DIR, slug, MARKER_FILENAME), 'utf8');
    return JSON.parse(raw) as { wallets?: Record<string, unknown> };
  } catch {
    return null;
  }
}

function removeWalletFromCatalog(doc: WalletCatalogDoc, walletId: string): WalletCatalogDoc {
  const wallets = (doc.wallets ?? []).filter((w) => String(w.id || '') !== walletId);
  return { ...doc, wallets, lastUpdated: new Date().toISOString() };
}

export async function applyImportPlan(
  plan: ImportPlan,
  apply: boolean,
  catalogType = 'wallet',
): Promise<WpSubmissionState> {
  const managedWallets: ManagedWallet[] = [];

  for (const group of plan.groups) {
    let doc = await readCatalogAt(group.slug);
    for (const entry of group.entries) {
      doc = mergeWalletIntoCatalog(doc, entry);
      managedWallets.push({ slug: group.slug, walletId: entry.itemId });
    }

    const dir = path.join(COMMUNITY_DIR, group.slug);
    const catalogPath = path.join(dir, COMMUNITY_FILENAME);
    const markerPath = path.join(dir, MARKER_FILENAME);
    const marker = {
      source: 'wordpress',
      slug: group.slug,
      wallets: Object.fromEntries(
        group.entries.map((e) => [e.itemId, { itemId: e.itemId, publishedAt: e.publishedAt ?? null }]),
      ),
      importedAt: new Date().toISOString(),
    };

    if (apply) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(catalogPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
      const existingMarker = (await readMarker(group.slug)) ?? {};
      const mergedWallets = { ...(existingMarker.wallets ?? {}), ...marker.wallets };
      await fs.writeFile(
        markerPath,
        `${JSON.stringify({ ...marker, wallets: mergedWallets }, null, 2)}\n`,
        'utf8',
      );
    }
    console.log(`${apply ? 'WRITE' : 'DRY '} ${group.slug} (${group.entries.length} wallet(s))`);
  }

  for (const managed of plan.prune) {
    const hasMarker = await markerExists(managed.slug);
    if (!hasMarker) {
      console.log(`SKIP  prune ${managed.slug}/${managed.walletId} — not WP-managed`);
      continue;
    }
    const doc = await readCatalogAt(managed.slug);
    if (!doc) continue;
    const next = removeWalletFromCatalog(doc, managed.walletId);
    const dir = path.join(COMMUNITY_DIR, managed.slug);
    if (apply) {
      if ((next.wallets ?? []).length === 0) {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`PRUNE ${managed.slug} (empty after removing ${managed.walletId})`);
      } else {
        await fs.writeFile(
          path.join(dir, COMMUNITY_FILENAME),
          `${JSON.stringify(next, null, 2)}\n`,
          'utf8',
        );
        const marker = await readMarker(managed.slug);
        if (marker?.wallets && managed.walletId in marker.wallets) {
          delete marker.wallets[managed.walletId];
          await fs.writeFile(
            path.join(dir, MARKER_FILENAME),
            `${JSON.stringify(marker, null, 2)}\n`,
            'utf8',
          );
        }
        console.log(`UPDATE ${managed.slug} — removed wallet ${managed.walletId}`);
      }
    } else {
      console.log(`DRY  prune wallet ${managed.walletId} from ${managed.slug}`);
    }
  }

  for (const skipped of plan.skipped) {
    console.log(`SKIP  ${skipped.slug} — ${skipped.reason}`);
  }

  const unique = new Map<string, ManagedWallet>();
  for (const m of managedWallets) unique.set(`${m.slug}:${m.walletId}`, m);

  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: apply ? new Date().toISOString() : null,
    managedWallets: apply ? [...unique.values()].sort((a, b) => a.slug.localeCompare(b.slug)) : [...unique.values()],
  };
}

async function main() {
  const { apply, wpUrl, secret } = parseArgs(process.argv.slice(2));
  console.log(`WP export: ${wpUrl}`);
  console.log(`Mode: ${apply ? 'apply' : 'dry-run (pass --apply to write)'}`);

  const previous = await readState();
  const payload = await fetchWpExport(wpUrl, secret);
  const plan = buildImportPlan(payload.entries, previous);

  console.log(`Export entries: ${payload.entries.length}`);
  console.log(`Would write: ${plan.groups.length} provider file(s), prune: ${plan.prune.length} wallet(s)`);

  const nextState = await applyImportPlan(plan, apply, payload.catalogType || 'wallet');
  if (apply) {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
    console.log(`State updated: ${path.relative(ROOT, STATE_PATH)}`);
  }
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
