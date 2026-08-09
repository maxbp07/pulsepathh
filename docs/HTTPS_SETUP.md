# HTTPS — app.getpulsepath.com (Contabo canónico)

## Objetivo
Servir la PWA en `https://app.getpulsepath.com` (requerido para PWA install + Web Push).

**Canónico:** VPS Contabo `161.97.69.228` + org `study_mixed_2026` + app `employee-app-stitch`.
Apache del host ocupa **80 y 443**. El stack Docker de PulsePath escucha en `127.0.0.1:3001` (nginx del compose). Apache hace proxy inverso hacia ese puerto.

## Arquitectura

```
Internet → Apache :443 (TLS/certbot)
              └─ proxy → 127.0.0.1:3001 (docker nginx)
                            ├─ /           → employee-app-stitch
                            ├─ /dashboard/ → employer-dashboard
                            └─ /api/       → backend :3000
```

## DNS (Namecheap)
Registro **A**: host `app` → `161.97.69.228`.

## Provisionamiento (VPS reinstalado)

```bash
# 1) Limpiar host key antigua en tu máquina local (Windows)
ssh-keygen -R 161.97.69.228

# 2) Entrar (password del panel Contabo tras reinstalar)
ssh root@161.97.69.228

# 3) Docker
curl -fsSL https://get.docker.com | sh
apt-get update && apt-get install -y docker-compose-plugin git certbot python3-certbot-apache

# 4) Clonar
git clone https://github.com/maxbp07/pulsepathh.git /opt/pulsepath
cd /opt/pulsepath

# 5) .env (generar secretos EN el servidor; no copiar del repo)
# JWT_SECRET, ENCRYPTION_KEY (64 hex), ADMIN_SECRET, VAPID_*, DATABASE_URL (Neon rotada)
# CORS_ORIGINS=https://app.getpulsepath.com

# 6) Vhost Apache (versionado en el repo)
a2enmod proxy proxy_http proxy_wstunnel headers rewrite ssl
cp deploy/apache/app.getpulsepath.com.conf /etc/apache2/sites-available/
a2ensite app.getpulsepath.com.conf
apache2ctl configtest && systemctl reload apache2

# 7) Certificado (cuando el DNS A ya resuelva)
certbot --apache -d app.getpulsepath.com

# 8) Deploy
bash deploy-prod.sh
```

## Opción alternativa — Cloudflare Tunnel
Si Apache/certbot falla: CNAME `app` → túnel Cloudflare hacia `http://127.0.0.1:3001`.

## Post-deploy checklist
- [ ] `curl -s https://app.getpulsepath.com/health` → `db: connected`
- [ ] Activar `PP-2026-001` desde el móvil (HTTPS)
- [ ] `window.isSecureContext === true`
- [ ] VAPID configurado + `node backend/scripts/push-reminders.job.js --dry-run`
- [ ] Panel adherencia / endpoints ops

## CORS / secrets
- `CORS_ORIGINS=https://app.getpulsepath.com`
- Rotar `JWT_SECRET`, `ENCRYPTION_KEY` (backup inmutable), `ADMIN_SECRET`, password root VPS
- La password de Neon del historial git (`8b98b19`) **debe rotarse** aunque HEAD ya esté limpio
