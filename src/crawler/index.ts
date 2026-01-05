/**
 * FIDES Wallet Catalog Crawler
 * 
 * This script crawls registered wallet catalogs and aggregates the data.
 * In production this would run periodically (e.g. via cron job).
 */

import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { 
  WalletCatalog, 
  NormalizedWallet, 
  AggregatedCatalog, 
  RegistryEntry,
  WalletType,
  Platform
} from '../types/wallet.js';

// Load schema
const schemaPath = path.join(process.cwd(), 'schemas/wallet-catalog.schema.json');
const schema = JSON.parse(await fs.readFile(schemaPath, 'utf-8'));

// Setup validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateCatalog = ajv.compile(schema);

// Registry file (in production this would be a database)
const REGISTRY_PATH = path.join(process.cwd(), 'data/registry.json');
const AGGREGATED_PATH = path.join(process.cwd(), 'data/aggregated.json');

/**
 * Load the registry of registered providers
 */
async function loadRegistry(): Promise<RegistryEntry[]> {
  try {
    const data = await fs.readFile(REGISTRY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If no registry exists, create an empty one
    return [];
  }
}

/**
 * Save the registry
 */
async function saveRegistry(registry: RegistryEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Fetch a wallet catalog from a URL
 */
async function fetchCatalog(url: string): Promise<WalletCatalog | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate against schema
    if (!validateCatalog(data)) {
      console.error(`Validation failed for ${url}:`, validateCatalog.errors);
      return null;
    }
    
    return data as WalletCatalog;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Fetch catalog from local file (for development/testing)
 */
async function fetchLocalCatalog(filePath: string): Promise<WalletCatalog | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const catalog = JSON.parse(data);
    
    // Validate against schema
    if (!validateCatalog(catalog)) {
      console.error(`Validation failed for ${filePath}:`, validateCatalog.errors);
      return null;
    }
    
    return catalog as WalletCatalog;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

/**
 * Normalize wallets with provider info
 */
function normalizeWallets(catalog: WalletCatalog, catalogUrl: string): NormalizedWallet[] {
  const fetchedAt = new Date().toISOString();
  
  return catalog.wallets.map(wallet => ({
    ...wallet,
    provider: catalog.provider,
    catalogUrl,
    fetchedAt
  }));
}

/**
 * Calculate statistics
 */
function calculateStats(wallets: NormalizedWallet[]): AggregatedCatalog['stats'] {
  const byType: Record<WalletType, number> = {
    personal: 0,
    organizational: 0,
    both: 0
  };
  
  const byPlatform: Record<Platform, number> = {
    iOS: 0,
    Android: 0,
    Web: 0,
    Windows: 0,
    macOS: 0,
    Linux: 0,
    CLI: 0
  };
  
  const byCredentialFormat: Record<string, number> = {};
  
  wallets.forEach(wallet => {
    // By type
    byType[wallet.type]++;
    
    // By platform
    wallet.platforms?.forEach(platform => {
      byPlatform[platform]++;
    });
    
    // By credential format
    wallet.credentialFormats?.forEach(format => {
      byCredentialFormat[format] = (byCredentialFormat[format] || 0) + 1;
    });
  });
  
  return {
    totalWallets: wallets.length,
    totalProviders: new Set(wallets.map(w => w.provider.did)).size,
    byType,
    byPlatform,
    byCredentialFormat
  };
}

/**
 * Main function: crawl all registered catalogs
 */
async function crawl(): Promise<void> {
  console.log('🔍 Starting wallet catalog crawl...\n');
  
  // For development: load local examples
  const examplesDir = path.join(process.cwd(), 'examples');
  const providers = await fs.readdir(examplesDir);
  
  const allWallets: NormalizedWallet[] = [];
  const allProviders: Map<string, WalletCatalog['provider']> = new Map();
  
  for (const provider of providers) {
    const catalogPath = path.join(examplesDir, provider, 'wallet-catalog.json');
    
    try {
      await fs.access(catalogPath);
      console.log(`📦 Processing: ${provider}`);
      
      const catalog = await fetchLocalCatalog(catalogPath);
      
      if (catalog) {
        const normalizedWallets = normalizeWallets(catalog, catalogPath);
        allWallets.push(...normalizedWallets);
        allProviders.set(catalog.provider.did, catalog.provider);
        
        console.log(`   ✅ Found ${catalog.wallets.length} wallet(s)`);
      } else {
        console.log(`   ❌ Failed to load catalog`);
      }
    } catch {
      // No catalog file found
      continue;
    }
  }
  
  // Create aggregated data
  const aggregated: AggregatedCatalog = {
    wallets: allWallets,
    providers: Array.from(allProviders.values()),
    lastUpdated: new Date().toISOString(),
    stats: calculateStats(allWallets)
  };
  
  // Save
  await fs.mkdir(path.dirname(AGGREGATED_PATH), { recursive: true });
  await fs.writeFile(AGGREGATED_PATH, JSON.stringify(aggregated, null, 2));
  
  console.log('\n📊 Aggregation complete:');
  console.log(`   Total wallets: ${aggregated.stats.totalWallets}`);
  console.log(`   Total providers: ${aggregated.stats.totalProviders}`);
  console.log(`   Output: ${AGGREGATED_PATH}`);
}

// Run crawler
crawl().catch(console.error);
