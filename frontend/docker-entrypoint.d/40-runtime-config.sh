#!/bin/sh
set -eu

CONFIG_PATH="/usr/share/nginx/html/app-config.js"

cat > "$CONFIG_PATH" <<EOF
window.__SIGLOOP_CONFIG__ = {
  VITE_CONVEX_URL: "${VITE_CONVEX_URL:-}",
  VITE_PRIVY_APP_ID: "${VITE_PRIVY_APP_ID:-}",
  VITE_CARD_SERVICE_URL: "${VITE_CARD_SERVICE_URL:-https://cards.sigloop.online}",
  VITE_API_SERVICE_URL: "${VITE_API_SERVICE_URL:-https://api.sigloop.online}"
}
EOF

echo "[frontend] wrote runtime config to $CONFIG_PATH"
