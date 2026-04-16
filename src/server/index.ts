/**
 * FIDES Wallet Catalog API Server (local development)
 *
 * Production public API: Vercel routes under /api/public/ (see docs/API.md).
 */

import express from 'express';
import cors from 'cors';
import {
  loadAggregatedDataSync,
  parseWalletFiltersFromQuery,
  filterWallets,
  sortWallets,
  parsePagination,
  parseSort,
  paginateWallets,
} from "../../lib/walletPublicApi";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * GET /api/wallets
 * List wallets (legacy path; same filters as GET /api/public/wallet on Vercel).
 */
app.get('/api/wallets', (req, res) => {
  const data = loadAggregatedDataSync();

  if (!data) {
    return res.status(503).json({
      error: 'Data not available. Run the crawler first.',
    });
  }

  const filters = parseWalletFiltersFromQuery(req.query as Record<string, string | string[] | undefined>);
  let list = filterWallets(data.wallets, filters);
  const { field, desc } = parseSort(req.query as Record<string, string | string[] | undefined>);
  sortWallets(list, field, desc);
  const { page, size } = parsePagination(req.query as Record<string, string | string[] | undefined>);
  const paged = paginateWallets(list, page, size);

  res.json({
    ...paged,
    lastUpdated: data.lastUpdated,
  });
});

/**
 * GET /api/wallets/:providerId/:walletId
 */
app.get('/api/wallets/:providerId/:walletId', (req, res) => {
  const data = loadAggregatedDataSync();

  if (!data) {
    return res.status(503).json({
      error: 'Data not available',
    });
  }

  const orgIdParam = decodeURIComponent(req.params.providerId);
  const wallet = data.wallets.find(
    (w) => w.orgId === orgIdParam && w.id === req.params.walletId,
  );

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json(wallet);
});

app.listen(PORT, () => {
  console.log(`FIDES Wallet Catalog API running on http://localhost:${PORT}`);
  console.log('  GET /api/wallets       - List wallets (filters + pagination)');
  console.log('  GET /api/wallets/:orgId/:walletId - One wallet');
});
