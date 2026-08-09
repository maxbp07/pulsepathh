# Criterios de puerta — preflight 30 × 14

Evaluar al **D14** del grueso de la cohorte (o fecha de corte acordada).
Fuente numérica: `GET /api/v1/ops/:orgId/adherence/summary` (`docs/OPS_ADHERENCE.md`).

## Puertas obligatorias

| # | Criterio | GO | NO-GO |
|---|----------|----|-------|
| 1 | **Adherencia diaria D14** | `adherence_daily_d14_pct` ≥ **60** | &lt; 60 |
| 2 | **Abandono** | `abandonment_pct` comprensible; casos contactados | Abandono &gt;40% sin causa UX clara |
| 3 | **Participantes activos** | Mayoría de activados con sync reciente en ventana de estudio | Colapso de `active_participants` |
| 4 | **Check-ins por día** | Curva `checkins_by_day` sin agujeros masivos | Varios días con ~0 check-ins tras D0 |
| 5 | **Latencia / estabilidad PVT** | Sin reportes sistemáticos de crash o UI bloqueada | ≥20% reporta fallo de PVT |
| 6 | **Sync / integridad** | 0 pérdida de datos confirmada; 409 investigados | Pérdida o cola terminal recurrente |
| 7 | **Consentimiento** | Flujo v1.0 estable; sin sync sin consentimiento | Regresión de consentimiento |

## Definiciones ops

- **Elegible D14:** `study_day >= 14` y código activado no revocado.
- **Adherencia D14:** entre elegibles, fracción con ≥14 `dateLocal` distintos con check-in.
- **Abandono operativo:** activado, study day ≥ 3, y ≥ 3 días sin check-in diario.
- **Activo:** `last_seen` en las últimas 48 h (respecto a `as_of`).

## Evidencias a adjuntar al cierre

1. Captura o JSON de `adherence/summary` en la fecha de corte.
2. Notas WhatsApp de bugs PVT / sync (sin PII innecesaria).
3. Confirmación de backup (`backup-db.sh`) y dry-run restore (`docs/RESTORE_TEST.md`).
4. Decisión escrita: **GO piloto empresa** / **NO-GO + plan de remediación**.

## Fuera de puerta (informativo)

- NPS informal, duración percibida, comentarios cualitativos.
- Completitud de cuestionarios D0/D7/D14 (`questionnaire_*_pct`) — deseable alta, no sustituye la puerta de adherencia diaria D14.
