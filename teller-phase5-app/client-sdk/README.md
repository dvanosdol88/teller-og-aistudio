# Teller Phase 5 — Typed Client SDK (Frontend)

A lightweight, dependency‑free TypeScript client for the Teller Phase 5 proxy API, based only on this repository's server contract.

## Install / Use

- Drop `api.ts` into your frontend codebase (or import from this repo).
- No external deps; it uses the global `fetch` by default. You can inject a custom fetch if needed.

```ts
import { APIClient } from './api';

const api = new APIClient({
  baseUrl: '/api', // defaults to '/api'
  headers: {
    // Optional default headers (e.g., Authorization)
    // Authorization: `Bearer ${token}`
  }
});

// Load config
const config = await api.getConfig();

// Accounts
const { accounts } = await api.getAccounts();

// Balance and transactions
const bal = await api.getBalance(accounts[0].id);
const txs = await api.getTransactions(accounts[0].id, 10);

// Manual summary (liabilities + asset + totals)
const summary = await api.getManualSummary();

// Update a manual liability (flags must be enabled server-side)
await api.putManualLiability('heloc_loan', {
  outstandingBalanceUsd: 48000,
  interestRatePct: 6.5,
  updatedBy: 'frontend-dev'
});

// Update property asset value
await api.putManualAsset(350000, 'frontend-dev');

// Per-account manual rent roll
await api.putManualRentRoll('acc_llc_operating', 2500);
```

## Error Handling

All methods throw on non‑2xx responses, with body parsed (JSON if possible) attached on the `error.response` field. The server also sets `x-request-id` header that you can log.

## Types

The exported types cover responses documented in this repo and server code (server.js, lib/*, docs/*).

