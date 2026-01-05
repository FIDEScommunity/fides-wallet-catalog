/**
 * FIDES Wallet Catalog API Server
 * 
 * Simple Express server that serves the aggregated wallet data.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import type { AggregatedCatalog, WalletFilters, NormalizedWallet } from '../types/wallet.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const AGGREGATED_PATH = path.join(process.cwd(), 'data/aggregated.json');

/**
 * Load the aggregated data
 */
async function loadAggregatedData(): Promise<AggregatedCatalog | null> {
  try {
    const data = await fs.readFile(AGGREGATED_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Filter wallets based on criteria
 */
function filterWallets(wallets: NormalizedWallet[], filters: WalletFilters): NormalizedWallet[] {
  return wallets.filter(wallet => {
    // Search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        wallet.name.toLowerCase().includes(searchLower) ||
        wallet.description?.toLowerCase().includes(searchLower) ||
        wallet.provider.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filters.type?.length) {
      if (!filters.type.includes(wallet.type)) return false;
    }
    
    // Platform filter
    if (filters.platforms?.length) {
      const hasMatchingPlatform = filters.platforms.some(
        p => wallet.platforms?.includes(p)
      );
      if (!hasMatchingPlatform) return false;
    }
    
    // Credential format filter
    if (filters.credentialFormats?.length) {
      const hasMatchingFormat = filters.credentialFormats.some(
        f => wallet.credentialFormats?.includes(f)
      );
      if (!hasMatchingFormat) return false;
    }
    
    // Open source filter
    if (filters.openSource !== undefined) {
      if (wallet.openSource !== filters.openSource) return false;
    }
    
    // Status filter
    if (filters.status?.length) {
      if (!wallet.status || !filters.status.includes(wallet.status)) return false;
    }
    
    return true;
  });
}

// API Routes

/**
 * GET /api/wallets
 * Get all wallets, with optional filters
 */
app.get('/api/wallets', async (req, res) => {
  const data = await loadAggregatedData();
  
  if (!data) {
    return res.status(503).json({ 
      error: 'Data not available. Run the crawler first.' 
    });
  }
  
  // Parse filters from query params
  const filters: WalletFilters = {
    search: req.query.search as string,
    type: req.query.type ? (req.query.type as string).split(',') as any : undefined,
    platforms: req.query.platforms ? (req.query.platforms as string).split(',') as any : undefined,
    credentialFormats: req.query.credentialFormats ? (req.query.credentialFormats as string).split(',') as any : undefined,
    openSource: req.query.openSource === 'true' ? true : req.query.openSource === 'false' ? false : undefined,
    status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
  };
  
  const filteredWallets = filterWallets(data.wallets, filters);
  
  res.json({
    wallets: filteredWallets,
    total: filteredWallets.length,
    lastUpdated: data.lastUpdated
  });
});

/**
 * GET /api/wallets/:id
 * Get a specific wallet
 */
app.get('/api/wallets/:providerId/:walletId', async (req, res) => {
  const data = await loadAggregatedData();
  
  if (!data) {
    return res.status(503).json({ 
      error: 'Data not available' 
    });
  }
  
  const wallet = data.wallets.find(
    w => w.provider.did.includes(req.params.providerId) && w.id === req.params.walletId
  );
  
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  res.json(wallet);
});

/**
 * GET /api/providers
 * Get all registered providers
 */
app.get('/api/providers', async (req, res) => {
  const data = await loadAggregatedData();
  
  if (!data) {
    return res.status(503).json({ 
      error: 'Data not available' 
    });
  }
  
  res.json({
    providers: data.providers,
    total: data.providers.length
  });
});

/**
 * GET /api/stats
 * Get statistics
 */
app.get('/api/stats', async (req, res) => {
  const data = await loadAggregatedData();
  
  if (!data) {
    return res.status(503).json({ 
      error: 'Data not available' 
    });
  }
  
  res.json({
    stats: data.stats,
    lastUpdated: data.lastUpdated
  });
});

/**
 * GET /api/filters
 * Get available filter options
 */
app.get('/api/filters', async (req, res) => {
  const data = await loadAggregatedData();
  
  if (!data) {
    return res.status(503).json({ 
      error: 'Data not available' 
    });
  }
  
  // Collect unique values for filters
  const platforms = new Set<string>();
  const credentialFormats = new Set<string>();
  const protocols = new Set<string>();
  const didMethods = new Set<string>();
  const certifications = new Set<string>();
  
  data.wallets.forEach(wallet => {
    wallet.platforms?.forEach(p => platforms.add(p));
    wallet.credentialFormats?.forEach(f => credentialFormats.add(f));
    wallet.issuanceProtocols?.forEach(p => protocols.add(p));
    wallet.presentationProtocols?.forEach(p => protocols.add(p));
    wallet.supportedDIDMethods?.forEach(m => didMethods.add(m));
    wallet.certifications?.forEach(c => certifications.add(c));
  });
  
  res.json({
    types: ['personal', 'organizational', 'both'],
    platforms: Array.from(platforms).sort(),
    credentialFormats: Array.from(credentialFormats).sort(),
    protocols: Array.from(protocols).sort(),
    didMethods: Array.from(didMethods).sort(),
    certifications: Array.from(certifications).sort(),
    statuses: ['development', 'beta', 'production', 'deprecated']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FIDES Wallet Catalog API running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET /api/wallets       - List all wallets (with filters)');
  console.log('  GET /api/providers     - List all providers');
  console.log('  GET /api/stats         - Get statistics');
  console.log('  GET /api/filters       - Get available filter options');
});
