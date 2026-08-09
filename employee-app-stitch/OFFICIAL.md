# PulsePath — App oficial de empleado

**Esta carpeta es LA app oficial de PulsePath** (decisión 17 jul 2026).

## Qué es
- PWA React + TypeScript + Tailwind (tema azul Google Stitch `#264dd9`)
- Protocolo estudio ML: check-in diario (PVT-BA + KSS + contexto) + DASS-21 completo + GAD-7 + CBI en D0/D7/D14
- Sync cifrado al backend Node (`DailyCheckin` / `QuestionnaireSubmission`)
- i18n: ES (default) + EN
- Panel ops: adherencia sin scores individuales

## Archivado (NO usar)
- `employee-app/` — versión vieja (PVT+Stroop+CBI demo Ayuntamiento)
- Prototipos sueltos fuera del repo

## Deploy canónico (Contabo)
```bash
# En el VPS Contabo (/opt/pulsepath)
bash deploy-prod.sh
```
- App: `https://app.getpulsepath.com/` (base path `/`)
- Dashboard: `https://app.getpulsepath.com/dashboard/`
- API: `https://app.getpulsepath.com/api/` (o `api.getpulsepath.com`)

Org del estudio: `study_mixed_2026` · códigos `PP-2026-001`…`120`

## Variables de entorno (`.env` de build)
```
VITE_API_URL=https://app.getpulsepath.com/api/v1
VITE_ORG_SLUG=study_mixed_2026
VITE_BASE_PATH=/
```

## Preflight local ML
```bash
cd backend
npm run seed:study
npm run dev
# otra terminal
node scripts/preflight-study-flow.js
```
Export + baseline quedan en `backend/exports/preflight-local/`.
