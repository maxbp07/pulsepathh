# Investigación — licencias, ciencia, ICP, precios

## 1. Licencias de instrumentos

| Instrumento | Uso comercial | Estado | Acción |
|-------------|---------------|--------|--------|
| PVT-BA (Basner 2022) | Paradigma abierto | OK | Pedir tabla LR Fig.1 a Basner |
| KSS (Karolinska) | Libre | OK | — |
| DASS-21 (estrés, 7 ítems) | Libre con atribución | **Verificar** | Contrastar texto exacto en lovibonddass.com |
| SIB (single-item burnout) | Libre | OK | — |
| PSS-4 | Requiere permiso CMU | DESCARTADO | Ya sustituido por DASS-21 |

**Acción:** cuando la web de Lovibond resetee cuota (~20 jul), verificar cláusula comercial DASS-21.

## 2. Ciencia — carta a Basner (borrador)

```
Subject: PVT-BA likelihood ratio table (Fig.1) for replication

Dear Dr. Basner,

I'm Max Borra Palau, founder of PulsePath (employee fatigue monitoring using PVT-BA). We implemented your adaptive algorithm from Sleep Advances 2022 (PMC10104405) in a mobile PWA.

For accurate replication, could you share the exact likelihood ratio table from Figure 1? We currently use the ranges from the text.

We'd also appreciate feedback on our implementation parameters (355ms lapse threshold, touch input lag correction).

Thank you,
Max Borra Palau
max@getpulsepath.com
```

## 3. ICP — comparativa (decisión pendiente)

| Criterio | Call centers/BPO | Grupos residencias |
|----------|------------------|-------------------|
| Tamaño típico | 100-2000+ | 20-500 (cadenas 100+) |
| Dolor fatiga/burnout | Alto (turnos, rotación) | Alto (turnos noche) |
| Acceso a RRHH | Medio (LinkedIn) | Medio (director centro) |
| Ciclo venta | 2-4 meses | 1-3 meses |
| Fit PVT | Alto | Alto |
| Decisión | **Candidato #1** si leads accesibles | **Candidato #2** si red ESIC salud |

**Acción:** construir lista 100 leads del segmento elegido (Apollo/LinkedIn/manual).

## 4. Benchmark de precios B2B wellbeing España

| Competidor | Precio orientativo | Qué venden |
|------------|-------------------|------------|
| Wellhub (Gympass) corporate | 15-30 €/empleado/mes | Perks/gimnasios |
| Headspace for Work | 8-12 €/empleado/mes | Mindfulness |
| Pulsar WorkFit (PVT) | Enterprise (no público) | Fitness for work |
| ifeel / therapy platforms | 5-15 €/empleado/mes | Terapia online |
| **PulsePath (ancla)** | **15 €/empleado/mes** | Medición objetiva fatiga/burnout |

**Defensa del precio:** coste de una baja laboral >> 15 €/mes. Ancla alta, negociar hacia 8-10 € en piloto.

## 5. Infra pre-piloto
- [ ] Backup Postgres antes de datos reales
- [ ] Rotar contraseña root VPS (expuesta en repo público)
- [ ] HTTPS en app.getpulsepath.com
