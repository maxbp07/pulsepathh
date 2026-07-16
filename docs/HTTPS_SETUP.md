# HTTPS — app.getpulsepath.com en VPS MatForge

## Objetivo
Servir la PWA en `https://app.getpulsepath.com` (requerido para PWA install + notificaciones push).

## Opción A — Cloudflare (recomendada, gratis)
1. En Namecheap/DNS: CNAME `app` → túnel o proxy Cloudflare
2. Instalar `cloudflared` en VPS `158.220.119.17`
3. Crear túnel: `cloudflared tunnel create pulsepath-app`
4. Config ingress:
   ```yaml
   ingress:
     - hostname: app.getpulsepath.com
       service: http://127.0.0.1:80/pulsepath
     - service: http_status:404
   ```
5. DNS: CNAME `app.getpulsepath.com` → `<tunnel-id>.cfargotunnel.com`
6. Actualizar `VITE_API_URL=https://api.getpulsepath.com/api/v1` en build de producción

## Opción B — Certbot + nginx
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d app.getpulsepath.com
```
Añadir server block nginx para `/pulsepath/` → `/opt/pulsepath-stitch/`

## Post-deploy
- Rebuild app con `VITE_API_URL` apuntando al backend
- Verificar `window.isSecureContext === true` en móvil
- Probar notificaciones en `/notifications`

## Backend API (mismo VPS o subdominio)
- `api.getpulsepath.com` → proxy a `localhost:3000` (Node backend)
- CORS: permitir `https://app.getpulsepath.com`
