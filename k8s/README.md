# Kubernetes Orchestration

This setup deploys Sigloop as separate workloads with path-based ingress routing:

- `/` -> `landing`
- `/app` -> `frontend`
- `/api/card-service/*` -> `card-service`
- `/api/api-service/*` -> `api-service`

## Prerequisites

- A Kubernetes cluster
- NGINX Ingress Controller installed (`ingressClassName: nginx`)
- Container images pushed and accessible:
  - `ghcr.io/your-org/sigloop-card-service:latest`
  - `ghcr.io/your-org/sigloop-api-service:latest`
  - `ghcr.io/your-org/sigloop-frontend:latest`
  - `ghcr.io/your-org/sigloop-landing:latest`

## 1) Optional secrets

Create a real secret file from example:

```bash
cp k8s/base/secret.example.yaml k8s/base/secret.yaml
```

Fill values, then apply:

```bash
kubectl apply -f k8s/base/secret.yaml
```

## 2) Configure host and images

Update these files before deploy:

- `k8s/base/ingress-web.yaml` -> `host: sigloop.local`
- `k8s/base/ingress-api.yaml` -> `host: sigloop.local`
- `k8s/base/deployment-*.yaml` -> container `image` values
- `k8s/base/configmap.yaml` -> `CONVEX_URL`, `VITE_CONVEX_URL` and any overrides

Important:

- `VITE_CONVEX_URL` must be an absolute URL (for example `https://<deployment>.convex.cloud`).
- If this is empty or relative, the webapp throws: `Provided address was not an absolute URL.`

## 3) Deploy

```bash
kubectl apply -k k8s/base
```

## 4) Verify

```bash
kubectl get pods -n sigloop
kubectl get svc -n sigloop
kubectl get ingress -n sigloop
```

If using local testing with `/etc/hosts`, map your ingress LB IP to `sigloop.local`.
