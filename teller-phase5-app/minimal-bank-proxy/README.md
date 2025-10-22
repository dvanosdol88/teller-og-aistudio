# Minimal Bank Data Proxy (Stand‑Alone)

A tiny Express server that exposes only the read‑only bank endpoints used by the frontend and proxies them to a configured backend, or serves the static demo dataset from this repo when enabled.

Based exclusively on files and contracts in `teller-phase5-codex`.

## Endpoints (read‑only)
- `GET /api/config`
- `GET /api/db/accounts`
- `GET /api/db/accounts/:accountId/balances`
- `GET /api/db/accounts/:accountId/transactions?limit=10`

All non‑GET requests to `/api/db/*` return `405`.

## Environment
- `PORT` (default `3000`)
- `BACKEND_URL` — required for proxy mode (e.g., `https://your-backend.example.com`)
- `FEATURE_STATIC_DB` — set to `true` to serve the local demo dataset from `../data/db.json` via `../lib/dataStore.js`. If `false`/unset, proxy mode is used.

## Run
```bash
# From this directory
npm install
PORT=3000 BACKEND_URL=https://your-backend.example.com npm start
# open http://localhost:3000/api/db/accounts
```

Demo/static mode
```bash
npm install
FEATURE_STATIC_DB=true npm start
# serves demo data from teller-phase5-codex/data/db.json
```

## Notes
- Proxies preserve paths under `/api/db/*` and forward headers (e.g., `Authorization`).
- `GET /api/config` returns `{ apiBaseUrl: "/api", FEATURE_USE_BACKEND: !FEATURE_STATIC_DB, FEATURE_STATIC_DB }` so the frontend can auto‑detect mode.
- This server intentionally omits manual‑data endpoints.

