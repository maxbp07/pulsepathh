#!/bin/bash
# PulsePath — actualizar producción en Contabo (Neon + Docker)
# Uso en el servidor: cd /opt/pulsepath && bash deploy-prod.sh
set -e

cd "$(dirname "$0")"

echo "▶ git pull..."
git pull origin main

echo "▶ Build employee-app..."
cd employee-app && npm ci && npm run build && cd ..

echo "▶ Build employer-dashboard..."
cd employer-dashboard && npm ci && npm run build && cd ..

echo "▶ Rebuild Docker (backend + nginx)..."
docker compose -f docker-compose.prod.yml up -d --build nginx backend

echo "▶ Estado:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✓ Despliegue listo. Abre el túnel Cloudflare o http://localhost:3001/dashboard/"
echo "  (Opcional) Re-seed demo: cd backend && npm run seed:demo"
