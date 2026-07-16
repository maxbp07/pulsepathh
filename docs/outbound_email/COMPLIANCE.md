# Capa legal + plantillas — cold email PulsePath

## Reglas integradas en código

| Regla | Implementación |
|-------|----------------|
| Solo email profesional | `leadgen/compliance.py` → `is_professional_email()` |
| Opt-out en cada email | `append_compliance()` footer automático |
| Lista supresión | `suppression_list` Postgres + `leadgen/data/suppression.csv` |
| Lista Robinson | stub `check_lista_robinson()` — ampliar con API cuando tengas acceso |
| Interés legítimo (LIA) | `default_legitimate_interest()` + `lia_log.csv` |
| No enviar a suprimidos | n8n ingest + `push.py` + `is_suppressed()` |

## Footer estándar (texto plano)

```
—
Max · Founder, PulsePath
PulsePath · https://getpulsepath.com
Finalista Red Bull Basement España 2026 · 1517 Fund
Si no es relevante, responde "baja" y no volveré a escribirte.
```

## Plantilla Email 1 — Residencias (validar a mano primero)

**Asuntos (rotar):**
1. `rotación de turnos en {empresa}`
2. `pregunta rápida — {empresa}`
3. `burnout en residencias — idea para {empresa}`

**Cuerpo:**
```
Hola {nombre},

{opener personalizado — 1 frase real sobre el centro}

En residencias el burnout de los turnos de noche dispara la rotación y las bajas. PulsePath detecta señales de fatiga de forma anónima en 2 minutos, sin vigilar a nadie.

Soy Max, finalista Red Bull Basement España 2026. Busco 2-3 centros para un piloto gratuito de 30 días.

¿Te viene bien una llamada de 15 min esta semana?

[footer compliance]
```

## Secuencia follow-up

| Día | Ángulo | CTA |
|-----|--------|-----|
| 0 | Problema turnos + piloto gratis | Llamada 15 min |
| 3 | "¿Lo viste?" + enlace Loom 2 min | Ver demo |
| 7 | Dato sector burnout | Llamada |
| 12 | Break-up corto | Cerrar hilo |

## Procesar bajas manualmente

```bash
python -c "from leadgen.compliance import add_suppression; add_suppression('email@empresa.com', 'opt_out')"
```

## DPA / SL

Antes de escalar: consultar ESIC/Eugenia si necesitas SL para firmar acuerdos de datos de salud con empresas piloto.
