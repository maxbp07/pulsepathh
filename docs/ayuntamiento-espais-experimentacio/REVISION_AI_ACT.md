# Revisión jurídica del apartado «Compliment algorítmic» (AI Act)

**Documento revisado:** `proposta-pulsepath-contingut.md`, apartado «Compliment algorítmic» (§2) y declaración responsable `declaracions/06-protocol-sistemes-algoritmics.md`.
**Marco de contraste:** Reglamento (UE) 2024/1689 (AI Act), en la redacción vigente tras el Reglamento (UE) 2026/1744 («Digital Omnibus sobre IA», DOUE 24-07-2026, en vigor desde 27-07-2026); Protocolo municipal de sistemas algorítmicos del Ayuntamiento de Barcelona (Comisión de Gobierno, 15-12-2022); RGPD.
**Fecha de la revisión:** 9 de agosto de 2026.
**Naturaleza:** revisión interna de argumentación jurídica. **No sustituye** el dictamen del asesor jurídico especializado que la propia propuesta se compromete a contratar antes de recoger datos.

---

## 0. Resumen ejecutivo

El argumento de fondo es **correcto y defendible**: PulsePath, tal como está descrito y tal como está implementado, no encaja en la prohibición del artículo 5(1)(f) del AI Act ni en el anexo III. Sin embargo, la redacción actual **deja fuera los dos anclajes normativos más potentes que existen a favor del proyecto** y, a la vez, **omite el inciso del anexo III que un revisor adverso usaría en contra**. Es decir: el apartado está argumentado con material más débil del que tiene disponible, y no se anticipa a la única objeción seria.

Con los cambios aplicados en esta revisión (§3), el apartado pasa de «razonable pero vulnerable» a «sólido y anticipatorio».

---

## 1. Fortalezas del argumento

### 1.1. La exclusión definitoria por ausencia de datos biométricos es correcta y es la vía principal

El artículo 5(1)(f) prohíbe los sistemas de IA destinados a **inferir emociones** de una persona física en el lugar de trabajo. El concepto no es autónomo: se apoya en la definición del **artículo 3(39)**, según la cual un «sistema de reconocimiento de emociones» es el que identifica o infiere emociones o intenciones **a partir de los datos biométricos** de la persona. Y «datos biométricos» es, a su vez, un concepto definido (**artículo 3(34)**): datos obtenidos de un tratamiento técnico específico relativo a características físicas, fisiológicas o conductuales que permiten o confirman la **identificación única**.

PulsePath no trata datos biométricos en ese sentido técnico: no hay cámara, micrófono, señal fisiológica ni tratamiento orientado a identificar de forma única a nadie. La latencia de reacción del PVT-BA es un dato conductual, pero no se procesa para identificar a la persona, sino para medir vigilancia psicomotora bajo un seudónimo.

Consecuencia jurídica relevante: la exclusión opera **en el plano de la definición**, antes incluso de tener que discutir excepciones. Eso es mucho más fuerte que una exclusión por vía de excepción. El documento llega a esta conclusión, pero la razona en lenguaje descriptivo («no hay biometría») en lugar de anclarla en los artículos 3(39) y 3(34). **Anclarla es gratis y multiplica su valor ante un jurista.**

### 1.2. El considerando 18 excluye expresamente la fatiga — y ese es el núcleo del producto

Éste es **el mejor argumento del expediente y no aparecía en el documento**. El considerando 18 del AI Act, al delimitar qué se entiende por emoción o intención, dice que la noción se refiere a estados como felicidad, tristeza, enfado, sorpresa, asco, vergüenza, entusiasmo, bochorno, desprecio, satisfacción y diversión, y que **no incluye los estados físicos como el dolor o la fatiga**, mencionando explícitamente, como ejemplo permitido, los sistemas destinados a **detectar el estado de fatiga de pilotos o conductores profesionales con el fin de prevenir accidentes**.

El objeto central medido por PulsePath —somnolencia (KSS) y fatiga conductual (PVT-BA), con finalidad preventiva— cae de lleno en el ejemplo que el propio legislador europeo pone como **no prohibido**. Es difícil imaginar un anclaje mejor. Debe citarse de forma destacada.

### 1.3. El autoinforme no es inferencia

El artículo 5(1)(f) prohíbe **inferir**. Un cuestionario que la persona rellena conscientemente y envía de forma voluntaria no infiere nada: recoge una **declaración**. El documento ya lo dice y lo dice bien. Es un argumento correcto que conviene mantener tal cual, sin exagerarlo (ver debilidad 2.4).

### 1.4. El diseño operativo, no solo la declaración, sostiene la exclusión del anexo III

El argumento de que no hay uso laboral decisorio no descansa únicamente en una promesa: descansa en **arquitectura verificable**. En el código, la supresión K ≥ 5 se aplica contando **personas únicas** (valores distintos de `code_hash`), no sesiones, y se aplica también celda a celda en las vistas cruzadas; el identificador seudónimo nunca se expone en la salida de la API. Un argumento jurídico respaldado por código auditable es cualitativamente distinto de una declaración de intenciones, y conviene decirlo así.

### 1.5. La autocalificación proactiva y la cláusula de reevaluación juegan a favor

Frente al Protocolo municipal, el hecho de que el promotor analice el encaje por iniciativa propia, reconozca que un cambio de finalidad exigiría reevaluación y acepte expresamente la consecuencia del rechazo automático es un elemento de credibilidad. La declaración 06 está bien construida en este punto.

### 1.6. Las prohibiciones son la norma viva; las obligaciones de alto riesgo no lo están todavía

El Reglamento (UE) 2026/1744 ha aplazado la aplicación de las secciones 1, 2 y 3 del capítulo III (obligaciones de los sistemas de alto riesgo del anexo III) **del 2 de agosto de 2026 al 2 de diciembre de 2027**. En cambio, **el artículo 5 no ha sido aplazado** y se aplica desde el 2 de febrero de 2025 (la modificación que el Omnibus introduce en el artículo 5 se refiere a material íntimo no consentido y material de abuso sexual infantil, letras (ba) y (bb); la letra (f) permanece intacta). Tampoco se aplazan el artículo 4 (alfabetización en IA) ni las obligaciones de transparencia del artículo 50.

Esto es doblemente favorable y no estaba recogido:

- refuerza que el análisis **realmente exigible hoy** es el del artículo 5, que es precisamente donde PulsePath está más sólido;
- significa que, incluso en la lectura más adversa posible del anexo III, un piloto de ocho semanas ejecutado en otoño de 2026 **no quedaría sujeto al capítulo III**, porque terminaría más de un año antes del 2 de diciembre de 2027.

Citarlo demuestra que el expediente está actualizado a la normativa de hace dos semanas, lo cual es en sí mismo una señal de rigor.

---

## 2. Debilidades y riesgos de interpretación adversa

### 2.1. GRAVE — El anexo III, punto 4(b), incluye la monitorización del **comportamiento**, y el documento lo omitía

El documento enumeraba el anexo III en materia de empleo como referido a «selección, evaluación del rendimiento, promoción, retribución, asignación de tareas o decisiones que afecten a la relación laboral». Esa enumeración **está incompleta**. El punto 4(b) del anexo III abarca los sistemas destinados a tomar decisiones que afecten a las condiciones de la relación laboral, la promoción o la extinción, a asignar tareas en función del comportamiento individual o de rasgos personales, **o a supervisar y evaluar el rendimiento y el comportamiento de las personas** en dichas relaciones.

PulsePath, descrito de forma neutra, es un sistema que **registra diariamente el comportamiento de personas trabajadoras** (tiempos de reacción, autoinformes) durante ocho semanas dentro de la jornada laboral. Un evaluador que lea el inciso literal puede plantear la objeción. Omitir el inciso es la peor estrategia posible: si el evaluador lo detecta por su cuenta, la omisión se leerá como intento de sortearlo.

**La refutación existe y es buena**, pero hay que escribirla:

- el artículo 6(2) califica en función del uso **previsto** («intended to be used for»), no de cualquier lectura literal posible del sustrato técnico;
- el binomio del punto 4(b) es «supervisar **y** evaluar», en el contexto de la gestión de la relación laboral: aquí no hay evaluación de la persona por parte del empleador, porque el empleador **no recibe ningún resultado individual**;
- no hay destinatario organizativo del dato individual: el resultado individual es exclusivamente para la persona;
- la prohibición contractual de uso disciplinario, de aptitud o de rendimiento cierra la finalidad.

### 2.2. GRAVE — Si cayera en el anexo III, la vía de escape del artículo 6(3) está bloqueada por el *profiling*

Conviene ser consciente de esto internamente y decirlo con transparencia en el documento. El artículo 6(3) permite que un sistema listado en el anexo III no se considere de alto riesgo si no plantea un riesgo significativo (tarea procedimental limitada, mejora de una actividad humana previa, detección de patrones, tarea preparatoria). Pero el último párrafo del artículo 6(3) establece que un sistema del anexo III **se considerará siempre de alto riesgo cuando realice elaboración de perfiles de personas físicas**.

PulsePath calcula un índice de riesgo individual por sesión a partir de datos personales para evaluar aspectos personales (fatiga, bienestar). Eso encaja razonablemente en la noción de elaboración de perfiles del artículo 4(4) del RGPD. Por tanto:

- **no se debe construir la defensa sobre el artículo 6(3)**; hacerlo sería frágil;
- la defensa correcta es que el sistema **no entra** en el anexo III por razón de finalidad (2.1), no que entre y se salve por la derogación.

El documento no invocaba el 6(3), lo cual es correcto por omisión, pero conviene decir expresamente que no se invoca. Eso convierte una omisión en una posición jurídica deliberada.

### 2.3. MEDIA — «Riesgo limitado» no es una categoría jurídica del AI Act

El AI Act no define una clase normativa llamada «riesgo limitado». Es terminología divulgativa (usada por la Comisión y recogida en la taxonomía del Protocolo municipal) para referirse a los sistemas sujetos únicamente a las obligaciones de transparencia del artículo 50. Un jurista puede señalar la imprecisión, y además el artículo 50 sólo se aplica a categorías tasadas (interacción con personas, contenido sintético, reconocimiento de emociones no prohibido, categorización biométrica, ultrasuplantaciones), ninguna de las cuales incluye necesariamente a PulsePath.

La formulación defendible es: el sistema queda **fuera del artículo 5**, **no es de alto riesgo** y, aunque no le resulten directamente exigibles las obligaciones del artículo 50, el promotor **se somete voluntariamente** a medidas de transparencia equivalentes. Eso es más preciso y, además, más generoso.

### 2.4. MEDIA — «Solo medimos fatiga» no cubre DASS-21, GAD-7 ni CBI

El considerando 18 excluye los estados **físicos** como el dolor o la fatiga. La somnolencia y la vigilancia psicomotora encajan sin problema. Pero DASS-21 y GAD-7 miden ansiedad, estrés y estado de ánimo, que sí pertenecen al terreno psicoemocional. Apoyarse solo en el considerando 18 dejaría sin cubrir una parte del sistema.

El argumento tiene que ser **acumulativo y jerarquizado**, no monotemático:

1. exclusión definitoria por ausencia de datos biométricos (artículos 3(39) y 3(34)) — cubre **todo** el sistema, incluidos los cuestionarios psicométricos;
2. ausencia de inferencia: el autoinforme es declaración consciente — cubre los cuestionarios;
3. considerando 18: la medida objetiva es fatiga, expresamente excluida — refuerza el PVT-BA y la KSS.

Ordenados así, no queda hueco. Ordenados como estaban, sí.

### 2.5. MEDIA — El índice de riesgo individual existe y no se declaraba

El sistema calcula y almacena un índice de riesgo individual cifrado. Es cierto y sigue siendo cierto que la organización no lo ve. Pero si el Ayuntamiento pide la documentación técnica prevista en la propia declaración 06 y descubre un `risk_index` por persona que el documento no mencionaba, el efecto sobre la credibilidad es desproporcionadamente malo comparado con el coste de declararlo de antemano. **Declararlo proactivamente convierte un hallazgo incómodo en una prueba de transparencia.**

### 2.6. MEDIA — La voluntariedad en el ámbito laboral es el flanco más previsible

Es la objeción que con más probabilidad planteará el DPD municipal o la representación sindical, y no es propiamente de AI Act sino de RGPD: el consentimiento del artículo 9(2)(a) es discutible como base jurídica en una relación laboral por el desequilibrio de poder (considerando 43 del RGPD, doctrina del GT29/CEPD). La ratio del propio artículo 5(1)(f) —el legislador prohíbe precisamente en el trabajo y en la educación por la asimetría— alimenta esa lectura.

No es un defecto de la argumentación de IA, pero **se planteará en la misma reunión**, y la propuesta debe llegar con la respuesta ya escrita: voluntariedad real sin consecuencias, la persona coordinadora no ve resultados, información y consulta al Comité de Seguridad y Salud y a la representación sindical, y determinación de la base jurídica en la revisión jurídica previa.

### 2.7. MEDIA — La EIPD se enuncia como condicional cuando es casi con seguridad obligatoria

El documento decía «si correspon, una avaluació d'impacte». Con tratamiento sistemático de datos de salud de personas trabajadoras mediante una tecnología nueva, la evaluación de impacto del artículo 35(3) del RGPD es previsiblemente **obligatoria**, y así consta en las listas de las autoridades de control. Mantenerlo como condicional resta seriedad sin ganar nada; asumirlo como firme es un compromiso que el proyecto ya iba a cumplir de todos modos.

### 2.8. BAJA — Trampa: no invocar nunca la excepción «médica o de seguridad» del artículo 5(1)(f)

El artículo 5(1)(f) exceptúa los sistemas destinados a instalarse por razones **médicas o de seguridad**. Podría parecer una red de seguridad adicional, pero **invocarla sería contraproducente**: obligaría a sostener que PulsePath tiene finalidad médica, en contradicción frontal con la afirmación —repetida en todo el expediente y en las declaraciones responsables— de que es una herramienta **no clínica** que no diagnostica ni sustituye a la vigilancia de la salud. Conviene dejar constancia interna de que esta vía no se usa por decisión consciente.

### 2.9. BAJA — Faltaban referencias fáciles que suman: artículos 4, 26(7) y anexo III.1(c)

- **Artículo 4 (alfabetización en IA):** exigible a proveedores y responsables del despliegue desde el 2 de febrero de 2025, con independencia de la clasificación de riesgo, y no aplazado por el Omnibus. Comprometer una acción formativa mínima para la persona coordinadora e interlocutores municipales es barato y demuestra conocimiento fino de la norma.
- **Artículo 26(7):** obligación del empleador de informar a los representantes de los trabajadores y a las personas afectadas. Formalmente sólo aplica a sistemas de alto riesgo, pero la propuesta ya se compromete operativamente a hacerlo. Decir «lo hacemos aunque no estemos obligados» es un argumento fuerte.
- **Anexo III, punto 1(c):** incluye entre los sistemas de alto riesgo los de reconocimiento de emociones que no estén prohibidos. Al no tratarse datos biométricos, tampoco resulta aplicable. Conviene excluirlo expresamente para cerrar el análisis del anexo III de forma completa, y no sólo por el punto 4.

### 2.10. BAJA — Ambigüedad sobre si el sistema es siquiera un «sistema de IA»

Durante el piloto el motor es una heurística determinista de pesos explícitos. El artículo 3(1) y el considerando 12 sugieren que los sistemas basados en reglas definidas exclusivamente por personas físicas para ejecutar operaciones automáticamente quedan fuera del concepto de sistema de IA. Es un argumento real, pero **peligroso como argumento principal**: si se afirma «no es IA», se debilita la coherencia de proponer a la vez una clasificación de riesgo, y choca con el plan declarado de explorar aprendizaje automático más adelante.

Tratamiento recomendado: exponerlo como **posición subsidiaria y no determinante** («aunque podría discutirse si constituye siquiera un sistema de IA, el análisis se realiza como si lo fuera»). Así se gana el punto sin asumir el riesgo.

---

## 3. Cambios concretos recomendados — **APLICADOS**

Los siguientes cambios se han aplicado ya sobre `proposta-pulsepath-contingut.md` (apartado «Compliment algorítmic», tabla de riesgos y referencias) y sobre `declaracions/06-protocol-sistemes-algoritmics.md`:

| # | Cambio | Debilidad que cierra |
|---|---|---|
| 1 | Anclar la exclusión en los artículos 3(39) y 3(34) (definición de reconocimiento de emociones y de datos biométricos), como argumento **principal** | 1.1 / 2.4 |
| 2 | Incorporar el **considerando 18** y su exclusión expresa de los estados físicos (dolor, fatiga) con el ejemplo de pilotos y conductores | 1.2 |
| 3 | Reordenar el razonamiento del artículo 5(1)(f) en tres niveles acumulativos (definición → ausencia de inferencia → considerando 18) | 2.4 |
| 4 | Transcribir el punto 4(b) del anexo III **incluyendo «supervisar y evaluar el comportamiento»** y refutarlo de forma expresa mediante el criterio de finalidad prevista del artículo 6(2) | 2.1 |
| 5 | Excluir también el punto **1(c)** del anexo III (reconocimiento de emociones no prohibido) | 2.9 |
| 6 | Declarar expresamente que **no se invoca** la derogación del artículo 6(3), por la cláusula de elaboración de perfiles | 2.2 |
| 7 | Sustituir la clasificación cerrada «riesgo limitado» por una formulación precisa: fuera del artículo 5, no de alto riesgo, con sometimiento **voluntario** a transparencia equivalente a la del artículo 50 | 2.3 |
| 8 | Declarar de forma proactiva la existencia del **índice de riesgo individual**, su carácter cifrado y su no visibilidad para la organización | 2.5 |
| 9 | Incorporar el **Reglamento (UE) 2026/1744** y el calendario resultante (artículo 5 vigente desde 02-02-2025; capítulo III / anexo III aplazado al 02-12-2027) | 1.6 |
| 10 | Añadir compromiso de **alfabetización en IA** (artículo 4) e información a la representación laboral en línea con el artículo 26(7) | 2.9 |
| 11 | Convertir la EIPD de condicional a **compromiso firme** | 2.7 |
| 12 | Añadir la posición **subsidiaria** sobre la condición de sistema de IA (artículo 3(1) y considerando 12) | 2.10 |
| 13 | Reforzar la fila correspondiente de la tabla de riesgos y actualizar el apartado de referencias públicas | 2.1 / 1.6 |
| 14 | Trasladar los puntos 1, 2, 4, 6, 7, 9 y 10 a la declaración responsable 06, para que declaración y propuesta digan exactamente lo mismo | coherencia |

**Decisión consciente registrada:** no se invoca la excepción médica o de seguridad del artículo 5(1)(f) (debilidad 2.8). No se ha introducido en el documento y no debe introducirse en negociaciones posteriores sin reconsiderar todo el posicionamiento no clínico del proyecto.

---

## 4. Veredicto

**Antes de los cambios: NO listo para presentar.** No por ser incorrecto —el fondo se sostiene—, sino por ser **vulnerable en un punto concreto y evitable**: la enumeración incompleta del anexo III, punto 4(b), omitía justamente el inciso sobre supervisión del comportamiento, que es el que un evaluador competente usaría para cuestionar la propuesta. A eso se sumaba que el mejor argumento disponible (considerando 18, exclusión expresa de la fatiga) no se estaba utilizando.

**Después de los cambios aplicados: LISTO para presentar en cuanto al apartado de cumplimiento algorítmico**, con tres condiciones que no dependen de esta revisión:

1. **Actualizar la nota interna** si el estado del expediente cambia (véase `REVISION_COHERENCIA.md`). El análisis de IA es sólido; la coherencia factual del expediente se ha alineado con TRL 5 y sin cifras inventadas de preflight.
2. **Las afirmaciones de estado de despliegue y de preflight** quedan alineadas con la realidad (TRL 5, sin demo pública, preflight como compromiso previo a la activación municipal). Revisar `REVISION_COHERENCIA.md` si el estado técnico cambia.
3. **Validación por asesor jurídico especializado antes de recoger datos**, centrada no en el AI Act —donde la posición ya es firme— sino en la **base jurídica del RGPD para datos de salud en contexto laboral** (debilidad 2.6), que es el frente realmente abierto.

Valoración del riesgo residual de que el Ayuntamiento clasifique PulsePath como riesgo inacceptable y lo rechace automáticamente: **bajo**. La exclusión por ausencia de datos biométricos es definitoria, no discrecional, y el considerando 18 excluye expresamente la finalidad principal del sistema. Riesgo de que se exija reforzar la gobernanza o documentación adicional antes de firmar el convenio: **moderado y esperable**, y la propuesta ya lo asume.

---

## 5. Nota de método

Esta revisión se ha realizado contrastando el texto de la propuesta con el articulado del Reglamento (UE) 2024/1689 en su redacción consolidada tras el Reglamento (UE) 2026/1744, y con el comportamiento real del código del repositorio (módulos de cifrado, validación de entrada del check-in diario y supresión K-anónima), no únicamente con la documentación. Los hallazgos derivados del contraste con el código se recogen en `REVISION_COHERENCIA.md`.
