# Piloto técnico 10 → 100 participantes

## Objetivo

Validar el stack completo (app Stitch + API + dashboard + sync + push + export ML) antes de escalar de 10 a 100 códigos.

## Preflight automatizado

```bash
# Desde la raíz del repo (Linux/Mac/Git Bash)
bash scripts/pilot-preflight.sh
```

En Windows (PowerShell):

```powershell
cd backend; npm test
cd ..\employee-app-stitch; npm test; npm run build
curl http://localhost:3000/health
```

## Despliegue Contabo unificado

```bash
# En el servidor
cd /opt/pulsepath
cp .env.example .env   # completar secretos (ver backend/.env.example)
bash deploy-prod.sh
```

Variables críticas en `.env`:

- `DATABASE_URL` (Neon)
- `JWT_SECRET`, `ENCRYPTION_KEY`, `ADMIN_SECRET`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `CORS_ORIGINS=https://app.getpulsepath.com`

## Dry run — 10 participantes

1. **Migración + seed**: `cd backend && npx prisma migrate deploy && npm run seed:study`
2. **10 códigos**: usar `PP-2026-001` … `PP-2026-010` de la hoja externa (WhatsApp manual)
3. **Flujo por participante** (manual o Playwright):
   - Login → onboarding + consentimiento → activación
   - Check-in PVT D0
   - `/study` → DASS-21 completo + GAD-7 + CBI en D0
4. **Ops**: dashboard `/dashboard/` → login `ops@study.pulsepath.local` / `studyops2026` + admin secret
5. **Verificar adherencia**: sin scores, solo completitud
6. **Export ML**: `npm run ml:export -- --out ./exports/dry-run-10`
7. **Backup/restore**: `backend/scripts/backup-db.sh` + `DRY_RUN=1 backend/scripts/restore-db.sh <file>`

## Criterios GO / NO-GO (técnicos)

| Criterio | GO | NO-GO |
|----------|-----|-------|
| Health API | `db: connected`, sin 5xx sostenidos | DB caída o errores ingestión |
| Sync | 0 entradas `terminal` en outbox tras 24h | Conflictos 409 sin resolver |
| D0 completo | ≥9/10 con DASS21_FULL + GAD7 + CBI | <8/10 |
| Push | Job dry-run envía sin error VAPID | VAPID no configurado en prod |
| Backup | `backup-db.sh` genera archivo | Fallo backup |
| Export | `training_windows.jsonl` > 0 tras D0 | Export vacío con datos en DB |
| ML baseline | `python ml/train_baseline.py` corre sin error | Script falla |

## Escalar a 100

Solo si **todos los criterios GO** se cumplen tras D7 del dry-run:

1. Distribuir códigos `PP-2026-011` … `PP-2026-100` vía hoja externa
2. Activar cron ops: `ops/cron/pulsepath.cron`
3. Monitorizar adherencia diaria en dashboard
4. Post D14: `npm run ml:export` + `python ml/train_baseline.py` por instrumento

## Rollback

```bash
PREV_TAG=pulsepath-nginx:prev docker compose -f docker-compose.prod.yml up -d nginx
```

## Fuera de alcance automatizado

- Reclutamiento WhatsApp y hoja cifrada código↔contacto
- DNS/HTTPS (activar según `docs/HTTPS_SETUP.md`)
- Aprobación legal GDPR
- Decisión humana final GO a 100
