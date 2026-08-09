# Deploy Contabo — bloqueantes (21 jul 2026)

## Estado
- Código + `deploy-prod.sh` listos (stitch + estudio `study_mixed_2026`).
- **SSH a VPS falló** (`Permission denied` en BatchMode). Sin acceso interactivo a secretos.
- HTTPS `app.getpulsepath.com` **no verificado** desde este entorno.

## Checklist Max (desbloquea prod-deploy)
1. Rotar password root VPS (sigue siendo urgente).
2. Añadir clave SSH pública del agente/PC a `authorized_keys`, o ejecutar tú:
   ```bash
   cd /opt/pulsepath && git pull && bash deploy-prod.sh
   ```
3. DNS: `app.getpulsepath.com` → Contabo / Cloudflare Tunnel (ver `docs/HTTPS_SETUP.md`).
4. `.env` prod: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY` (backup), `ADMIN_SECRET`, VAPID.
5. `npx prisma migrate deploy && npm run seed:study`
6. Verificar:
   ```bash
   curl -s https://app.getpulsepath.com/health
   ```

Hasta entonces el gate a 100 humanos es **NO-GO**. Pipeline ML se valida en local con:
```bash
cd backend
npm run seed:synthetic-dry-run
```
