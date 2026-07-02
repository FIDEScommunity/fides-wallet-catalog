import assert from 'node:assert/strict';
import test from 'node:test';
import {
  migrateCatalogDocumentV1ToV2,
  migrateWalletV1ToV2,
  normalizeLicenseValue,
} from './lib/migrate-wallet-catalog-v1-to-v2.js';
import { WALLET_CATALOG_SCHEMA_V2 } from './constants/wallet-v2-limits.js';

test('migrateWalletV1ToV2 maps video and certifications', () => {
  const migrated = migrateWalletV1ToV2({
    id: 'w1',
    name: 'Wallet',
    type: 'personal',
    video: 'https://example.com/v.mp4',
    certifications: ['ISO 27001', 'SOC 2'],
    license: 'AGPL-3.0',
  });

  assert.deepEqual(migrated.media, { videos: ['https://example.com/v.mp4'] });
  assert.deepEqual(migrated.recognitions, {
    certifications: [{ title: 'ISO 27001' }, { title: 'SOC 2' }],
  });
  assert.equal(migrated.license, 'AGPL-3.0-or-later');
  assert.equal(migrated.video, undefined);
  assert.equal(migrated.certifications, undefined);
});

test('normalizeLicenseValue maps unknown license to other', () => {
  const result = normalizeLicenseValue('Custom Enterprise License');
  assert.equal(result.license, 'other');
  assert.equal(result.licenseOther, 'Custom Enterprise License');
});

test('migrateCatalogDocumentV1ToV2 sets schema v2', () => {
  const doc = migrateCatalogDocumentV1ToV2({
    $schema: 'https://fides.community/schemas/wallet-catalog/v1',
    orgId: 'org:animo',
    wallets: [{ id: 'paradym', name: 'Paradym', type: 'organizational' }],
  });
  assert.equal(doc.$schema, WALLET_CATALOG_SCHEMA_V2);
});

test('migrateWalletV1ToV2 is idempotent for v2 wallet', () => {
  const wallet = {
    id: 'w1',
    name: 'Wallet',
    type: 'personal',
    media: { videos: ['https://youtu.be/abc'] },
    recognitions: { certifications: [{ title: 'ISO 27001' }] },
    license: 'MIT',
  };
  const once = migrateWalletV1ToV2(wallet);
  const twice = migrateWalletV1ToV2(once);
  assert.deepEqual(once, twice);
});
