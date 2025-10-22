// Minimal bank-only proxy server (read-only /api/db/*)
// Based on teller-phase5-codex/server.js and lib/dataStore.js

try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || '';
const FEATURE_STATIC_DB = String(process.env.FEATURE_STATIC_DB || '').toLowerCase() === 'true';

// Request ID middleware
function requestId() {
  return (req, res, next) => {
    const existing = req.headers['x-request-id'];
    const rid = existing || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    req.requestId = rid;
    res.setHeader('x-request-id', rid);
    next();
  };
}

const app = express();
app.use(requestId());

// Config endpoint used by frontends to locate API base
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: '/api',
    FEATURE_USE_BACKEND: !FEATURE_STATIC_DB,
    FEATURE_STATIC_DB,
  });
});

// Health
app.get('/api/healthz', (req, res) => {
  res.json({ ok: true, backendUrl: BACKEND_URL || null, mode: FEATURE_STATIC_DB ? 'static' : 'live' });
});

// Enforce read-only on /api/db/*
app.use('/api/db', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed', request_id: req.requestId });
  }
  next();
});

if (FEATURE_STATIC_DB) {
  console.log('[bank-proxy] Serving demo dataset (FEATURE_STATIC_DB=true)');
  const { getAccounts, getAccountById, getBalanceByAccountId, getTransactionsByAccountId } = require('../lib/dataStore');

  app.get('/api/db/accounts', (req, res) => {
    res.json({ accounts: getAccounts() });
  });

  app.get('/api/db/accounts/:accountId/balances', (req, res) => {
    const { accountId } = req.params;
    const account = getAccountById(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const balance = getBalanceByAccountId(accountId);
    if (!balance) return res.status(404).json({ error: 'Balance not found' });
    return res.json(balance);
  });

  app.get('/api/db/accounts/:accountId/transactions', (req, res) => {
    const { accountId } = req.params;
    const account = getAccountById(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const limitQuery = req.query && req.query.limit;
    let limit = undefined;
    if (limitQuery !== undefined) {
      const parsed = Number(limitQuery);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'limit must be a positive number' });
      }
      limit = Math.floor(parsed);
    } else {
      limit = 10;
    }
    const txs = getTransactionsByAccountId(accountId, limit);
    if (!txs) return res.status(404).json({ error: 'Transactions not found' });
    return res.json(txs);
  });
} else {
  if (!BACKEND_URL) {
    console.warn('[bank-proxy] BACKEND_URL is not set; /api/db/* will fail');
  }
  console.log(`[bank-proxy] Proxying /api/db/* to ${BACKEND_URL}`);
  app.use('/api/db', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    proxyTimeout: 30000,
    timeout: 30000,
    onProxyReq(proxyReq, req) {
      // Log forwarding; headers (e.g., Authorization) are passed through by default
      console.log(`[proxy] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
    },
    onError(err, req, res) {
      console.error(`[proxy] Error: ${err.message}`);
      res.status(502).json({ error: 'Backend proxy error', message: err.message, request_id: req.requestId });
    },
  }));
}

// Fallback root
app.get('/', (req, res) => {
  res.type('text/plain').send('Minimal bank data proxy is running. Try /api/db/accounts');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[bank-proxy] Server on http://0.0.0.0:${PORT}`);
});

