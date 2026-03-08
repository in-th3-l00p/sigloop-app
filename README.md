# Sigloop App (Docker Deployment)

This repository can be deployed as a **single Docker container** that runs:
- `frontend` (static build served by Nginx)
- `card-service` (Node API)
- `api-service` (Node API)
- Nginx reverse proxy in front of both services

The container exposes one port (`8080`) and proxies internal services under path prefixes.

## 1. Build

The frontend needs build-time Vite env vars:
- `VITE_CONVEX_URL`
- `VITE_PRIVY_APP_ID`

Optional build arg:
- `VITE_CARD_SERVICE_URL` (defaults to `/card-service`)

```bash
docker build -t sigloop-app:prod \
  --build-arg VITE_CONVEX_URL="https://<your-convex>.convex.cloud" \
  --build-arg VITE_PRIVY_APP_ID="<your-privy-app-id>" \
  --build-arg VITE_CARD_SERVICE_URL="/card-service" \
  .
```

## 2. Run

```bash
docker run -d \
  --name sigloop-app \
  -p 8080:8080 \
  -e CONVEX_URL="https://<your-convex-deployment>.convex.cloud" \
  sigloop-app:prod
```

## 3. Routes

- Frontend: `http://localhost:8080/`
- Card service: `http://localhost:8080/card-service/*`
- API service: `http://localhost:8080/api-service/*`
- Container health: `http://localhost:8080/health`

## 4. Runtime Env Vars (Docker Run)

You must provide:

- `CONVEX_URL`
  - Used by both `card-service` and `api-service`.
  - Example: `https://polite-fox-123.convex.cloud`

## 5. Optional Environment Variables

You can also provide:

- `ZERODEV_PROJECT_ID`
  - Used by `card-service` for chain RPC URL construction.
  - If missing, service uses its internal default project id.

- `SEPOLIA_RPC_URL`
  - Used by `api-service` for Sepolia.
  - Default: `https://rpc.sepolia.org`

- `BASE_SEPOLIA_RPC_URL`
  - Used by `api-service` for Base Sepolia.
  - Default: `https://sepolia.base.org`

- `TX_RETRY_WINDOW_MS`
  - Used by `card-service` background tx tracking.
  - Default: `120000`

## 6. Full Env Variable Inventory (From Project Sources)

These vars are referenced in the repo; not all are required for production Docker run:

- Build-time frontend:
  - `VITE_CONVEX_URL`
  - `VITE_PRIVY_APP_ID`
  - `VITE_CARD_SERVICE_URL`
- Runtime services:
  - `CONVEX_URL` (required)
  - `ZERODEV_PROJECT_ID`
  - `SEPOLIA_RPC_URL`
  - `BASE_SEPOLIA_RPC_URL`
  - `TX_RETRY_WINDOW_MS`
  - `PORT` (set internally by Supervisor in the container)
- SDK/examples/docs usage:
  - `SIGLOOP_API_KEY`
  - `SIGLOOP_CARD_SECRET`
  - `SIGLOOP_CARD_SERVICE_URL`
- Integration test-only:
  - `RUN_INTEGRATION_TESTS`
  - `CARD_SERVICE_BASE_URL`
  - `CARD_SERVICE_TEST_SECRET`
  - `API_SERVICE_BASE_URL`
  - `API_SERVICE_TEST_KEY`
  - `PRIVY_APP_ID`

## 7. Quick Verification

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:8080/card-service/health
curl -s http://localhost:8080/api-service/health
```

Expected responses:
- `ok`
- `{"ok":true,"service":"card-service"}`
- `{"ok":true,"service":"api-service"}`

## 8. Stop / Remove

```bash
docker rm -f sigloop-app
```

## Notes

- The frontend is built in Docker and served by Nginx.
- Both backend services are managed by Supervisor inside the same container.
- This setup is designed for platforms that only support a single Dockerfile deploy.
