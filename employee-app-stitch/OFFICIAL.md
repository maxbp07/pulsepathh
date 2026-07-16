# PulsePath — App oficial de empleado

**Esta carpeta es LA app oficial de PulsePath** (decisión 17 jul 2026).

## Qué es
- PWA React + TypeScript + Tailwind (tema azul Google Stitch `#264dd9`)
- Instrumentos: PVT-BA adaptativo (Basner 2022) + KSS + DASS-21 estrés + SIB burnout
- Índice: Fatigue Risk Index (FRI) → Vitality 0-100
- i18n: ES (default) + EN
- Datos locales (IndexedDB) + sync opcional al backend Node

## Archivado (NO usar)
- `Downloads/Proyecto Dentista/pulsepath-app` — JSX duplicado del otro agente (solo diseño de referencia)
- `Downloads/Proyecto Dentista/pulsepath-backend` — FastAPI descartado (usamos `pulsepath-v2/backend` Node)
- `employee-app/` — versión vieja (PVT+Stroop+CBI)

## Deploy
```bash
cd employee-app-stitch
npm run build
python ../scripts/deploy_stitch.py
```
URL: `http://158.220.119.17/pulsepath/` (HTTPS pendiente: `app.getpulsepath.com`)

## Variables de entorno (`.env`)
```
VITE_API_URL=https://api.getpulsepath.com/api/v1
VITE_ORG_SLUG=bcn
```
