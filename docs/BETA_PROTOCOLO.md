# Protocolo beta — PulsePath (30 participantes × 14 días)

> Ensayo del protocolo de piloto B2B antes de desplegar en empresa.
> **NO es entrenamiento de ML.** **NO es diagnóstico médico.**

## Objetivo

Validar usabilidad, sync, consentimiento y **adherencia** con voluntarios externos antes del piloto organizacional.

## Cohorte

| Parámetro | Valor |
|-----------|--------|
| **N** | **30** participantes |
| **Duración** | **14 días** calendario desde el día 0 de cada persona |
| **Código** | Único `PP-2026-NNN` (hoja externa cifrada; ver `docs/preflight/hoja-registro-codigos.md`) |
| **App** | `https://app.getpulsepath.com` (PWA `employee-app-stitch`) |
| **Idioma** | ES / CA / EN según preferencia del dispositivo |

## Instrumentos reales (app)

Ventanas en `employee-app-stitch/src/lib/studySchedule.ts` (`D0` / `D7` / `D14`):

| Timepoint | Cuándo | Instrumentos |
|-----------|--------|--------------|
| **D0** | Día de activación (study day ≥ 0) | **DASS-21 completo** (21 ítems) + **GAD-7** + **CBI** (19) |
| **D7** | Study day ≥ 7 | Misma batería |
| **D14** | Study day ≥ 14 | Misma batería |

### Cada día (días 0–14)

Check-in diario completo:

1. Contexto de sueño
2. KSS (1–9)
3. PVT-BA (~3 min, o parada temprana por criterio BA)

`dateLocal` = fecha civil del **dispositivo** (no UTC). Un solo check-in por `dateLocal` (dedupe cliente + servidor).

## Captación (WhatsApp)

1. Mensaje inicial: `docs/preflight/mensaje-whatsapp.md`
2. Info participante: `docs/preflight/info-participante.md`
3. Asignar código desde la hoja: `docs/preflight/hoja-registro-codigos.md`
4. Recordatorios: `docs/WHATSAPP_RUNBOOK.md` (D0, +48 h sin sync, D6, D13)

**La hoja código↔WhatsApp nunca se sube al servidor PulsePath.**

## Criterio de éxito

- **Adherencia D14 ≥ 60%** → protocolo listo para piloto empresa  
  (definición ops: % de participantes elegibles D14 con ≥14 check-ins diarios; ver `docs/OPS_ADHERENCE.md`)
- **&lt; 40%** → revisar UX, recordatorios, duración del PVT; no escalar

## Criterios de puerta (GO / NO-GO)

Detalle en `docs/preflight/criterios-de-puerta.md`. Resumen:

| Puerta | GO | NO-GO |
|--------|----|-------|
| Adherencia diaria D14 | ≥ 60% | &lt; 60% |
| Abandono | `abandonment_pct` acotado y justificado | Abandono masivo sin causa UX |
| Latencia PVT | Sin quejas sistemáticas de lentitud/crash | Fallos de PVT en ≥20% |
| Sync | 0 pérdidas de datos; conflictos 409 investigados | Pérdida confirmada o cola terminal recurrente |
| Consentimiento / privacidad | Flujo v1.0 estable | Regresiones de consentimiento |

Monitorización: `GET /api/v1/ops/:orgId/adherence/summary` (`docs/OPS_ADHERENCE.md`).

## Qué NO decir

- «Entrenamos un modelo de ML contigo» / «tus datos entrenan la IA»
- «Esto es un diagnóstico médico» / «detectamos depresión/ansiedad clínica»
- «Basner valida / avala PulsePath» (ni NASA como endorsement comercial)
- Promesas de cura, certificación clínica o sustituto de evaluación profesional

## Métricas operativas (spreadsheet + ops)

| Métrica | Fuente |
|---------|--------|
| Adherencia D7 / D14 | Ops summary |
| Check-ins por día | `checkins_by_day` |
| Activos / abandonos | `active_participants`, `abandoned` |
| Bugs / latencia PVT | Canal WhatsApp |
| NPS informal | «¿Lo seguirías usando?» 1–10 (opcional) |

## Materiales

- `docs/preflight/mensaje-whatsapp.md`
- `docs/preflight/hoja-registro-codigos.md`
- `docs/preflight/info-participante.md`
- `docs/preflight/criterios-de-puerta.md`
- `docs/OPS_ADHERENCE.md`
- `docs/RESTORE_TEST.md`
