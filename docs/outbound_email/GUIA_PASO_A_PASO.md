# Guía paso a paso — arrancar la máquina de cold email

Orden exacto. Lo que es "tuyo" está marcado con 👉.

## Fase 0 — dominios comprados ✅ (siguientes 3 pasos manuales)

5 dominios ya comprados (28 jun 2026). 1 buzón por dominio para arrancar:

| Dominio | Tier | Segmentos | Buzón a crear |
|---------|------|-----------|---------------|
| `trypulsepath.com` | formal | vcs, fellowships, innovacion | `max@trypulsepath.com` |
| `joinpulsepath.co` | formal | residencias (RRHH) | `hola@joinpulsepath.co` |
| `trypulsepath.co` | formal | deportistas, call centers | `hola@trypulsepath.co` |
| `trypulsepath.online` | volume | call centers, residencias secundario | `hola@trypulsepath.online` |
| `joinpulsepath.online` | volume | backup / rotación | `hola@joinpulsepath.online` |

- [ ] **(A) Añadir los 5 dominios en Zoho Mail** (plan Mail Lite, ~1€/buzón/mes) y crear
  **1 buzón por dominio** con los nombres exactos de la tabla. Por cada buzón:
  Settings → Security → App Passwords → generar (la pegas en `n8n/seed_mailboxes.sql`, los `CHANGEME_*`).
- [ ] **(B) Configurar SPF/DKIM/DMARC en el registrador** de cada uno de los 5 dominios (ver Bloque A.3 abajo).
- [ ] **(C) Empezar warm-up**: 4-6 semanas enviando pocos emails reales a mano antes de cualquier cold
  (warm-up arranca en `warmup_day=0`; ver Bloque D).

## Bloque A — Comprar y configurar (1 vez, ~2h)

1. ✅ **5 dominios comprados** (ver tabla de Fase 0 arriba): 3 formal (`.com`/`.co`) + 2 volume (`.online`).
2. 👉 **Zoho Mail** (zoho.com/mail) → plan Mail Lite (~1 EUR/buzón/mes).
   - Añadir los **5 dominios**.
   - Crear **1 buzón por dominio** (5 buzones total) con los nombres exactos de la tabla.
   - Por cada buzón: Settings → Security → App Passwords → generar una (la usarás en n8n).
3. 👉 **DNS de cada dominio** (panel del registrador, los 5):
   - SPF: `TXT @` → `v=spf1 include:zoho.eu ~all`
   - DKIM: lo da Zoho (Dominios → DKIM) → pegar el registro.
   - DMARC: `TXT _dmarc` → `v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com`

## Bloque B — Base de datos + n8n (yo ya dejé los archivos)

4. En el **VPS** (o local con Docker):
   ```bash
   export DATABASE_URL=postgresql://pulsepath:CLAVE@localhost:5432/pulsepath
   bash n8n/setup_vps.sh
   ```
   Antes edita `n8n/seed_mailboxes.sql`: sustituye los `CHANGEME_*` por las app passwords reales
   de los 5 buzones Zoho (1 por dominio).
5. 👉 **Importar los 3 workflows** en n8n (Settings → Import from File):
   - `n8n/outbound_ingest.json`
   - (el envío ya NO usa n8n — lo hace `outbound_email/sender.py` vía cron)
   - `n8n/outbound_tracking.json`
6. 👉 **Crear credenciales en n8n** (Credentials → New):
   - **Postgres** (nombre "PulsePath Postgres"): host, db, user, pass del VPS.
   - **SMTP** (nombre "Zoho SMTP EU"): host `smtp.zoho.eu`, port `587`, SSL/TLS STARTTLS, user = buzón, pass = app password.
   - **Telegram** (nombre "Telegram Bot"): token del bot (el de MatForge).
   Luego abre cada workflow y en los nodos que tengan triángulo rojo, selecciona la credencial.
7. 👉 En el workflow **Ingest**, click en el nodo Webhook → copia la "Production URL".
   Igual en **Tracking**. Pega ambas en `leadgen/.env` (N8N_WEBHOOK_*).

## Bloque C — Pipeline en tu PC

8. ```bash
   pip install -r leadgen/requirements.txt
   ```
9. 👉 Edita `leadgen/.env` y rellena los `TODO_PEGAR`:
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `TELEGRAM_BOT_TOKEN`
   - `PROXY_URL` (tus proxies residenciales)
   - `N8N_WEBHOOK_*` (del paso 7)
   - `OUTBOUND_MAILBOXES` (tus buzones Zoho)
10. Inicializar DB y probar:
    ```bash
    python -m leadgen.run_pipeline init-db
    python -m leadgen.run_gosom --segment pilotos_residencias
    python -m leadgen.run_pipeline enrich --limit 100
    python -m leadgen.run_pipeline personalize --segment pilotos_residencias --limit 20
    ```
    Revisa los borradores en `outbound_email/texts/*.json` ANTES de enviar.

## Bloque D — Warm-up y arranque (NO saltar)

11. 👉 4-6 semanas de warm-up: enviar pocos emails reales a mano desde los buzones.
    Subir `mailboxes.daily_limit` poco a poco (20 → 35).
12. 👉 En paralelo: 10-15 cold emails MANUALES a residencias para validar el mensaje.
13. Cuando el dominio esté caliente: el envío es automático (cron cada 15 min → `outbound_email/sender.py`)
    y el loop:
    ```bash
    python -m leadgen.run_pipeline push --segment pilotos_residencias --limit 20
    ```
14. Programar `scripts/outbound_email_loop.ps1` en el Task Scheduler (cada 6-12h).

## Bloque E — Medir y escalar

15. ```bash
    python -m outbound_email.run_pilot stats --segment pilotos_residencias
    python -m outbound_email.run_pilot scale-check
    ```
    Si >3% respuestas positivas y >200 enviados → activar más segmentos:
    ```bash
    python -m outbound_email.run_pilot enable-segment vcs
    ```

## Segmentos activos y método de captación por grupo

Cada segmento es un JSON en `leadgen/segments/`. Campo `enabled` controla si entra en el loop.
Cada uno lleva un campo `positioning`: la frase que define **en qué idioma hablarle a ESE
público** (se inyecta en el prompt de IA). Adaptamos el ÁNGULO, nunca inventamos hechos.

| Segmento | enabled | Fuente de leads | Cómo se consiguen los emails |
|----------|---------|-----------------|------------------------------|
| `pilotos_residencias` | ✅ | gosom Google Maps | gosom extrae email de la web (`-email`) + enrich (scrape web + patrón dominio) |
| `pilotos_callcenters` | ✅ | gosom Google Maps | igual que residencias; queries call/contact center/BPO en 7 ciudades |
| `deportistas` (NUEVO) | ✅ | gosom Google Maps | queries: CAR, clubes, academias, crossfit, fisio deportiva, tecnificación |
| `innovacion` | ✅ | Crawl4AI sobre `seed_urls` | crawl de páginas de innovación corp. + enrich por patrón de dominio (RRHH/wellbeing) |
| `vcs` | ✅ | Crawl4AI sobre `seed_urls` | crawl de páginas team/contact de fondos HR/health-tech → nombre+cargo; email por patrón si no aparece |
| `fellowships` | ✅ | ScrapeGraphAI search **o** Crawl4AI sobre `seed_urls` | search discovery (necesita `SGAI_API_KEY`) **o** crawl directo de programas curados (`known_programs`) |

### Comandos por fuente
```bash
# gosom (residencias, callcenters, deportistas) — necesita binario gosom (+ proxies para volumen)
python -m leadgen.run_gosom --segment deportistas
python -m leadgen.run_gosom --segment pilotos_callcenters

# Crawl4AI (innovacion, vcs, y fellowships vía seed_urls) — mejor con ANTHROPIC_API_KEY (si no, regex)
python -m leadgen.crawl4ai_extract --segment vcs --limit 10
python -m leadgen.crawl4ai_extract --segment innovacion --limit 10
python -m leadgen.crawl4ai_extract --segment fellowships --limit 10   # crawlea known_programs

# ScrapeGraphAI (fellowships discovery por búsqueda) — necesita SGAI_API_KEY
python -m leadgen.discover_opportunities --segment fellowships
```

### Blockers honestos (lo que NO funciona sin acción de Max)
- **gosom**: para volumen real necesita **proxies residenciales** (`PROXY_URL`/`PROXY_LIST`) o
  Google capa el scraping. El binario se autodescarga al primer uso.
- **fellowships (discovery por búsqueda)**: necesita `SGAI_API_KEY` (free tier ScrapeGraphAI).
  Sin él: usar el crawl de `known_programs` (URLs ya curadas en el JSON).
- **vcs / innovacion**: muchos fondos/corporaciones **no publican emails** (solo formulario).
  Crawl4AI saca nombre+cargo+tesis; el email se intenta por patrón de dominio (enrich). La calidad
  del email sube con `ANTHROPIC_API_KEY` (extracción) y bajando a páginas /team o /equipo concretas.
- **Edición manual recomendada**: revisa `outbound_email/texts/*.json` antes de enviar (sobre todo
  vcs/fellowships, donde el destinatario es una persona concreta).

## Personalización — elige modo (PERSONALIZE_PROVIDER en leadgen/.env)

| Modo | Coste | Automatizable | Cuándo |
|------|-------|---------------|--------|
| `zai` ⭐ | Incluido en tu plan z.ai | Sí | **En uso — GLM-5.2, calidad top** |
| `template` | 0€ | Sí | Empezar rápido, sin IA |
| `composer_batch` | 0€ | No (manual) | Usar Composer de Cursor a mano |
| `gemini` | 0€ (free tier) | Sí | Alternativa gratis |
| `haiku` | ~3-5€/mes | Sí | Alternativa de pago |

### Modo zai (tu suscripción — en uso)
1. 👉 En `leadgen/.env` pega `ZAI_API_KEY` (z.ai → API Keys).
2. `ZAI_BASE_URL` ya apunta al endpoint de la suscripción (Coding Plan). Si tu key
   es de API de pago normal, cámbialo a `https://api.z.ai/api/paas/v4`.
3. Listo: `python -m leadgen.run_pipeline personalize --segment pilotos_residencias --limit 30`

### Modo composer_batch (usar Composer gratis)
```bash
python -m leadgen.run_pipeline composer-export --segment pilotos_residencias --limit 30
# Abre el .md generado en Cursor → pide a Composer "rellena este lote" → guarda
python -m leadgen.run_pipeline composer-import outbound_email/composer_batches/XXX.md
```
⚠️ NO automatices Composer en loop: viola el ToS de Cursor y arriesga tu cuenta.

### Coste IA (referencia, solo modos gemini/haiku)
- Follow-ups (días 3/7/12) NO usan IA → coste 0.
- Gemini Flash: free tier (gratis hasta el límite diario).
- Haiku: ~$0.001/lead → 100 leads/día ≈ **~$3/mes**, 300/día ≈ **~$9/mes**.
