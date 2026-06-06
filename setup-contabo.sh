#!/bin/bash
# =============================================================================
# PulsePath — Setup automático en Contabo
# Pega este script en el servidor y ejecuta: bash setup-contabo.sh
# =============================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   PulsePath — Setup servidor Contabo     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Actualizar sistema e instalar Docker ──────────────────────────────────
echo "▶ Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

echo "▶ Instalando Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "  Docker ya instalado."
fi

echo "▶ Instalando Docker Compose plugin..."
if ! docker compose version &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

echo "▶ Instalando git..."
apt-get install -y -qq git

# ─── 2. Clonar repositorio ────────────────────────────────────────────────────
APP_DIR="/opt/pulsepath"
echo ""
echo "▶ Clonando repositorio en $APP_DIR..."
if [ -d "$APP_DIR/.git" ]; then
  echo "  Repo ya existe — haciendo git pull..."
  cd "$APP_DIR" && git pull origin main
else
  git clone https://github.com/maxbp07/pulsepathh.git "$APP_DIR"
  cd "$APP_DIR"
fi
cd "$APP_DIR"

# ─── 3. Crear archivo .env ────────────────────────────────────────────────────
echo ""
echo "▶ Creando .env de producción..."
cat > "$APP_DIR/.env" << 'ENVEOF'
DATABASE_URL=postgresql://neondb_owner:npg_mRzx2tPMTU1O@ep-solitary-night-a2a7k6o8.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=pulsepath-demo-jwt-1517-2026-change-in-prod
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01
ADMIN_SECRET=pulsepath-admin-demo-2026
NODE_ENV=production
PORT=3000
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENVEOF
echo "  .env creado."

# ─── 4. Arrancar con Docker Compose producción ───────────────────────────────
echo ""
echo "▶ Construyendo y arrancando contenedores (puede tardar 5-10 min)..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build

# ─── 5. Esperar a que arranque y verificar ────────────────────────────────────
echo ""
echo "▶ Esperando a que el backend arranque..."
sleep 20

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/../ 2>/dev/null || echo "0")
HEALTH=$(curl -s http://localhost/api/ 2>/dev/null || echo "sin respuesta")

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║              SETUP COMPLETADO            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  App empleado:   http://161.97.69.228/"
echo "  Dashboard RRHH: http://161.97.69.228/dashboard/"
echo "  API health:     http://161.97.69.228/api/health"
echo ""
echo "  Login dashboard: rrhh@bcn.cat / demo1234"
echo "  Código demo:     BCN-2026-A050"
echo ""
echo "▶ Comprobando salud de la API..."
curl -s http://localhost:3000/health || echo "  (backend aún arrancando, espera 1 min y prueba la URL)"
echo ""
echo "  Logs en vivo: docker compose -f /opt/pulsepath/docker-compose.prod.yml logs -f backend"
