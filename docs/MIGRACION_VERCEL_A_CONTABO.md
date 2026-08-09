# Migración temporal Vercel → Contabo (cuando recuperes el VPS)

Este despliegue en Vercel es **temporal**. El canónico sigue siendo Contabo `161.97.69.228` + `app.getpulsepath.com`.

## Checklist de migración

1. Abrir SSH al Contabo (password del panel + puerto 22 abierto).
2. Instalar Docker + compose; clonar repo en `/opt/pulsepath`.
3. Copiar variables desde `backend/.env` local (Neon ya rotada, JWT, ENCRYPTION_KEY, ADMIN_SECRET, VAPID, CRON_SECRET).
4. Montar vhost Apache: [`deploy/apache/app.getpulsepath.com.conf`](../deploy/apache/app.getpulsepath.com.conf).
5. `certbot --apache -d app.getpulsepath.com`.
6. `bash deploy-prod.sh`.
7. Namecheap: A `app` → `161.97.69.228`.
8. Actualizar `CORS_ORIGINS` a `https://app.getpulsepath.com`.
9. Verificar checklist de [`docs/HTTPS_SETUP.md`](HTTPS_SETUP.md).
10. Apuntar la captación al dominio propio; retirar o pausar proyectos Vercel.

## Qué no cambia

- Base Neon (misma).
- Códigos `PP-2026-NNN` y org `study_mixed_2026`.
- Código de la app (`employee-app-stitch`).
