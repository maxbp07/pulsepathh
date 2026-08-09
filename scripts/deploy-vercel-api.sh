#!/usr/bin/env bash
# Deploy temporal PulsePath API + PWA a Vercel (sin Contabo).
# Requisitos: `npx vercel login` ya autenticado.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

echo "▶ Migraciones Neon..."
npx prisma migrate deploy

echo "▶ Deploy API..."
npx vercel deploy --prod --yes \
  --env DATABASE_URL="$(grep ^DATABASE_URL .env | cut -d= -f2-)" \
  --env JWT_SECRET="$(grep ^JWT_SECRET .env | cut -d= -f2-)" \
  --env ENCRYPTION_KEY="$(grep ^ENCRYPTION_KEY .env | cut -d= -f2-)" \
  --env ADMIN_SECRET="$(grep ^ADMIN_SECRET .env | cut -d= -f2-)" \
  --env CRON_SECRET="$(grep ^CRON_SECRET .env | cut -d= -f2-)" \
  --env VAPID_PUBLIC_KEY="$(grep ^VAPID_PUBLIC_KEY .env | cut -d= -f2-)" \
  --env VAPID_PRIVATE_KEY="$(grep ^VAPID_PRIVATE_KEY .env | cut -d= -f2-)" \
  --env VAPID_SUBJECT="$(grep ^VAPID_SUBJECT .env | cut -d= -f2-)" \
  --env DISABLE_PDF=1 \
  --env NODE_ENV=production \
  --env GIT_SHA="$(git rev-parse --short HEAD)"

echo "API desplegada. Anota la URL y continúa con deploy-pwa."
