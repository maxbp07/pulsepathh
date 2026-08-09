# ═══════════════════════════════════════════════════════════════════════════════
# PulsePath — Nginx Dockerfile (employee-app-stitch oficial)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Prerequisito: compilar frontends antes del build Docker:
#   cd employee-app-stitch && VITE_BASE_PATH=/ npm ci && npm run build
#   cd employer-dashboard && npm ci && npm run build
# ═══════════════════════════════════════════════════════════════════════════════

FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# App oficial (PWA stitch) → raíz
COPY employee-app-stitch/dist/ /usr/share/nginx/html/

# Employer dashboard → /dashboard/
COPY employer-dashboard/dist/ /usr/share/nginx/html/dashboard/

EXPOSE 80 443
