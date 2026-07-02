import Ajv2020, { type AnySchema } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaRoot = join(__dirname, '..', 'schemas');
const fixtureRoot = join(schemaRoot, 'fixtures');

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function createValidator(schemaFile: string) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = loadJson(join(schemaRoot, schemaFile)) as AnySchema;
  const validate = ajv.compile(schema);
  return validate;
}

const validateV2 = createValidator('wallet-catalog.schema.json');
const validateV1 = createValidator('wallet-catalog-v1.schema.json');

function assertValid(validate: ReturnType<typeof createValidator>, fixtureName: string) {
  const data = loadJson(join(fixtureRoot, fixtureName));
  const ok = validate(data);
  assert.equal(ok, true, JSON.stringify(validate.errors, null, 2));
}

function assertInvalid(validate: ReturnType<typeof createValidator>, fixtureName: string) {
  const data = loadJson(join(__dirname, '..', 'schemas', 'fixtures-negative', fixtureName));
  const ok = validate(data);
  assert.equal(ok, false);
}

test('v2 schema validates community minimal fixture', () => {
  assertValid(validateV2, 'wallet-catalog-community-minimal.json');
});

test('v2 schema validates pro full fixture', () => {
  assertValid(validateV2, 'wallet-catalog-pro-full.json');
});

test('v2 schema rejects license other without licenseOther', () => {
  assertInvalid(validateV2, 'wallet-catalog-invalid-license-other.json');
});

test('v2 schema const matches fixture $schema', () => {
  const schema = loadJson(join(schemaRoot, 'wallet-catalog.schema.json')) as {
    properties?: { $schema?: { const?: string } };
  };
  const fixture = loadJson(join(fixtureRoot, 'wallet-catalog-community-minimal.json')) as {
    $schema?: string;
  };
  assert.equal(fixture.$schema, schema.properties?.$schema?.const);
});

test('v1 archive schema still loads for community catalogs during migration', () => {
  assert.equal(typeof validateV1, 'function');
});
