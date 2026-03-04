# card-service

Minimal TypeScript + Hono REST service for Sigloop-style agent cards.

## Why this fits Sigloop

From the public landing page and whitepaper (`https://sigloop.tiscacatalin.com`), Sigloop is centered on:
- agent-scoped wallet controls (card-like API keys),
- spend limits + policies,
- auditable transaction trails,
- programmable card actions.

This service implements that core control plane behind a card secret (`x-card-secret`).

## Quick start

```bash
cd card-service
npm install
npm run dev
```

Server: `http://localhost:8787`

Seed demo secret:
- `sgl_demo_secret_123`

## Authentication

All `/v1/card/*` routes require:

```http
x-card-secret: sgl_...
```

## API reference

Full endpoint reference: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

Machine-readable schema:
- `GET /openapi.json`

## Notes

- Storage is in-memory (`src/data/store.ts`) to keep the service minimal.
- Replace `InMemoryCardStore` with a Convex/database-backed store for production.
- Values are wei strings for precision and chain compatibility.
