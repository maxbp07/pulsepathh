#Requires -Version 5.1
<#
.SYNOPSIS
    Arranca el entorno de desarrollo completo de PulsePath en Windows.

.DESCRIPTION
    Levanta PostgreSQL via Docker, instala dependencias y lanza en terminales
    separadas: backend (nodemon), employee-app (Vite :5173) y
    employer-dashboard (Vite :5174).

.NOTES
    Requisitos: Docker Desktop corriendo, Node 20, npm 10+
    Ejecutar desde la raiz del repositorio:
        .\scripts\dev-start.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Colores helpers ──────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n>> $msg" -ForegroundColor Cyan   }
function Write-Ok    { param($msg) Write-Host "   OK  $msg" -ForegroundColor Green  }
function Write-Warn  { param($msg) Write-Host "   !!  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "   ERR $msg" -ForegroundColor Red; exit 1 }

# ── Raiz del proyecto ────────────────────────────────────────────────────────
$Root = Split-Path -Parent $PSScriptRoot

# ── Verificar herramientas ───────────────────────────────────────────────────
Write-Step "Verificando herramientas necesarias..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fail "Docker no encontrado. Instala Docker Desktop: https://docs.docker.com/get-docker/"
}
Write-Ok "docker $(docker --version)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail "Node.js no encontrado. Instala Node 20 LTS: https://nodejs.org/"
}
$nodeVersion = (node --version)
if ($nodeVersion -notmatch '^v2[0-9]') {
    Write-Warn "Se recomienda Node 20+. Version detectada: $nodeVersion"
}
Write-Ok "node $nodeVersion"

# ── Archivos .env ────────────────────────────────────────────────────────────
Write-Step "Verificando archivos .env..."

if (-not (Test-Path "$Root\.env")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Warn ".env creado desde .env.example (revisa JWT_SECRET y ENCRYPTION_KEY antes de produccion)"
} else {
    Write-Ok ".env raiz existe"
}

if (-not (Test-Path "$Root\backend\.env")) {
    Copy-Item "$Root\backend\.env.example" "$Root\backend\.env"
    Write-Warn "backend\.env creado desde backend\.env.example"
} else {
    Write-Ok "backend\.env existe"
}

# ── PostgreSQL via Docker ────────────────────────────────────────────────────
Write-Step "Levantando PostgreSQL (Docker)..."

Set-Location $Root
$pgState = docker inspect -f "{{.State.Running}}" pulsepath-postgres 2>$null
if ($pgState -eq 'true') {
    Write-Ok "pulsepath-postgres ya esta corriendo"
} else {
    docker-compose up -d postgres | Out-Null
    Write-Ok "Contenedor postgres iniciado"
}

# Esperar healthcheck
Write-Host "   Esperando healthcheck de PostgreSQL" -NoNewline
$attempts = 0
do {
    Start-Sleep -Seconds 2
    $health = docker inspect -f "{{.State.Health.Status}}" pulsepath-postgres 2>$null
    Write-Host "." -NoNewline
    $attempts++
    if ($attempts -gt 20) { Write-Fail "`nPostgreSQL no levanto en 40 s. Revisa: docker logs pulsepath-postgres" }
} while ($health -ne 'healthy')
Write-Host " listo" -ForegroundColor Green

# ── Backend: instalar deps + migrar + seed ───────────────────────────────────
Write-Step "Instalando dependencias del backend..."
Set-Location "$Root\backend"
npm install --prefer-offline 2>&1 | Select-String -Pattern 'added|warn|error' | ForEach-Object { Write-Host "   $_" }
Write-Ok "npm install completado"

Write-Step "Aplicando migraciones Prisma..."
npx prisma migrate dev --name init 2>&1 | Select-String -Pattern 'applied|already|error' | ForEach-Object { Write-Host "   $_" }
Write-Ok "Migraciones aplicadas"

Write-Step "Ejecutando seed (org + access codes + usuario RRHH)..."
npm run prisma:seed
Write-Ok "Seed completado"

# ── Abrir terminales separadas ───────────────────────────────────────────────
Write-Step "Lanzando servicios en terminales separadas..."

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\backend'; Write-Host '[BACKEND] nodemon en :3000' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

# Employee App
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\employee-app'; Write-Host '[EMPLOYEE-APP] Vite en :5173' -ForegroundColor Magenta; npm install --prefer-offline; npm run dev"
) -WindowStyle Normal

# Employer Dashboard
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\employer-dashboard'; Write-Host '[EMPLOYER-DASHBOARD] Vite en :5174' -ForegroundColor Yellow; npm install --prefer-offline; npm run dev"
) -WindowStyle Normal

# ── Resumen ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  PulsePath — Entorno de desarrollo listo" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Servicio              URL" -ForegroundColor White
Write-Host "  ─────────────────── ──────────────────────────────"
Write-Host "  API Backend          http://localhost:3000"
Write-Host "  Employee App (PWA)   http://localhost:5173"
Write-Host "  Employer Dashboard   http://localhost:5174"
Write-Host "  PostgreSQL           localhost:5432"
Write-Host ""
Write-Host "  Credenciales de prueba:" -ForegroundColor White
Write-Host "  Empleado  → codigo: BCN-2026-A001"
Write-Host "  RRHH      → rrhh@bcn.cat / demo1234"
Write-Host ""
Write-Host "  Para detener Postgres: docker-compose stop postgres"
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
