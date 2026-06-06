#!/usr/bin/env bash
# =============================================================================
# dev-start.sh — Arranque local completo de PulsePath (Linux / macOS)
# =============================================================================
# Uso:  bash scripts/dev-start.sh
#       chmod +x scripts/dev-start.sh && ./scripts/dev-start.sh
# =============================================================================
set -euo pipefail

# ── Colores ───────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

step()  { echo -e "\n${CYAN}>> $*${NC}"; }
ok()    { echo -e "   ${GREEN}OK${NC}  $*"; }
warn()  { echo -e "   ${YELLOW}!!${NC}  $*"; }
fail()  { echo -e "   ${RED}ERR${NC} $*"; exit 1; }

# ── Raiz del proyecto ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

# ── Verificar herramientas ────────────────────────────────────────────────────
step "Verificando herramientas necesarias..."

command -v docker >/dev/null 2>&1 || fail "Docker no encontrado. Instala Docker: https://docs.docker.com/get-docker/"
ok "docker $(docker --version | head -1)"

command -v node >/dev/null 2>&1 || fail "Node.js no encontrado. Instala Node 20 LTS: https://nodejs.org/"
NODE_VER="$(node --version)"
[[ "$NODE_VER" =~ ^v2[0-9] ]] || warn "Se recomienda Node 20+. Version detectada: $NODE_VER"
ok "node $NODE_VER"

command -v npm >/dev/null 2>&1 || fail "npm no encontrado"
ok "npm $(npm --version)"

# ── Archivos .env ─────────────────────────────────────────────────────────────
step "Verificando archivos .env..."

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  warn ".env creado desde .env.example (revisa JWT_SECRET y ENCRYPTION_KEY antes de produccion)"
else
  ok ".env raiz existe"
fi

if [ ! -f "$ROOT/backend/.env" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  warn "backend/.env creado desde backend/.env.example"
else
  ok "backend/.env existe"
fi

# ── PostgreSQL via Docker ─────────────────────────────────────────────────────
step "Levantando PostgreSQL (Docker)..."

cd "$ROOT"
PG_RUNNING=$(docker inspect -f "{{.State.Running}}" pulsepath-postgres 2>/dev/null || echo "false")
if [ "$PG_RUNNING" = "true" ]; then
  ok "pulsepath-postgres ya esta corriendo"
else
  docker compose up -d postgres
  ok "Contenedor postgres iniciado"
fi

# Esperar healthcheck
printf "   Esperando healthcheck de PostgreSQL"
ATTEMPTS=0
while true; do
  HEALTH=$(docker inspect -f "{{.State.Health.Status}}" pulsepath-postgres 2>/dev/null || echo "starting")
  if [ "$HEALTH" = "healthy" ]; then
    echo -e " ${GREEN}listo${NC}"
    break
  fi
  printf "."
  sleep 2
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -gt 20 ]; then
    fail "\nPostgreSQL no levanto en 40 s. Revisa: docker logs pulsepath-postgres"
  fi
done

# ── Backend: instalar deps + migrar + seed ────────────────────────────────────
step "Instalando dependencias del backend..."
cd "$ROOT/backend"
npm install --prefer-offline
ok "npm install completado"

step "Aplicando migraciones Prisma..."
npx prisma migrate dev --name init
ok "Migraciones aplicadas"

step "Ejecutando seed (org + access codes + usuario RRHH)..."
npm run prisma:seed
ok "Seed completado"

# ── Lanzar servicios en background ───────────────────────────────────────────
step "Lanzando servicios en segundo plano..."

# Detectar si hay un emulador de terminal disponible para abrir ventanas nuevas
open_terminal() {
  local title="$1"
  local dir="$2"
  local cmd="$3"

  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="$title" -- bash -c "cd '$dir' && $cmd; exec bash"
  elif command -v xterm >/dev/null 2>&1; then
    xterm -title "$title" -e "bash -c \"cd '$dir' && $cmd; exec bash\"" &
  elif [[ "$(uname)" == "Darwin" ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$dir' && $cmd\""
  else
    # Fallback: proceso en background con log
    echo "  (sin terminal grafico — ejecutando en background, log en /tmp/${title}.log)"
    bash -c "cd '$dir' && $cmd" > "/tmp/${title}.log" 2>&1 &
    echo "  PID $! → /tmp/${title}.log"
  fi
}

cd "$ROOT/employee-app"
npm install --prefer-offline

cd "$ROOT/employer-dashboard"
npm install --prefer-offline

open_terminal "pulsepath-backend"    "$ROOT/backend"            "npm run dev"
open_terminal "pulsepath-employee"   "$ROOT/employee-app"       "npm run dev"
open_terminal "pulsepath-dashboard"  "$ROOT/employer-dashboard" "npm run dev"

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  PulsePath — Entorno de desarrollo listo${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Servicio              URL${NC}"
echo    "  ─────────────────── ──────────────────────────────"
echo    "  API Backend          http://localhost:3000"
echo    "  Employee App (PWA)   http://localhost:5173"
echo    "  Employer Dashboard   http://localhost:5174"
echo    "  PostgreSQL           localhost:5432"
echo ""
echo -e "  ${BOLD}Credenciales de prueba:${NC}"
echo    "  Empleado  → codigo: BCN-2026-A001"
echo    "  RRHH      → rrhh@bcn.cat / demo1234"
echo ""
echo    "  Para detener Postgres: docker compose stop postgres"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
