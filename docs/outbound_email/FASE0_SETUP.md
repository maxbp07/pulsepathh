# Fase 0 — Infraestructura cold email PulsePath

Checklist manual + comandos. Tiempo estimado: 2-3 horas (sin contar warm-up).

## 1. Dominios comprados (28 jun 2026) ✅

5 dominios comprados, separados en 2 tiers:

| # | Dominio | Tier | Segmentos | Buzón |
|---|---------|------|-----------|-------|
| 1 | `trypulsepath.com` | **formal** | vcs, fellowships, innovacion corporativa | `max@trypulsepath.com` |
| 2 | `joinpulsepath.co` | **formal** | residencias (RRHH) | `hola@joinpulsepath.co` |
| 3 | `trypulsepath.co` | **formal** | deportistas, call centers | `hola@trypulsepath.co` |
| 4 | `trypulsepath.online` | **volume** (warm-up) | call centers, residencias secundario | `hola@trypulsepath.online` |
| 5 | `joinpulsepath.online` | **volume** (warm-up) | backup / rotación | `hola@joinpulsepath.online` |

- **Tier formal** = público sensible a marca (VCs, fellowships, RRHH, deportistas). Buzón `.com`/`.co`.
- **Tier volume** = warm-up agresivo y rotación de volumen (`.online`), absorbe el grueso del envío.

**No renovar** al año 2 si la reputación baja — comprar dominio fresco.

## 2. Zoho Mail (~1 EUR/buzón/mes)

1. [zoho.com/mail](https://www.zoho.com/mail/) → plan Mail Lite
2. Añadir los **5 dominios** de la tabla de arriba
3. **1 buzón por dominio** para arrancar (5 buzones = 5 dominios). Escalar a 2/dominio solo tras warm-up OK.
4. Generar contraseña de aplicación SMTP por buzón → pegarla en `n8n/seed_mailboxes.sql` (`CHANGEME_*`)

Buzones a crear en Zoho (exactos):

```
max@trypulsepath.com
hola@joinpulsepath.co
hola@trypulsepath.co
hola@trypulsepath.online
hola@joinpulsepath.online
```

SMTP: `smtp.zoho.eu` puerto **587** STARTTLS

## 3. DNS por dominio (obligatorio)

En el panel DNS de cada dominio:

### SPF
```
TXT @  v=spf1 include:zoho.eu ~all
```

### DKIM
Zoho Mail → Dominios → DKIM → copiar registro CNAME/TXT que te den.

### DMARC
```
TXT _dmarc  v=DMARC1; p=none; rua=mailto:dmarc@TU-DOMINIO.com
```
Tras 4 semanas sin problemas: `p=quarantine`.

## 4. Postgres en VPS

```bash
# En el VPS (o local con docker-compose)
export DATABASE_URL=postgresql://pulsepath:PASSWORD@localhost:5432/pulsepath
bash n8n/setup_vps.sh
```

Local con Docker:
```powershell
docker compose up -d postgres
$env:DATABASE_URL="postgresql://pulsepath:pulsepath@localhost:5432/pulsepath"
python -m leadgen.run_pipeline init-db
```

## 5. n8n — importar workflows

1. Settings → Import → `n8n/outbound_ingest.json`
2. (envío ya NO en n8n — lo hace `outbound_email/sender.py`)
3. `n8n/outbound_tracking.json`
4. Credenciales:
   - **Postgres** → `DATABASE_URL`
   - **SMTP** → Zoho por buzón
   - **Telegram** → mismo bot que outbound forms

Copiar URLs de webhook a `leadgen/.env`:
```
N8N_WEBHOOK_INGEST=https://TU-N8N/webhook/outbound-ingest
N8N_WEBHOOK_TRACK=https://TU-N8N/webhook/outbound-track
```

## 6. Warm-up (4-6 semanas antes de cold)

| Semana | Emails/día por buzón | Acción |
|--------|---------------------|--------|
| 1-2 | 5-10 | Emails reales a contactos conocidos |
| 3-4 | 15-20 | Subir gradualmente |
| 5-6 | 25-30 | Empezar cold residencias |
| 7+ | 35 max | Crucero si bounce <3% |

Actualizar `mailboxes.daily_limit` en Postgres al subir.

## 7. Coste mensual real

| Item | Coste |
|------|-------|
| 5 dominios año 1 | ~10 EUR total (~0.83/mes) |
| 5 buzones Zoho (1/dominio) | ~5 EUR/mes |
| IA (z.ai incluido / Haiku ~5-15) | 0-15 EUR/mes |
| n8n + VPS | 0 (ya tienes) |
| **Total** | **~6-21 EUR/mes** arranque |

## 8. Validación manual paralela (obligatorio)

Antes del primer envío automático: **10-15 emails manuales** a residencias.
Ver [Maquina de outbound.md](Obsidian) — ASK = llamada 15 min, nunca "visita la web".
