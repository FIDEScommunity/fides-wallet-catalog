import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';

interface WalletCatalogFile {
  provider?: {
    did?: string;
    name?: string;
  };
  wallets?: Array<{
    id: string;
  }>;
  lastUpdated?: string;
}

interface WalletHistoryEntry {
  firstSeenAt: string;
  lastSeenAt?: string;
  providerKey?: string;
  walletId?: string;
  sourcePath?: string;
}

type WalletHistoryState = Record<string, WalletHistoryEntry>;

const repoRoot = process.cwd();
const communityCatalogsDir = path.join(repoRoot, 'community-catalogs');
const walletHistoryStatePath = path.join(repoRoot, 'data/wallet-history-state.json');

function parseIsoOrNull(value?: string): string | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function gitFirstDateForFile(relativePath: string): string | null {
  try {
    const output = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%aI', '--', relativePath],
      { cwd: repoRoot, encoding: 'utf-8' }
    ).trim();
    const firstLine = output.split('\n').find(Boolean);
    return parseIsoOrNull(firstLine);
  } catch {
    return null;
  }
}

function gitFirstDateForWalletInFile(relativePath: string, walletId: string): string | null {
  try {
    const output = execFileSync(
      'git',
      ['log', '--reverse', '--format=%aI', '-S', walletId, '--', relativePath],
      { cwd: repoRoot, encoding: 'utf-8' }
    ).trim();
    const firstLine = output.split('\n').find(Boolean);
    return parseIsoOrNull(firstLine);
  } catch {
    return null;
  }
}

async function loadHistoryState(): Promise<WalletHistoryState> {
  try {
    const data = await fs.readFile(walletHistoryStatePath, 'utf-8');
    const parsed = JSON.parse(data) as WalletHistoryState;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

async function saveHistoryState(state: WalletHistoryState): Promise<void> {
  await fs.mkdir(path.dirname(walletHistoryStatePath), { recursive: true });
  await fs.writeFile(walletHistoryStatePath, JSON.stringify(state, null, 2));
}

async function backfillFirstSeen(): Promise<void> {
  const historyState = await loadHistoryState();
  const nowIso = new Date().toISOString();

  let filled = 0;
  let skipped = 0;

  const providerDirs = await fs.readdir(communityCatalogsDir, { withFileTypes: true });

  for (const providerDirEntry of providerDirs) {
    if (!providerDirEntry.isDirectory()) continue;

    const providerDir = providerDirEntry.name;
    const catalogFilePath = path.join(communityCatalogsDir, providerDir, 'wallet-catalog.json');

    try {
      await fs.access(catalogFilePath);
    } catch {
      continue;
    }

    const catalogRaw = await fs.readFile(catalogFilePath, 'utf-8');
    const catalog = JSON.parse(catalogRaw) as WalletCatalogFile;
    if (!Array.isArray(catalog.wallets) || catalog.wallets.length === 0) continue;

    const providerKey = catalog.provider?.did || catalog.provider?.name || providerDir;
    const relativePath = path.relative(repoRoot, catalogFilePath).replace(/\\/g, '/');
    const fileAddedDate = gitFirstDateForFile(relativePath);
    const catalogLastUpdated = parseIsoOrNull(catalog.lastUpdated);

    for (const wallet of catalog.wallets) {
      if (!wallet?.id) continue;

      const historyKey = `${providerKey}:${wallet.id}`;
      if (historyState[historyKey]?.firstSeenAt) {
        skipped += 1;
        continue;
      }

      const walletFirstCommitDate = gitFirstDateForWalletInFile(relativePath, wallet.id);
      const firstSeenAt = walletFirstCommitDate || fileAddedDate || catalogLastUpdated || nowIso;

      historyState[historyKey] = {
        firstSeenAt,
        lastSeenAt: nowIso,
        providerKey,
        walletId: wallet.id,
        sourcePath: relativePath
      };
      filled += 1;
    }
  }

  await saveHistoryState(historyState);

  console.log('Backfill complete');
  console.log(`State file: ${walletHistoryStatePath}`);
  console.log(`Created firstSeenAt for ${filled} wallet(s)`);
  console.log(`Skipped existing ${skipped} wallet(s)`);
}

backfillFirstSeen().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
