import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildImportPlan,
  emptyState,
  mergeWalletIntoCatalog,
  type WpExportEntry,
} from '../scripts/import-wp-submissions.ts';

test('mergeWalletIntoCatalog appends and updates by wallet id', () => {
  const entryA: WpExportEntry = {
    itemId: 'example-wallet',
    slug: 'animo',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    document: {
      orgId: 'org:animo',
      wallets: [{ id: 'example-wallet', name: 'Example', type: 'personal', status: 'beta' }],
    },
  };
  const entryB: WpExportEntry = {
    itemId: 'example-wallet',
    slug: 'animo',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    document: {
      orgId: 'org:animo',
      wallets: [{ id: 'example-wallet', name: 'Example v2', type: 'personal', status: 'production' }],
    },
  };
  const other: WpExportEntry = {
    itemId: 'other-wallet',
    slug: 'animo',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    document: {
      orgId: 'org:animo',
      wallets: [{ id: 'other-wallet', name: 'Other', type: 'organizational', status: 'production' }],
    },
  };

  let doc = mergeWalletIntoCatalog(null, entryA);
  assert.equal(doc.wallets?.length, 1);
  assert.equal(doc.wallets?.[0]?.name, 'Example');

  doc = mergeWalletIntoCatalog(doc, other);
  assert.equal(doc.wallets?.length, 2);

  doc = mergeWalletIntoCatalog(doc, entryB);
  assert.equal(doc.wallets?.length, 2);
  assert.equal(doc.wallets?.find((w) => w.id === 'example-wallet')?.name, 'Example v2');
});

test('buildImportPlan groups by slug and plans prune', () => {
  const entries: WpExportEntry[] = [
    {
      itemId: 'w1',
      slug: 'animo',
      filename: 'wallet-catalog.json',
      source: 'wordpress',
      document: { orgId: 'org:animo', wallets: [{ id: 'w1', name: 'W1', type: 'personal', status: 'production' }] },
    },
  ];
  const previous = emptyState();
  previous.managedWallets = [{ slug: 'oldco', walletId: 'legacy-wallet' }];
  const plan = buildImportPlan(entries, previous);
  assert.equal(plan.groups.length, 1);
  assert.equal(plan.groups[0]?.slug, 'animo');
  assert.equal(plan.prune.length, 1);
});

test('export-to-community pipeline merges create then update for same wallet id', () => {
  const createExport: WpExportEntry = {
    itemId: 'pipeline-wallet',
    slug: 'acme',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    publishedAt: '2026-06-22T10:00:00.000Z',
    document: {
      orgId: 'org:acme',
      wallets: [{
        id: 'pipeline-wallet',
        name: 'Pipeline Wallet',
        type: 'personal',
        status: 'beta',
        description: 'Initial submission',
      }],
    },
  };
  const updateExport: WpExportEntry = {
    itemId: 'pipeline-wallet',
    slug: 'acme',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    publishedAt: '2026-06-23T12:00:00.000Z',
    document: {
      orgId: 'org:acme',
      wallets: [{
        id: 'pipeline-wallet',
        name: 'Pipeline Wallet',
        type: 'personal',
        status: 'production',
        description: 'After moderation update',
      }],
    },
  };

  const plan = buildImportPlan([createExport, updateExport], emptyState());
  assert.equal(plan.groups.length, 1);
  assert.equal(plan.groups[0]?.entries.length, 2);
  assert.equal(plan.skipped.length, 0);

  let doc = null as ReturnType<typeof mergeWalletIntoCatalog> | null;
  for (const entry of plan.groups[0]!.entries) {
    doc = mergeWalletIntoCatalog(doc, entry);
  }

  assert.equal(doc?.orgId, 'org:acme');
  assert.equal(doc?.wallets?.length, 1);
  const wallet = doc?.wallets?.[0];
  assert.equal(wallet?.id, 'pipeline-wallet');
  assert.equal(wallet?.status, 'production');
  assert.equal(wallet?.description, 'After moderation update');
  assert.ok(doc?.lastUpdated);
});

test('walletFromEntry prefers embedded wallet id over itemId metadata', () => {
  const entry: WpExportEntry = {
    itemId: 'meta-id',
    slug: 'acme',
    filename: 'wallet-catalog.json',
    source: 'wordpress',
    document: {
      orgId: 'org:acme',
      wallets: [{ id: 'embedded-id', name: 'Embedded', type: 'personal', status: 'production' }],
    },
  };
  const wallet = mergeWalletIntoCatalog(null, entry).wallets?.[0];
  assert.equal(wallet?.id, 'embedded-id');
});
