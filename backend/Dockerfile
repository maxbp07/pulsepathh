# ═══════════════════════════════════════════════════════════════════════════════
# PulsePath Backend — Dockerfile (multi-stage)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Stages:
#   builder     → instala todas las deps (incluye prisma CLI) y ejecuta prisma generate
#   development → todas las deps disponibles; usado por docker-compose.yml (dev)
#   production  → solo deps de producción + Chromium para Puppeteer PDF; imagen final
#
# Por qué node:20-slim (Debian Bookworm) y NO alpine:
#   Puppeteer/Chromium requiere glibc (no musl). Alpine rompe el binding de Chromium.
#   node:20-slim da la imagen más pequeña compatible con glibc.
# ═══════════════════════════════════════════════════════════════════════════════


# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Instala TODAS las dependencias (incluyendo prisma CLI de devDeps) y genera
# el cliente de Prisma compilado para la plataforma Linux del runner.
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
# Genera el cliente Prisma (binario específico de la plataforma)
RUN npx prisma generate


# ─── Stage 2: Development ────────────────────────────────────────────────────
# Todas las deps disponibles (devDeps incluidas) para entornos de desarrollo.
# Usado por docker-compose.yml que monta el código fuente como volumen.
FROM node:20-slim AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copia el cliente Prisma generado para esta plataforma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]


# ─── Stage 3: Production ─────────────────────────────────────────────────────
# Solo deps de producción + Chromium del sistema para Puppeteer.
# Este es el target usado por docker-compose.prod.yml.
FROM node:20-slim AS production

WORKDIR /app

# ── Chromium y dependencias del sistema para Puppeteer (generación de PDF) ───
# El paquete `chromium` de Debian Bookworm instala automáticamente todas
# las librerías X11/NSS/GTK necesarias. fonts-liberation garantiza que los
# PDF usen fuentes vectoriales limpias (no se mezclen con fuentes del sistema).
RUN apt-get update \
    && apt-get install -y \
        chromium \
        fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Usar el Chromium del sistema; no descargar el bundled de Puppeteer (~170 MB)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

# ── Instalar solo dependencias de producción ─────────────────────────────────
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Cliente Prisma generado para esta plataforma (del stage builder) ──────────
# Contiene el binary query engine compilado para linux/x64.
# El package @prisma/client (ya instalado arriba) lo busca en node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ── Código fuente de la aplicación ───────────────────────────────────────────
COPY src ./src
COPY prisma ./prisma

EXPOSE 3000

# Healthcheck: GET / debe responder 200
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD node -e "const h=require('http');h.get('http://localhost:3000/',r=>{process.exit(r.statusCode<400?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
