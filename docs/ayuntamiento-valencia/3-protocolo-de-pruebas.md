# Protocolo de pruebas — PulsePath
## Propuesta para el Sandbox Urbano de València
### Borrador para sede electrónica (art. 13.4.C de la Ordenanza)

> Documento director de la actuación. Modelo orientado a los contenidos mínimos exigidos por el **artículo 13.4.C** de la Ordenanza Municipal reguladora del Sandbox Urbano de Valencia y a las recomendaciones del *Participant Handbook* (apartado 2.2 — “How do I write my testing protocol proposal?”).  
> El Manual del participante indica que en la sede electrónica municipal se facilita un **modelo o guía** descargable para redactar el protocolo; este borrador se ajusta a ese esquema normativo y podrá volcarse al formulario oficial cuando se formalice el trámite electrónico.

**Versión:** borrador 0.1  
**Fecha:** agosto 2026  
**Promotor / entidad promotora:** Max Borra Palau (persona física)  
**Interlocución:** Max Borra Palau — max@getpulsepath.com  
**Proyecto:** PulsePath — medición agregada de fatiga y bienestar laboral en personal municipal (dos fases; ventana Fallas)

---

## 1. Datos generales del proyecto de innovación

### 1.1. Objeto

Realizar un piloto de investigación e innovación, sin fines lucrativos durante la ejecución (art. 10.2), para validar PulsePath —PWA de bienestar laboral— en personal municipal voluntario del Ayuntamiento de València / su Sector Público Local, con diseño experimental en dos fases y comparación intrasujeto entre carga ordinaria y pico de las Fallas.

### 1.2. Descripción técnica resumida

PulsePath combina:

- prueba de vigilancia psicomotora breve (PVT / PVT-BA);
- escala KSS;
- cuestionarios validados DASS-21, GAD-7 y Copenhagen Burnout Inventory en oleadas.

Sin cámaras, sin biometría, sin datos pasivos, sin geolocalización. Feedback individual solo para la persona participante. Cuadro de mando organizacional únicamente con agregados **K≥5**. No evalúa desempeño ni aptitud; no envía alertas individuales a mandos.

### 1.3. Madurez tecnológica

TRL 5 (tecnología validada en entorno relevante): sistema construido e integrado, aún no validado operativamente con plantilla laboral real. Antes de activar a ninguna persona trabajadora municipal se ejecutará un preflight con voluntariado adulto externo (objetivo: 30 personas, 14 días) y se entregarán sus resultados al Ayuntamiento. Demostración disponible bajo petición. Objetivo del Sandbox: TRL 7 en entorno operacional municipal.

### 1.4. Interés público (arts. 4 y 10)

Impacto positivo potencial en salud y cuidado de las personas trabajadoras, digitalización y modernización del sector público. Retorno a la ciudad conforme al **artículo 22** (sección 8 de este protocolo).

### 1.5. Precedente de encaje

**VITALWISE** (Instituto de Biomecánica de València), proyecto ejecutado en el Sandbox Urbano de València para detección de fatiga y estrés (constantes vitales de conductores). Ensayos: **1 de abril – 31 de julio de 2025** (fuente IBV).[^vitalwise-ibv] La comunicación institucional del **6 de julio de 2026** es la noticia posterior sobre el piloto ya realizado, no la fecha de admisión ni de ensayos.[^vitalwise-noticia] Ficha: [Valencia Innovation Capital — VITALWISE](https://valenciainnovationcapital.com/proyecto/vitalwise/). Sirve de referencia de que la salud digital orientada a fatiga encaja en el instrumento.

[^vitalwise-ibv]: https://www.ibv.org/actualidad/ibv-presenta-su-tecnologia-vitalwise-en-el-sandbox-urbano-de-valencia/
[^vitalwise-noticia]: https://www.europapress.es/comunitat-valenciana/innova-00214/noticia-valencia-prueba-sandbox-urbano-sistema-registrar-constantes-vitales-conductores-20260706184246.html ; https://valenciainnovationcapital.com/valencia-prueba-en-el-sandbox-urbano-un-sistema-para-registrar-las-constantes-vitales-de-los-conductores/

### 1.6. Procedimiento simplificado

Se solicita valorar el procedimiento simplificado del **artículo 14.6** (madurez tecnológica, similitud con proyecto aprobado —VITALWISE—, ausencia de complejidad de obra/ocupación).

---

## 2. Plan de pruebas del proyecto de innovación

### 2.1. Diseño experimental

| Elemento | Definición |
|----------|------------|
| Diseño | Dos fases secuenciales; comparación **intrasujeto** (prioridad) + ampliación de cohorte en fase 2 |
| Fase 1 | Carga ordinaria (invierno): **30** personas voluntarias |
| Fase 2 | Ventana Fallas (marzo): ampliación a **50** personas; máxima retención de la cohorte de fase 1 |
| Unidad de análisis primaria | Agregados por segmento con K≥5; contraste fase 1 vs fase 2 en participantes comunes |
| Controles | No hay grupo placebo; el control es la línea base del mismo sujeto |

### 2.2. Participantes

- Personal laboral o funcionario municipal / Sector Público Local, adulto, voluntario.
- Criterios de inclusión: consentimiento informado; acceso a dispositivo compatible; pertenencia a servicios acordados con la persona facilitadora.
- Criterios de exclusión: negativa al consentimiento; imposibilidad técnica no solventable; cualquier indicación de Salud Laboral que desaconseje la participación.
- Reclutamiento: canales internos municipales (sin publicidad comercial).
- Compensación: ninguna obligatoria; en su caso, reconocimiento simbólico no retributivo acordado con el Ayuntamiento.

### 2.3. Actividades por fase

**Preparación (2–4 semanas tras Protocolo firmado y seguros/garantías del art. 15.3)**

- Designación de persona facilitadora del recurso.
- Selección de servicios / centros.
- Materiales de consentimiento y sesión informativa.
- Alta técnica, códigos pseudónimos, prueba de conectividad.
- Gate: no se activa ningún participante municipal sin preflight externo completado.

**Fase 1 — carga ordinaria**

- Check-in breve por jornada laboral pactada (PVT + KSS).
- Oleada basal de DASS-21, GAD-7 y CBI.
- Seguimiento semanal de adherencia; informe agregado interno a las 2 semanas (gate de continuidad).
- Sin intervención clínica; recomendaciones generales de bienestar solo a la persona participante.

**Fase 2 — ventana Fallas**

- Ampliación a 50 participantes en servicios más expuestos al pico.
- Misma batería de check-in; oleada de cuestionarios en torno al pico.
- Registro del calendario urbano de Fallas como covariable temporal (fechas de máxima afluencia / actos relevantes acordados con la facilitación).

**Cierre**

- Oleada final de cuestionarios (si procede).
- Encuesta de utilidad percibida.
- Informe final al ente instrumental de innovación en el plazo de **un mes** (art. 19).
- Ejecución del retorno (sección 8) y plan de desinstalación / borrado.

### 2.4. Calendario orientativo

Condicionado a la fecha de resolución (plazo máximo de resolución: 3 meses, art. 15.2) y al alineamiento con invierno / Fallas:

1. Autorización → 15 días hábiles para seguros/garantías y ajustes (art. 15.3).
2. Inicio de pruebas: dentro del mes siguiente (art. 17), o ampliación justificada para coincidir con la fase 1 invernal.
3. Fase 1: ≈ 6–8 semanas en periodo de carga ordinaria.
4. Fase 2: ventana Fallas (marzo del año de ejecución; horizonte típico 2027).
5. Informe final: ≤ 1 mes tras el fin de pruebas (art. 19).

Duración total del Protocolo: inferior al máximo legal de cinco años (art. 7); estimación de medición activa ≈ 4–5 meses.

### 2.5. Indicadores y criterios de éxito

Véase Cuestionario Inicial (documento 2). Resumen: adherencia y abandono según umbrales fijados tras el preflight previo, n fase 1 ≥30, n fase 2 ≥50, solapamiento intrasujeto ≥70 %, 0 incidentes de reidentificación, utilidad percibida ≥3,5/5, entrega del informe art. 19.

### 2.6. Seguimiento municipal (art. 18)

El promotor facilitará al personal técnico designado por Valencia Innovation Capital / Ayuntamiento:

- acceso a la demo y al cuadro de mando agregado (sin datos personales);
- reuniones de seguimiento mensuales (o la periodicidad que fije el Ayuntamiento);
- notificación inmediata de incidentes de seguridad o de privacidad;
- colaboración con la persona facilitadora del recurso.

---

## 3. Recurso Urbano de Sandbox solicitado

### 3.1. Identificación

**Recurso no incluido como unidad en la Relación vigente** → solicitud de habilitación conforme al **artículo 6.1**, con tres componentes:

| Componente | Tipología (art. 2.c) | Uso en la prueba |
|------------|---------------------|------------------|
| Centros de trabajo municipales de los servicios participantes | Espacio | Contexto laboral real del personal voluntario |
| Canales internos de comunicación | Infraestructura organizativa / medio habilitante | Convocatoria voluntaria e información del estudio |
| Ventana temporal de las Fallas | Evento | Pico de carga previsible y acotado |

### 3.2. Argumento de encaje (sin forzar el concepto)

El Sandbox está pensado para recursos urbanos en sentido amplio. PulsePath no “urbaniza” una plaza ni instrumenta una calle: necesita **el lugar de trabajo municipal** y **el tiempo urbano de las Fallas** porque ahí se produce el fenómeno a medir (fatiga laboral bajo carga ordinaria vs pico). El artículo 2.c incluye expresamente los **eventos**. El artículo 6 permite estudiar y aceptar recursos no listados. El artículo 4 ampara salud, digitalización y modernización del sector público. El precedente **VITALWISE** muestra que un demostrador de salud digital sobre fatiga/estrés ya ha operado en este Sandbox aunque su lógica no sea la de una instalación permanente en el espacio público.

Condiciones del art. 5.2: no se pone en riesgo la salud por instalación física; no hay incremento ambiental; no hay perjuicio comercial; no se afecta patrimonio histórico-artístico; se requiere conformidad de la delegación adscrita y persona facilitadora.

### 3.3. Reversibilidad

Total. Sin obra, sin mobiliario, sin toma de corriente adicional.

---

## 4. Evaluación de riesgos y medidas de prevención / protección

| Riesgo | Probabilidad | Impacto | Medida |
|--------|--------------|---------|--------|
| Interpretación errónea como evaluación de desempeño | Media | Alto | Comunicación institucional clara; cláusulas en consentimiento; ausencia de alertas a mandos |
| Baja adherencia | Media | Medio | UX breve; gates; soporte del promotor |
| Fatiga adicional por el propio check-in | Baja | Bajo | Duración corta; voluntariedad; derecho a abandonar |
| Incidente de datos personales | Baja | Alto | Minimización, cifrado, K≥5, sin cesión al Ayuntamiento (art. 25.4), borrado final (art. 25.3) |
| Daño a bienes públicos | Nula | — | Sin intervención física |
| Daño a terceros por la actividad | Muy baja | Medio | Seguro RC post-aprobación (arts. 16.1 y 15.3) |

**Declaración sobre seguros y garantías**

1. El promotor **se compromete** a disponer de un **seguro de responsabilidad civil** que cubra daños a miembros de la entidad promotora y a terceros durante las pruebas (**art. 16.1**), aportando la póliza en el plazo de **quince días hábiles** desde la notificación de la aprobación (**art. 15.3**). **No se aporta en la solicitud inicial.**
2. Respecto al régimen de garantías por daños a bienes y derechos públicos (**art. 16.2**), se solicita que, “atendiendo a la tipología de la actividad” (actividad software sin ocupación ni manipulación de infraestructura), la garantía se fije en cuantía **mínima o se dispense**, al ser el riesgo de daño a bienes públicos nulo.

---

## 5. Análisis normativo

### 5.1. Marco específico del Sandbox

Ordenanza Municipal reguladora del Sandbox Urbano de Valencia (arts. aplicables: 2, 4, 5, 6, 7, 8, 10, 12, 13, 14.6, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26).

### 5.2. Normativa potencialmente afectada / de aplicación

| Ámbito | Norma | Observación |
|--------|-------|-------------|
| Protección de datos | RGPD (UE) 2016/679; LOPDGDD 3/2018 | Promotor = responsable del tratamiento (art. 25 Ordenanza) |
| Empleo público / prevención | Marco de PRL y políticas internas de bienestar | La prueba **no sustituye** la evaluación de riesgos psicosociales reglamentaria |
| Productos sanitarios | — | PulsePath **no** se presenta como producto sanitario ni como dispositivo de diagnóstico; es herramienta de bienestar laboral no clínico |
| Ocupación de dominio público | Ordenanza de ocupación del DP municipal | **No aplica** ocupación; el título habilitante, en su caso, es el del Sandbox (art. 11.2) |
| Propiedad intelectual | TRLPI / normativa de PI | Sección 7 |

### 5.3. Excepciones normativas

No se solicita excepción de normativa estatal o autonómica. No hay ocupación de vía pública ni obra.

---

## 6. Cláusulas de confidencialidad (art. 24)

6.1. Tendrán carácter **confidencial**, durante y después de las pruebas, salvo autorización escrita del promotor o deber legal:

- arquitectura detallada, código fuente y secretos comerciales de PulsePath;
- parámetros internos del motor de riesgo / heurísticas no publicados;
- datos personales de participantes (además del régimen del art. 25);
- cualquier información marcada como confidencial en entregables.

6.2. No serán confidenciales, a efectos de rendición de cuentas ciudadana (art. 21) y de comunicación social (art. 26), los **resultados agregados y anonimizados** y la descripción general del proyecto, sin perjuicio del deber de secreto del personal público (art. 24.2–24.3).

6.3. El derecho de acceso a información pública podrá limitarse conforme al art. 14.1.j) de la Ley 19/2013, en los términos del art. 24.4 de la Ordenanza.

6.4. El incumplimiento de las obligaciones del art. 22 podrá dejar sin efecto cláusulas de confidencialidad en los términos del art. 22.7, si así se acepta en la versión firmada del Protocolo.

---

## 7. Derechos de Propiedad Intelectual e Industrial (art. 22)

7.1. La titularidad de la propiedad intelectual e industrial preexistente y de la generada por el promotor sobre PulsePath (software, marcas, documentación, know-how) permanece en **Max Borra Palau**, sin cesión de titularidad al Ayuntamiento por el solo hecho de participar en el Sandbox.

7.2. El Ayuntamiento podrá utilizar, para fines no comerciales de evaluación y transferencia de conocimiento público, los entregables de retorno descritos en la sección 8, con licencia de uso limitada, no exclusiva y gratuita, sin derechos de sublicencia comercial.

7.3. **Exención de participación en beneficios comerciales futuros:** al ser el promotor una **persona física**, resulta de aplicación la exención del **artículo 22.3.a)** respecto al retorno económico sobre comercialización futura. Ello no exime del retorno de **conocimiento** del art. 22.1.

7.4. Si en el futuro el resultado se explotara a través de una persona jurídica, se estará a lo que disponga el Protocolo vigente y el art. 22 en ese momento.

---

## 8. Propuesta de retorno a la Administración (art. 22.1)

Conforme al principio de proporcionalidad (recursos públicos puestos a disposición, periodo habilitado e impacto potencial), se propone el siguiente paquete de retorno —**sin coste** para el Ayuntamiento—:

1. **Acciones divulgativas de la experiencia obtenida**
   - Participación en una sesión pública o interna de Valencia Innovation Capital / Sandbox.
   - Autorización para incluir el caso (agregado) en la Memoria bienal (art. 21), respetando confidencialidad.
   - Uso de la identidad de marca del Sandbox y de la imagen corporativa municipal en los elementos de difusión del piloto (art. 26.2).

2. **Dictamen / informe de aplicabilidad** a servicios públicos
   - Informe final (art. 19) ampliado con recomendaciones prácticas para prevención de riesgos laborales / bienestar: qué funcionó, límites, lectura responsable de agregados K≥5, lecciones del contraste Fallas vs carga ordinaria.
   - Entrega en formato reutilizable (PDF + resumen ejecutivo).

3. **Entrega / acceso gratuito de ejemplares del prototipo testeado**
   - Acceso temporal (p. ej. 90 días tras el cierre) a una instancia demo operativa del cuadro de mando agregado y de la app, sin coste, para personal designado por el Ayuntamiento.
   - Durante el piloto, demostración disponible bajo petición (sin URL pública desplegada en el momento de la solicitud).

Esta propuesta podrá ser validada o modificada por la Comisión de Valoración (art. 14.4.k) en el marco del art. 22.

---

## 9. Cláusulas de protección de datos personales (art. 25)

9.1. El promotor actúa como **responsable del tratamiento** de los datos personales necesarios para las pruebas y cumple RGPD y LOPDGDD (art. 25.1).

9.2. **Base jurídica:** consentimiento informado, libre, específico, informado e inequívoco de cada persona participante; revocable en cualquier momento sin perjuicio laboral.

9.3. **Finalidad:** ejecución del piloto de innovación descrito; generación de feedback individual a la propia persona; generación de estadísticas agregadas K≥5; elaboración del informe final anonimizado.

9.4. **Minimización:** no se recogen nombre ni correo como identificador de estudio (código pseudónimo); no cámaras; no biometría; no geolocalización; no datos pasivos de sensores.

9.5. **Destinatarios:** no se cederán datos personales al Ayuntamiento ni a su Sector Público Local, ni a la inversa (**art. 25.4**). Encargados de tratamiento (hosting, etc.) solo con contrato art. 28 RGPD y ubicación / garantías adecuadas.

9.6. **Seguridad:** medidas técnicas y organizativas apropiadas (art. 25.2): cifrado en tránsito, control de acceso, registro de consentimientos versionados, pruebas del derecho de supresión.

9.7. **Conservación y destrucción:** al finalizar las pruebas, destrucción o anonimización irreversible de datos personales, salvo obligación legal de conservación (art. 25.3).

9.8. **Derechos:** el promotor habilitará canal para ejercer acceso, rectificación, supresión, limitación, oposición y portabilidad, según proceda.

9.9. **Evaluación de impacto:** si la naturaleza del tratamiento lo exige, el promotor realizará EIPD antes del inicio con participantes municipales.

---

## 10. Régimen de responsabilidad (art. 23) y salida (art. 20)

10.1. El Ayuntamiento no será responsable de daños durante las pruebas salvo causa imputable en los términos de la legislación de responsabilidad patrimonial (art. 23.1).

10.2. El promotor responderá frente a participantes por daños imputables a su actividad, conforme al Protocolo y al seguro del art. 16.1.

10.3. Interrupción / finalización: conforme al art. 20 (incumplimiento, riesgos, o decisión justificada del promotor comunicada al Ayuntamiento).

10.4. A solicitud, el Ayuntamiento podrá expedir acreditación de participación (art. 20.5), sin que ello valide científicamente los resultados.

---

## 11. Comunicación social (art. 26)

El promotor incluirá la imagen corporativa del Ayuntamiento y la identidad de marca del Sandbox Urbano en elementos de difusión del piloto, y colaborará con el Kit de Recursos Comunicativos cuando esté disponible. Se podrá concertar una demostración para materiales informativos del Sandbox, previo acuerdo.

---

## 12. Adhesión a alianzas (art. 9)

Una vez obtenida la condición de entidad promotora, el firmante formalizará la adhesión a las alianzas estratégicas de colaboración público-privada en innovación vigentes, mediante los instrumentos que el Ayuntamiento ponga a disposición.

---

## 13. Declaraciones del promotor

El abajo firmante declara:

1. Hallarse al corriente de obligaciones tributarias y de Seguridad Social, y de la normativa de prevención de riesgos laborales (declaración responsable, art. 13.4.B) — a aportar en el trámite electrónico.
2. Someterse al régimen de garantías y responsabilidad de la Ordenanza (art. 13.4.D).
3. Que las pruebas no tendrán fin lucrativo durante la ejecución del Protocolo (art. 10.2).
4. Que los gastos corren a su cargo.
5. El compromiso de aportar el seguro del art. 16.1 en el plazo del art. 15.3 si hay autorización.
6. La veracidad de la información de este Protocolo.

**Firma / identidad**

Max Borra Palau  
Persona física promotora — PulsePath  
max@getpulsepath.com  
Fecha: _______________
