FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_CONVEX_URL
ARG VITE_PRIVY_APP_ID
ARG VITE_CARD_SERVICE_URL=/api/card-service
ARG FRONTEND_BASE=/
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_PRIVY_APP_ID=${VITE_PRIVY_APP_ID}
ENV VITE_CARD_SERVICE_URL=${VITE_CARD_SERVICE_URL}
ENV FRONTEND_BASE=${FRONTEND_BASE}
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

