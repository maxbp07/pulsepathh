#!/bin/bash
# =============================================================================
# PulsePath — Setup automático en Contabo (sin secretos embebidos)
# Uso: export DATABASE_URL=... JWT_SECRET=... ENCRYPTION_KEY=... ADMIN_SECRET=...
#      bash setup-contabo.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/pulsepath}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   PulsePath — Setup servidor Contabo     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

require_env() {
  for var in DATABASE_URL JWT_SECRET ENCRYPTION_KEY ADMIN_SECRET; do
    if [[ -z "${!var:-}" ]]; then
      echo "ERROR: $var must be set in the environment before running setup." >&2
      echo "Copy backend/.env.example to $APP_DIR/.env and fill secrets." >&2
      exit 1
    fi
  done
}

echo "▶ Instalando Docker (si falta)..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version &> /dev/null; then
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin git
fi

echo "▶ Clonando/actualizando repo en $APP_DIR..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "${REPO_URL:-https://github.com/maxbp07/pulsepathh.git}" "$APP_DIR"
  cd "$APP_DIR"
fi

require_env

echo "▶ Escribiendo .env desde variables de entorno..."
cat > "$APP_DIR/.env" << ENVEOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ADMIN_SECRET=${ADMIN_SECRET}
NODE_ENV=production
PORT=3000
CORS_ORIGINS=${CORS_ORIGINS:-https://app.getpulsepath.com}
VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY:-}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY:-}
VAPID_SUBJECT=${VAPID_SUBJECT:-mailto:ops@study.pulsepath.local}
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENVEOF

echo "▶ Despliegue producción..."
bash "$APP_DIR/deploy-prod.sh"

echo ""
echo "✓ Setup completado. Verifica: curl -s http://localhost:3001/health"
