# Revisión de coherencia entre el expediente y el código

**Objeto:** verificar que la propuesta técnica y las seis declaraciones responsables **no prometan lo que el sistema no hace**.
**Documentos revisados:** `proposta-pulsepath-contingut.md`, `declaracions/01` a `declaracions/06`.
**Código y evidencia contrastados:** `backend/src/lib/crypto.js`, `backend/src/lib/kanon.js`, `backend/src/lib/validators/studyValidators.js`, `backend/src/controllers/checkin.controller.js`, `employee-app/src/crypto/local.ts`, `employee-app-stitch/src/lib/studySchedule.ts`, `backend/prisma/schema.prisma`, `docs/DEPLOY_BLOCKERS.md`, `docs/RESTORE_TEST.md`, `backend/scripts/`.
**Fecha:** 9 de agosto de 2026.

---

## 0. Arquitectura real, en una frase

La aplicación de participante envía el **payload íntegro** (tiempos de reacción crudos del PVT, KSS, contexto y respuestas de cuestionario) al backend **por HTTPS**; el backend lo cifra con **AES-256-GCM** con una clave de servidor derivada de `ENCRYPTION_KEY` y lo persiste cifrado; el cuadro de mando descifra en servidor y agrega aplicando supresión K ≥ 5.

Es decir: **cifrado en tránsito y en reposo, pero no cifrado de extremo a extremo**. PulsePath, como operador de la infraestructura, tiene capacidad técnica de descifrar. Cualquier afirmación de tipo «nada sale del dispositivo», «procesamiento en el borde» o «ni siquiera nosotros podemos leerlo» sería **falsa**.

---

## 1. Veredicto general

**El expediente actual no contiene promesas falsas sobre cifrado.** Éste era el riesgo principal a descartar y está descartado. La propuesta dice «les dades viatgen xifrades i es guarden xifrades en una infraestructura acordada» y «xifrat en trànsit i en repòs», que es exactamente lo que hace el código, y afirma correctamente que el código de participante es un **seudónimo y no un anónimo**.

Los problemas encontrados eran de otra naturaleza: **había afirmaciones en pasado sobre hechos que todavía no habían ocurrido** (despliegue público y preflight). **Estado a 9 d'agost de 2026:** el expediente se ha realineado a **TRL 5**, sin cifras inventadas de preflight, sin URL pública de demo, y con el preflight como compromiso previo a la activación municipal.

---

## 2. Hallazgos

### H-1 — CRÍTICO · El sistema se declaraba «desplegado» y la demo HTTPS no lo está

- **Decía:** «El sistema està desplegat i operativa amb l'inventari de funcionalitats descrit» y «Existeix i està desplegat el conjunt següent».
- **Realidad:** `docs/DEPLOY_BLOCKERS.md` documenta que el acceso SSH al VPS falla, que `app.getpulsepath.com` **no está verificado** por HTTPS y que el gate de despliegue está en NO-GO. La URL de demo del expediente sigue siendo un marcador `{{URL_DEMO}}`.
- **Riesgo:** es una afirmación fácticamente comprobable por el evaluador en treinta segundos, abriendo la URL. Si falla, contamina la credibilidad de todo lo demás, incluida la argumentación jurídica.
- **Estado: CORREGIDO (9 ago 2026).** Sin URL pública; demostración bajo petición; capturas del entorno de pruebas como evidencia. TRL declarado en 5.

### H-2 — CRÍTICO · El preflight se narraba en pasado y no se ha ejecutado

- **Decía:** «Abans de presentar aquesta versió s'ha executat un preflight amb voluntariat extern» y «El preflight ha servit per verificar…».
- **Realidad:** todos los indicadores del preflight son marcadores sin valor (`{{N_PARTICIPANTS_PREFLIGHT}}`, `{{ADHERENCIA_DIARIA}}`, `{{TASA_ABANDONO}}`, fechas). Un preflight ejecutado tendría cifras.
- **Riesgo:** la contradicción es interna y visible en la misma página: se afirma en pasado algo cuyos resultados están en blanco. Es el tipo de incoherencia que un evaluador detecta sin esfuerzo.
- **Estado: CORREGIDO (9 ago 2026).** Eliminada la tabla de resultados con marcadores. Compromiso explícito de preflight (objetivo 30 personas / 14 días) **antes de activar personal municipal**, con entrega de resultados al Ajuntament. Sin cifras inventadas.

### H-3 — ALTO · «Copia de seguridad con restauración probada» sobreestima la evidencia

- **Decía:** «Còpia de seguretat amb restauració provada».
- **Realidad:** `docs/RESTORE_TEST.md` registra un `DRY_RUN=1` que comprueba la existencia e integridad del `.gz` y que `DATABASE_URL` está definida. El propio documento dice, en su apartado «Pendiente»: restore **real** no ejecutado. Los scripts `backup-db.sh` y `restore-db.sh` existen y el procedimiento está escrito, pero la restauración completa no se ha realizado.
- **Estado: CORREGIDO (9 ago 2026).** Formulación honest: dry-run de integridad ejecutado; restauración completa aún no probada en producción; se validará en la preparación previa.

### H-4 — ALTO · Desalineación de calendario: el documento promete semanas 4 y 8, el código impone D0/D7/D14

- **Documento:** cuestionarios DASS-21, GAD-7 y CBI «a l'inici, setmana 4 i setmana 8» de un piloto de ocho semanas.
- **Código:** `studyValidators.js` sólo acepta los timepoints `D0`, `D7` y `D14`, y `validateTimepointEligibility` exige día de estudio ≥ 0, 7 y 14 respectivamente; `employee-app-stitch/src/lib/studySchedule.ts` replica la misma malla en cliente. Un envío en la semana 4 (día 28) se etiquetaría como `D14`, y no existe forma de registrar un tercer punto en la semana 8.
- **Naturaleza:** **no es un error del documento**, sino una tarea de producto. El diseño del piloto municipal es correcto; el código está calibrado para un estudio corto de 14 días.
- **Estado: NO corregido en el documento (correcto tal como está). Pendiente en código.** Debe parametrizarse la malla de timepoints por organización antes del inicio del piloto. Se ha añadido al documento, en el cronograma de preparación previa, la verificación explícita de la configuración del calendario de evaluaciones, de modo que la tarea quede comprometida por escrito.

### H-5 — MEDIO · Existe un índice de riesgo individual que el expediente no mencionaba

- **Realidad:** el esquema persiste `riskIndexEnc`, `pvtIndexEnc`, `stroopIndexEnc`, `cbiScoreEnc` y `sleepHoursEnc` por sesión, y `kanon.js` calcula una puntuación de riesgo individual con pesos explícitos (PVT 0,40 · Stroop 0,25 · CBI 0,25 · sueño 0,10) antes de agregar.
- **Lo que el documento decía es cierto:** la organización no ve puntuaciones individuales. Pero no declaraba que existan.
- **Riesgo:** la declaración 06 se compromete a entregar la documentación técnica al Ayuntamiento. Si el índice individual aparece ahí y no en la propuesta, se percibirá como omisión deliberada.
- **Estado: CORREGIDO.** Declarado de forma proactiva: existe un índice individual, se almacena cifrado, sólo lo ve la persona y nunca se expone a la organización ni se usa con fines de evaluación.

### H-6 — MEDIO · Dos implementaciones conviven y sólo una corresponde a lo descrito

- **Realidad:** el repositorio contiene la vía de **estudio** (`employee-app-stitch` → `DailyCheckin`/`QuestionnaireResponse`, con KSS + PVT + contexto), que es la que corresponde al piloto descrito, y una vía **anterior** (`employee-app` → `Session`, que incluye además una prueba de **Stroop** con peso 0,25 en el índice de riesgo). El expediente sólo menciona KSS y PVT-BA.
- **Riesgo:** si la demo que se entregue al evaluador es la build antigua, el evaluador verá una prueba cognitiva adicional que el consentimiento y la propuesta no describen. Eso afecta directamente a la validez del consentimiento informado y a la afirmación de minimización de datos.
- **Estado: pendiente de decisión de producto.** Es imprescindible **fijar cuál es la build que se presenta** y garantizar que sea la vía de estudio. Si finalmente se incluyera Stroop en el piloto, habría que añadirlo al documento, al consentimiento y a la declaración 01.

### H-7 — MEDIO · Riesgo residual de reidentificación por consultas cruzadas

- **Realidad:** la supresión K ≥ 5 está bien implementada —cuenta **personas únicas** por `code_hash`, no sesiones, y se aplica celda a celda en los mapas de calor—, lo cual es más estricto de lo que el documento afirma. Pero existen cinco dimensiones de segmentación (departamento, turno, género, franja de edad, antigüedad) con comprobaciones **independientes**, lo que deja abierta la posibilidad teórica de inferir información sobre grupos pequeños por diferencia entre consultas que individualmente superan el umbral.
- **Estado: CORREGIDO parcialmente en el documento** (la limitación de filtros ya se mencionaba en la tabla de riesgos; se ha precisado que la supresión cuenta personas únicas y que se limitará el cruce simultáneo de dimensiones). **Recomendación técnica:** limitar el número de dimensiones combinables por consulta y registrar las consultas del panel.

### H-8 — MEDIO · El contexto recogido no se enumeraba

- **Realidad:** el validador acepta exactamente `sleepHours` (0-12), `quality` (1-5) y `coffee` (booleano). Nada más: cualquier campo adicional se rechaza.
- **Observación:** el documento decía «un context mínim», lo cual es cierto pero desaprovecha la oportunidad. Enumerar los tres campos es la mejor prueba posible de minimización de datos, y es verificable.
- **Estado: CORREGIDO.** Enumerados en la propuesta.

### H-9 — BAJO · Artefacto histórico con afirmaciones falsas que **no debe reutilizarse**

- **Realidad:** `_original_extract.txt` (extracto de una versión antigua del documento) contiene: «Edge Computing: Totes les dades de temps de reacció (biomarcadors cognitius) es processen localment al processador del smartphone de l'empleat. Al núvol només s'envia l'índex de fatiga encriptat.»
- Esa afirmación es **falsa** respecto del código actual: el payload íntegro con los tiempos de reacción crudos se envía al backend. Además, «biomarcadores cognitivos» es precisamente el vocabulario que acerca el proyecto al terreno biométrico del que la argumentación del AI Act intenta —con razón— alejarse.
- **Estado:** el texto no está en ningún documento vivo del expediente. **Advertencia:** no reutilizar ese extracto ni ese vocabulario en ningún material, incluidas presentaciones comerciales o el expediente de València.

---

### H-10 — MEDIO · Duplicado obsoleto del documento principal

- **Realidad:** `proposta-tecnica-de-la-prova.md` era una copia **byte a byte** de `proposta-pulsepath-contingut.md`. Al existir dos ficheros idénticos sin marca de cuál es la fuente, las correcciones aplicadas a uno dejaban al otro conservando las afirmaciones retiradas (sistema «desplegado», preflight en pasado, restauración «probada»).
- **Riesgo:** que alguien genere o envíe el documento a partir del fichero equivocado, reintroduciendo exactamente los problemas H-1, H-2 y H-3.
- **Estado: CORREGIDO.** Se ha sincronizado el duplicado con el contenido corregido. **Recomendación:** eliminar uno de los dos ficheros y dejar `proposta-pulsepath-contingut.md` como fuente única, que es la que consume el generador de DOCX.

---

## 3. Afirmaciones verificadas como correctas

Conviene dejar constancia de lo que **sí** se sostiene, porque es la parte defendible del expediente:

| Afirmación del expediente | Verificación en código |
|---|---|
| «Les dades viatgen xifrades i es guarden xifrades» | HTTPS en tránsito; AES-256-GCM con IV aleatorio de 96 bits y etiqueta de autenticación de 128 bits en reposo (`crypto.js`) |
| «Xifrat en trànsit i en repòs» (declaración 01) | Correcto |
| «El codi és un pseudònim; no s'afirmarà que les dades crues són anònimes» | Correcto: se persiste `codeHash` |
| «No càmeres, biometria, veu, dades passives del dispositiu ni geolocalització» | Verificable: el validador usa lista blanca cerrada y rechaza cualquier campo no previsto |
| «Supressió automàtica K ≥ 5» | Implementado y **más estricto** de lo declarado: cuenta personas únicas y se aplica por celda |
| «El code_hash mai s'exposa» | Correcto: ninguna salida de la API lo incluye |
| Instrumentos DASS-21, GAD-7 y CBI | Validados con recuento exacto de ítems (21 / 7 / 19) |
| «Cua de reintents per a l'enviament de sessions quan no hi ha xarxa» | Cola de sincronización implementada, con idempotencia por `(code_hash, date_local)` y `(code_hash, client_record_id)` |
| «Suite de tests automatitzats» | 26 ficheros de test en el repositorio y workflow de integración continua |
| «No E2E» — ausencia de promesas falsas | **Ninguna** afirmación de extremo a extremo, procesamiento en el borde ni conocimiento cero en los documentos vivos |

---

## 4. Acciones pendientes fuera del alcance documental

Ordenadas por prioridad:

1. **Ejecutar el preflight externo** (objetivo 30 / 14 días) **antes de activar personal municipal** y entregar resultados al Ajuntament. Ya no es bloqueante para presentar el expediente documental; sí lo es para el inicio material.
2. **Fijar la build que se presenta** (vía de estudio, sin Stroop) — hallazgo H-6.
3. **Parametrizar la malla de timepoints** a D0 / semana 4 / semana 8 — hallazgo H-4. Bloqueante para iniciar el piloto, no para presentar.
4. **Ejecutar un restore real** contra base desechable y actualizar `RESTORE_TEST.md` — hallazgo H-3.
5. **Limitar el cruce simultáneo de dimensiones** en el panel y registrar consultas — hallazgo H-7.
6. **Desplegar demo HTTPS** si se quiere ofrecer URL pública (opcional; hoy basta demostración bajo petición + capturas).
7. **Sustituir las capturas** por capturas del build desplegado cuando exista. Las actuales son de entorno de pruebas y así están identificadas.
