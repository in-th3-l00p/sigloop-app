# card-service

Minimal TypeScript + Hono REST service for Sigloop agent cards, backed by Convex and ZeroDev kernel execution.

## Scope alignment (landing + whitepaper)

The public Sigloop docs position the product around:
- agent-scoped wallet access via card-like secrets,
- policy and spending controls,
- auditable transaction logs,
- ERC-4337/7579 account abstraction flows.

This service implements that control plane using:
- Convex for card state, policies, and transaction history,
- ZeroDev Kernel for transaction execution,
- `x-card-secret` for card-scoped API auth.

Sources:
- https://sigloop.tiscacatalin.com
- https://sigloop.tiscacatalin.com/whitepaper.pdf

## Environment

Required:

```bash
CONVEX_URL=https://<your-deployment>.convex.cloud
```

Optional:

```bash
PORT=8787
ZERODEV_PROJECT_ID=00f42aaa-bd75-486b-ad15-851fd20d6177
```

## Run

```bash
cd card-service
npm install
npm run dev
```

## Auth

All `/v1/card/*` routes require:

```http
x-card-secret: sgl_...
```

## API docs

- Human reference: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- OpenAPI: `GET /openapi.json`
