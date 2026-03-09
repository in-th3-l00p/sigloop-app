FROM node:22-bookworm-slim AS card-builder
WORKDIR /app/card-service
COPY card-service/package*.json ./
RUN npm install --no-audit --no-fund
COPY card-service ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS api-builder
WORKDIR /app/api-service
COPY api-service/package*.json ./
RUN npm install --no-audit --no-fund
COPY api-service ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend ./
ARG VITE_CARD_SERVICE_URL=/api/card-service
ARG FRONTEND_BASE=/app/
ARG VITE_CONVEX_URL
ARG VITE_PRIVY_APP_ID
ENV VITE_CARD_SERVICE_URL=${VITE_CARD_SERVICE_URL}
ENV FRONTEND_BASE=${FRONTEND_BASE}
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_PRIVY_APP_ID=${VITE_PRIVY_APP_ID}
RUN npm run build

FROM node:22-bookworm-slim AS landing-builder
WORKDIR /app/landing
COPY landing/package*.json ./
RUN npm install --no-audit --no-fund
COPY landing ./
ARG LANDING_BASE=/
ENV LANDING_BASE=${LANDING_BASE}
RUN npm run build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx supervisor \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV CARD_SERVICE_PORT=8787
ENV API_SERVICE_PORT=8788

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/sigloop.conf

COPY --from=frontend-builder /app/frontend/dist /var/www/frontend
COPY --from=landing-builder /app/landing/dist /var/www/landing

WORKDIR /srv
COPY --from=card-builder /app/card-service/package*.json /srv/card-service/
COPY --from=card-builder /app/card-service/node_modules /srv/card-service/node_modules
COPY --from=card-builder /app/card-service/dist /srv/card-service/dist

COPY --from=api-builder /app/api-service/package*.json /srv/api-service/
COPY --from=api-builder /app/api-service/node_modules /srv/api-service/node_modules
COPY --from=api-builder /app/api-service/dist /srv/api-service/dist

EXPOSE 8080
CMD ["supervisord", "-n"]
