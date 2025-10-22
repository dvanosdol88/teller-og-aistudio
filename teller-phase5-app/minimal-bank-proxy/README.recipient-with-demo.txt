Minimal Bank Proxy (Option B: Proxy + Static Demo) — Recipient README

What this is
- A tiny Node/Express server that can either:
  - Proxy live requests to your backend, or
  - Serve a built-in static demo dataset (no backend required)

Folder contents you should have
- minimal-bank-proxy/ (this server)
- teller-phase5-codex/lib/dataStore.js (demo data loader)
- teller-phase5-codex/data/db.json (demo dataset)

Requirements
- Node.js 18 or newer

Setup
1) Open a terminal in minimal-bank-proxy
2) Run: npm install

Run (live proxy)
1) set FEATURE_STATIC_DB=false
2) set BACKEND_URL=https://your-backend.example.com
3) npm start
4) Open: http://localhost:3000/api/db/accounts

Run (static demo — offline)
1) set FEATURE_STATIC_DB=true
2) npm start
3) Open: http://localhost:3000/api/db/accounts

Endpoints (read-only)
- GET /api/config
- GET /api/db/accounts
- GET /api/db/accounts/:accountId/balances
- GET /api/db/accounts/:accountId/transactions?limit=10
- Non-GET on /api/db/* returns 405 (method_not_allowed)

Notes
- In demo mode the data comes from teller-phase5-codex/data/db.json.
- In live mode all headers (e.g., Authorization) are forwarded to the backend.
- Stop the server with Ctrl+C.

