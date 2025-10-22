Minimal Bank Proxy (Option A: Proxy-Only) — Recipient README

What this is
- A tiny Node/Express server that exposes read-only bank endpoints and forwards them to your backend.

Requirements
- Node.js 18 or newer
- Backend URL that serves /api/db/* endpoints (you will set BACKEND_URL)

Setup
1) Open a terminal in this folder (minimal-bank-proxy)
2) Run: npm install

Run (live proxy)
1) set PORT=3000
2) set BACKEND_URL=https://your-backend.example.com
3) npm start
4) Open: http://localhost:3000/api/db/accounts

Endpoints (read-only)
- GET /api/config
- GET /api/db/accounts
- GET /api/db/accounts/:accountId/balances
- GET /api/db/accounts/:accountId/transactions?limit=10
- Non-GET on /api/db/* returns 405 (method_not_allowed)

Notes
- All headers (e.g., Authorization) are forwarded to the backend.
- Stop the server with Ctrl+C.

