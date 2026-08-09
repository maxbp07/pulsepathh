# Sembrar códigos de activación (post-deploy)

**Cuándo:** solo después de que `https://app.getpulsepath.com/health` responda `db: connected`.

**Formato canónico:** `PP-YYYY-NNN` (ej. `PP-2026-001`).
**Org:** `study_mixed_2026`.

## En el VPS (`/opt/pulsepath`)

```bash
cd /opt/pulsepath/backend
# Asegura DATABASE_URL del .env de producción
node scripts/seed-study.js
node scripts/provision-codes.js --org-slug study_mixed_2026 --count 120 --prefix PP-2026
```

## Local (contra Neon de producción — solo si el VPS aún no tiene Node)

```powershell
cd C:\Users\maxbp\pulsepath-v2\backend
# DATABASE_URL debe apuntar a Neon ya rotada
node scripts/seed-study.js
node scripts/provision-codes.js --org-slug study_mixed_2026 --count 120 --prefix PP-2026
```

## Entrega al preflight

1. Exportar lista de códigos generados (sin publicar en git).
2. Rellenar `docs/preflight/hoja-registro-codigos.md` con 30 códigos asignados a voluntarios.
3. Guardar el resto como reserva (abandonos / nuevos).

## Estado

- [ ] Deploy HTTPS listo
- [ ] seed-study ejecutado
- [ ] 120 códigos provisionados
- [ ] 30 asignados en hoja de registro
