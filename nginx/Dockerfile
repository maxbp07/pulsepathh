# ═══════════════════════════════════════════════════════════════════════════════
# PulsePath — Nginx Dockerfile
# ═══════════════════════════════════════════════════════════════════════════════
#
# Construye la imagen nginx con los statics de los frontends ya copiados.
# Context de build: raíz del proyecto (ver docker-compose.prod.yml → nginx.build.context: .)
#
# Requisito previo: los frontends deben estar compilados ANTES de este build:
#   cd employee-app    && npm ci && npm run build
#   cd employer-dashboard && npm ci && npm run build
#
# employer-dashboard debe compilarse con base='/dashboard/' en su vite.config.js:
#   export default defineConfig({ base: '/dashboard/', ... })
# ═══════════════════════════════════════════════════════════════════════════════

FROM nginx:1.27-alpine

# ── Configuración de nginx ────────────────────────────────────────────────────
# Elimina la config por defecto y la reemplaza con la nuestra
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# ── Employee App (PWA) → raíz /usr/share/nginx/html/ ─────────────────────────
COPY employee-app/dist/ /usr/share/nginx/html/

# ── Employer Dashboard → /usr/share/nginx/html/dashboard/ ────────────────────
COPY employer-dashboard/dist/ /usr/share/nginx/html/dashboard/

# Puerto de escucha (documentativo; el host binding se define en docker-compose)
EXPOSE 80 443

# nginx:alpine ejecuta nginx en primer plano por defecto (CMD heredado de la imagen base)
