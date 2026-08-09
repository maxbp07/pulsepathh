# Recordatorio WhatsApp (respaldo manual) — piloto 100 amigos

PulsePath **no** almacena teléfonos. El vínculo código ↔ WhatsApp vive solo en una hoja externa cifrada.

## Hoja externa (Google Sheet / Excel cifrado)

Columnas mínimas:

| slot_label | plain_code | whatsapp_name | sent_at | notes |
|------------|------------|---------------|---------|-------|
| PP-001 | PP-2026-001 | María | 2026-07-20 | confirmó D0 |

- `plain_code` sale de `npm run seed:study` o `provision-codes.js` (una sola vez).
- Nunca subas esta hoja al servidor PulsePath.

## Cuándo escribir

1. **Día 0** — bienvenida + enlace app + código.
2. **Si 0 check-ins en 48 h** — recordatorio amable.
3. **Día 6** — aviso evaluación D7 mañana.
4. **Día 13** — aviso evaluación D14 mañana.

## Plantilla mensaje (copiar/pegar)

```
Hola! Soy Max del piloto PulsePath (estudio bienestar, 2 min/día).
Tu código: PP-2026-XXX
App: https://app.getpulsepath.com/
Cualquier duda me escribes por aquí. Gracias!
```

## Cruce con adherencia ops

1. Dashboard → **Adherencia estudio** → export mental de slots sin sync.
2. Cruza `slot_label` con la hoja WhatsApp.
3. Solo contacta quien falte; nunca menciones scores.
