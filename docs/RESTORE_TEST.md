# Prueba de restore de base de datos

Procedimiento para validar `backend/scripts/backup-db.sh` y `backend/scripts/restore-db.sh` **sin tocar producción**.

## Scripts

| Script | Rol |
|--------|-----|
| `backend/scripts/backup-db.sh` | `pg_dump` → `backend/backups/pulsepath_YYYYMMDD_HHMMSS.sql.gz` |
| `backend/scripts/restore-db.sh <file.sql.gz>` | Restaura el dump en `DATABASE_URL` (sobrescribe) |
| `DRY_RUN=1` | Solo valida que el `.gz` existe y pasa `gunzip -t` |

Requisitos: `pg_dump`, `psql`, `gzip`/`gunzip`, `DATABASE_URL` en entorno o `backend/.env`.

## Regla de oro

- **Nunca** ejecutar restore real contra Neon/producción de estudio.
- Usar solo: `DRY_RUN=1`, o una base **desechable** (rama Neon de preview / Postgres local vacío).

## Dry-run local (ejecutado 2026-08-09)

Entorno: Windows + Git Bash. Sin dump real de producción en el repo. **No se ejecutó restore real.**

### 1) Crear un gzip mínimo de prueba (integridad)

```bash
cd backend
mkdir -p backups
echo 'SELECT 1;' | gzip -c > backups/pulsepath_dryrun_fixture.sql.gz
```

### 2) Validar integridad (sin tocar DB)

```bash
cd backend
DRY_RUN=1 ./scripts/restore-db.sh ./backups/pulsepath_dryrun_fixture.sql.gz
```

**Resultado real (2026-08-09):**

```
Fixture bytes: 30
DRY_RUN: backup file exists (1.0K), DATABASE_URL set.
Integrity check OK.
DRY_RUN_EXIT=0
```

El script leyó `DATABASE_URL` desde `backend/.env` solo para comprobar que está definido; con `DRY_RUN=1` **no** abre `psql` ni escribe en la base.

Si `DATABASE_URL` no está en el entorno ni en `.env`, el script falla con `ERROR: DATABASE_URL not set` — eso también valida el guardrail.

### 3) Qué validaría un restore real en base desechable

Solo tras apuntar `DATABASE_URL` a una **rama Neon desechable** o Postgres local vacío:

```bash
# A) Backup desde la fuente de prueba (NO prod)
export DATABASE_URL='postgresql://…desechable…'
./scripts/backup-db.sh

# B) Reset desechable + restore
export DATABASE_URL='postgresql://…otra-desechable-o-misma…'
./scripts/restore-db.sh ./backups/pulsepath_YYYYMMDD_HHMMSS.sql.gz

# C) Verificaciones post-restore
psql "$DATABASE_URL" -c '\dt'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM organizations;'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM daily_checkins;'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM access_codes;'
curl -s "$API_BASE/health"   # db: connected
```

Checklist post-restore:

- [ ] Tablas Prisma presentes (`organizations`, `access_codes`, `daily_checkins`, …)
- [ ] Conteos coherentes con el dump de origen
- [ ] Unique `(code_hash, date_local)` intacto
- [ ] `/health` → `db: connected`
- [ ] Ops adherencia responde 200 con admin secret

## Pendiente

- Restore **real** contra Neon desechable: no ejecutado en esta sesión (sin rama preview provisionada aquí).
- Cuando exista rama desechable: repetir pasos 3A–3C y anotar hashes de conteos en este documento.

## Rollback mental

Si un restore se lanzara por error contra prod: detener tráfico API, restaurar el backup **previo** más reciente, verificar `/health` y adherencia ops.
