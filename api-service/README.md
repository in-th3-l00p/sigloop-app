# Sigloop API Service

API-key authenticated service for full Sigloop app interactions without the frontend.

## Run

```bash
cd api-service
npm install
CONVEX_URL=https://<your-convex-deployment>.convex.cloud npm run dev
```

Default port: `8788`.

## Auth

Use `x-api-key` header on all `/v1/*` routes.

## Key Policies

API keys support:
- `scopes`: `read`, `write`, `tx`, `admin` (`admin` implies all)
- `ipAllowlist`: optional source IP allowlist
- `rateLimitPerMinute`: optional per-key request cap

`POST /v1/accounts/:accountId/transactions` also requires `idempotency-key`.

## Docs

- `GET /openapi.json`
- [API Reference](./docs/API_REFERENCE.md)
