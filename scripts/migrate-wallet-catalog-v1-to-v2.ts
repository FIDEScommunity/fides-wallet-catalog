#!/usr/bin/env tsx
/**
 * One-time / maintenance migration: community-catalogs wallet-catalog.json v1 → v2.
 *
 * Usage:
 *   npx tsx scripts/migrate-wallet-catalog-v1-to-v2.ts          # dry-run
 *   npx tsx scripts/migrate-wallet-catalog-v1-to-v2.ts --write  # apply
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
  isWalletCatalogV1Schema,
  migrateCatalogDocumentToV2,
} from '../src/lib/migrate-wallet-catalog-v1-to-v2.ts';

const ROOT = process.cwd();
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const write = process.argv.includes('--write');

async function main() {
  const entries = await readdir(COMMUNITY_DIR, { withFileTypes: true });
  let migrated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(COMMUNITY_DIR, entry.name, 'wallet-catalog.json');
    try {
      const raw = await readFile(filePath, 'utf8');
      const doc = JSON.parse(raw) as Record<string, unknown>;
      const wasV1 = isWalletCatalogV1Schema(doc.$schema);
      const next = migrateCatalogDocumentToV2(doc);
      const changed = JSON.stringify(doc) !== JSON.stringify(next);

      if (!changed) {
        skipped++;
        continue;
      }

      migrated++;
      console.log(`${write ? '✏️ ' : '👀'} ${entry.name}${wasV1 ? ' (v1→v2)' : ''}`);

      if (write) {
        await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw err;
    }
  }

  console.log(
    `\n${write ? 'Migrated' : 'Would migrate'} ${migrated} catalog(s); ${skipped} unchanged.`
  );
  if (!write && migrated > 0) {
    console.log('Re-run with --write to apply.');
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
