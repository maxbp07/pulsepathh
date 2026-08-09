# HTTPS — app.getpulsepath.com (Contabo canónico)

## Objetivo
Servir la PWA en `https://app.getpulsepath.com` (requerido para PWA install + Web Push).

**Canónico:** VPS Contabo + org `study_mixed_2026` + app `employee-app-stitch`.
(La ruta MatForge `/pulsepath/` quedó obsoleta.)

## Opción A — Cloudflare Tunnel (recomendada)
1. DNS: CNAME `app` → túnel Cloudflare (o A → IP Contabo si proxy naranja).
2. En el VPS Contabo instalar `cloudflared`.
3. Crear túnel: `cloudflared tunnel create pulsepath-app`
4. Ingress ejemplo:
   ```yaml
   ingress:
     - hostname: app.getpulsepath.com
       service: http://127.0.0.1:80
     - service: http_status:404
   ```
5. DNS: CNAME `app.getpulsepath.com` → `<tunnel-id>.cfargotunnel.com`
6. Build stitch con:
   ```
   VITE_API_URL=https://app.getpulsepath.com/api/v1
   VITE_ORG_SLUG=study_mixed_2026
   VITE_BASE_PATH=/
   ```

## Opción B — Certbot + nginx en Contabo
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d app.getpulsepath.com
```
Usar el `nginx.conf` del repo (`docker-compose.prod.yml` / `deploy-prod.sh`).

## Post-deploy checklist
- [ ] `curl -s https://app.getpulsepath.com/health` → `db: connected`
- [ ] Activar `PP-2026-001` desde el móvil (HTTPS)
- [ ] `window.isSecureContext === true`
- [ ] VAPID configurado + job `push-reminders.job.js --dry-run`
- [ ] Ops dashboard: login estudio, panel adherencia

## CORS / secrets
- `CORS_ORIGINS=https://app.getpulsepath.com`
- Rotar `JWT_SECRET`, `ENCRYPTION_KEY` (backup inmutable), `ADMIN_SECRET`, password root VPS
