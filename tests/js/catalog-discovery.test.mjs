import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const testsDir = dirname(fileURLToPath(import.meta.url));
const repo = dirname(dirname(testsDir));
const plugin = join(repo, 'wordpress-plugin/fides-wallet-catalog');
const js = readFileSync(join(plugin, 'assets/wallet-catalog.js'), 'utf8');

test('Explore is the default persisted wallet sort', () => {
  assert.match(js, /const SORT_PREFERENCE_STORAGE_KEY = 'fidesWalletCatalogSortByV2';/);
  assert.match(js, /let sortBy = 'explore';/);
  assert.match(js, /<option value="explore"[^>]*>Explore<\/option>/);
  assert.match(js, /\['explore', 'lastUpdated', 'rating', 'az'\]/);
});

test('Explore rotates daily and mixes wallet discovery bands', () => {
  assert.match(js, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
  assert.match(js, /function walletExploreBand\(wallet\)/);
  assert.match(js, /recognition\.place === 1/);
  assert.match(js, /getWalletStatusBucket\(wallet\) === 'available'/);
  assert.match(js, /const slotPattern = \[/);
  assert.match(js, /return buildExploreOrder\(filtered, deferWithoutLogo\);/);
});

test('Explore defers missing-logo wallets only on the unfiltered first page', () => {
  assert.match(js, /getActiveFilterCount\(\) === defaultTypeFilterCount/);
  assert.match(js, /items\.filter\(\(wallet\) => Boolean\(String\(wallet\.logo \|\| ''\)\.trim\(\)\)\)/);
  assert.match(js, /ordered\.exploreFirstPageSize = firstPage\.length/);
  assert.match(js, /function paginationBounds\(items, page\)/);
});
