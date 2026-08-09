# Panel de adherencia (ops) — preflight

Endpoints JSON para monitorizar el preflight de 30 participantes / 14 días.
**No exponen scores** (FRI, ítems, vitalidad, payloads).

Autenticación: cabecera `X-Admin-Secret: $ADMIN_SECRET`.

Base: `https://<API>/api/v1/ops`

## Resumen agregado

```http
GET /api/v1/ops/:orgId/adherence/summary?as_of=YYYY-MM-DD
X-Admin-Secret: …
```

### Campos útiles para puerta de preflight

| Campo | Significado |
|-------|-------------|
| `target_n` | N objetivo de la org |
| `codes_provisioned` / `activated` | Códigos emitidos vs activados |
| `active_participants` | Activados con `last_seen` en últimas 48 h |
| `abandoned` / `abandonment_pct` | Activados con ≥3 días de estudio y ≥3 días sin check-in |
| `checkins_today` / `adherence_today_pct` | Check-ins en `as_of` / % sobre activados |
| `checkins_by_day` | Mapa `{ "2026-08-01": 12, … }` |
| `adherence_daily_d7_pct` | % elegibles D7 con ≥7 días de check-in |
| `adherence_daily_d14_pct` | % elegibles D14 con ≥14 días de check-in (**puerta ≥ 60%**) |
| `questionnaire_d0/d7/d14_pct` | % activados con al menos un instrumento en ese timepoint |
| `gates` | Umbrales documentados (`adherence_d14_min_pct: 60`, …) |

### Ejemplo curl

```bash
curl -sS -H "X-Admin-Secret: $ADMIN_SECRET" \
  "$API_BASE/api/v1/ops/$ORG_ID/adherence/summary?as_of=$(date -u +%F)" | jq .
```

## Detalle por participante

```http
GET /api/v1/ops/:orgId/adherence?as_of=YYYY-MM-DD
X-Admin-Secret: …
```

Por slot (`PP-001`, …):

- `activated`, `study_day`, `last_seen_at`
- `last_daily_date`, `days_since_last_daily`
- `active`, `abandoned`
- `daily_days_completed`, `daily_dates`
- `questionnaires_done` (`D0`/`D7`/`D14` boolean)
- `eligible_d7`, `eligible_d14`

Usar `slot_label` para cruzar con la hoja WhatsApp externa (nunca se almacenan teléfonos en la API).

## Stats de códigos (admin)

```http
GET /api/v1/admin/codes/:orgId/stats
X-Admin-Secret: …
```

Respuesta: `{ total, activated, revoked }`.

## Criterios de puerta (resumen)

Ver también `docs/preflight/criterios-de-puerta.md` y `docs/BETA_PROTOCOLO.md`.

- Adherencia D14 ≥ 60%
- Abandono acotado (monitorizar `abandonment_pct`)
- Incidentes de sync: 0 pérdidas / conflictos no resueltos
- Latencia PVT y bugs: canal WhatsApp + export local

## UI dashboard

Si el dashboard web no muestra aún estos campos, los JSON anteriores son la fuente de verdad para el preflight. Ampliar la UI leyendo `adherence/summary` sin añadir campos de score.
