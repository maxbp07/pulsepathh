# Hoja de registro de códigos — plantilla

**Uso:** Excel / Google Sheet **cifrado** o con acceso restringido.
**Nunca** subir esta hoja al servidor PulsePath ni al repositorio.

Códigos plaintext salen una sola vez de `npm run provision:codes` / `seed:study`.

## Columnas

| slot_label | plain_code | whatsapp_name | phone_hint | invited_at | activated_noted | last_nudge_at | notes |
|------------|------------|---------------|------------|------------|-----------------|---------------|-------|
| PP-001 | PP-2026-001 | Ana | (solo local) | 2026-08-10 | sí | | confirmó D0 |
| PP-002 | PP-2026-002 | | | | | | |

## Instrucciones

1. Provisionar 30 códigos `PP-2026-001` … `PP-2026-030` (o el rango acordado).
2. Pegar `plain_code` aquí **una vez**; no reenviar listados por canales inseguros.
3. Cruzar `slot_label` con el panel ops (`docs/OPS_ADHERENCE.md`) para ver quién falta.
4. No anotar scores ni respuestas de cuestionarios en esta hoja.
5. Al cerrar el preflight: archivar cifrado o destruir según política del promotor.

## Capacidad

- Objetivo preflight: **30** filas activas.
- Reservar 5–10 códigos extra por caídas / no activación.
