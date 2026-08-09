#!/bin/bash
# PulsePath — actualizar producción en Contabo (Neon + Docker + employee-app-stitch)
# Uso en el servidor: cd /opt/pulsepath && bash deploy-prod.sh
set -e

cd "$(dirname "$0")"
PREV_TAG="${PREV_TAG:-pulsepath-nginx:prev}"

echo "▶ git pull..."
git pull origin main

echo "▶ Tag imagen nginx actual (rollback)..."
docker compose -f docker-compose.prod.yml build nginx 2>/dev/null || true
if docker image inspect pulsepath-nginx:latest >/dev/null 2>&1; then
  docker tag pulsepath-nginx:latest "$PREV_TAG" 2>/dev/null || true
fi

echo "▶ Build employee-app-stitch (base /)..."
cd employee-app-stitch
npm ci
VITE_BASE_PATH=/ \
VITE_API_URL="${VITE_API_URL:-/api/v1}" \
VITE_ORG_SLUG="${VITE_ORG_SLUG:-study_mixed_2026}" \
npm run build
cd ..

echo "▶ Build employer-dashboard..."
cd employer-dashboard
npm ci
npm run build
cd ..

echo "▶ Prisma migrate deploy..."
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
cd ..

echo "▶ Rebuild Docker (backend + nginx)..."
docker compose -f docker-compose.prod.yml up -d --build nginx backend

echo "▶ Estado:"
docker compose -f docker-compose.prod.yml ps
curl -sf http://localhost:3001/health || curl -sf http://localhost:3001/api/v1/../health || true

echo ""
echo "✓ Despliegue listo."
echo "  App:      http://localhost:3001/"
echo "  Dashboard: http://localhost:3001/dashboard/"
echo "  Rollback:  PREV_TAG=$PREV_TAG docker compose -f docker-compose.prod.yml up -d nginx"
