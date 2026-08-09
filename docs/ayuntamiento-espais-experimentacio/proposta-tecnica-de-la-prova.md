# PulsePath: prova pilot de detecció preventiva i agregada de fatiga i estrès en equips municipals de Serveis Socials i Atenció Ciutadana

**Promotor:** Max Borra Palau (persona física) · PulsePath  
**Data:** {{DATA_DOCUMENT}} (agost / setembre de 2026)  
**Tràmit:** 20260001771 · Accés als Espais d'experimentació de Barcelona  
**Marc:** Ordenança dels espais d'experimentació de Barcelona (aprovada el 27 de març de 2026)

---

## 1. Resum i context

### Descripció

PulsePath és una PWA B2B de benestar laboral, no clínica, que ajuda a identificar tendències agregades de fatiga, somnolència, estrès, ansietat i desgast professional (burnout) abans que es consolidin com a problemes organitzatius. La solució combina:

- un check-in breu per jornada laboral amb l'escala de somnolència de Karolinska (KSS) i una prova de vigilància psicomotora breu i adaptativa (PVT-BA);
- qüestionaris validades en tres moments de la prova (DASS-21, GAD-7 i Copenhagen Burnout Inventory);
- retorn privat per a cada persona participant, amb evolució personal i recomanacions generals de benestar;
- un quadre de comandament per a l'organització que només mostra resultats agregats quan hi ha un mínim de cinc persones per segment (K ≥ 5).

**Què mesura i què no mesura.** PulsePath mesura latència de reacció en una tasca psicomotora i recull autoinformes voluntaris. No utilitza càmeres, biometria, veu, expressió facial, senyals fisiològiques, dades passives del dispositiu ni geolocalització. No diagnostica trastorns, no substitueix la vigilància de la salut, no avalua el rendiment ni l'aptitud per al lloc de treball, i no envia alertes individuals a comandaments ni a recursos humans.

La proposta respon a una limitació habitual de moltes eines de benestar laboral: depenen exclusivament d'enquestes llargues i puntuals, ofereixen una fotografia tardana i poden generar poca adherència. PulsePath hi afegeix una mesura conductual breu, repetida i compatible amb el mòbil, dins d'un protocol de privacitat verificable.

La prova es planteja amb **50 persones treballadores municipals** del col·lectiu de **Serveis Socials i Atenció Ciutadana**, amb participació voluntària dins d'una franja pactada de la jornada laboral. El promotor és una **persona física** (Max Borra Palau), sense societat mercantil constituïda.

### Objectius de la prova

**Objectiu principal**

Validar si PulsePath pot detectar tendències agregades i útils de fatiga i malestar emocional amb una adherència suficient, sense permetre la identificació individual per part de comandaments o recursos humans.

**Objectius específics**

1. Mesurar la viabilitat d'un check-in breu una vegada per jornada laboral durant vuit setmanes.
2. Comprovar l'adherència, l'abandonament, l'acceptabilitat i la utilitat percebuda per les persones participants.
3. Analitzar si les tendències del PVT-BA i la KSS s'associen de manera exploratòria amb l'evolució de DASS-21, GAD-7 i CBI.
4. Comparar patrons agregats entre equips amb càrrega o contextos diferents dins de Serveis Socials i Atenció Ciutadana, sense fer inferències individuals.
5. Validar la utilitat del quadre de comandament i dels informes periòdics per orientar converses preventives.
6. Provar el protocol de privacitat, consentiment, minimització, supressió K ≥ 5, drets i eliminació.
7. Generar una memòria final (art. 18) i un taller de retorn amb aprenentatges transferibles a altres serveis públics.
8. Valorar, només com a resultat secundari, la viabilitat d'un model estadístic o d'aprenentatge automàtic exploratori. No es presentarà com un model clínic ni validat.

La prova no té com a objectiu demostrar una reducció clínica del burnout ni avaluar el rendiment individual.

### Antecedents

- PulsePath va ser finalista nacional, Top 5 d'Espanya, de Red Bull Basement 2026. No es presenta com un reconeixement mundial.
- El projecte forma part de la comunitat de 1517 Fund i disposa d'aproximadament 20.000 dòlars en crèdits de computació al núvol (10.000 dòlars d'AWS i 10.000 de Lambda Labs). Són crèdits tecnològics, no inversió en efectiu.
- Max Borra Palau estudia Digital Business a ESIC i compta amb la seva xarxa acadèmica i d'emprenedoria com a entorn de suport.
- S'ha mantingut una conversa sobre el concepte amb el Dr. Mathias Basner (University of Pennsylvania), investigador de referència del PVT. No va consistir en una auditoria de la implementació i no constitueix un aval formal.
- Existeix també una **sol·licitud en curs** davant l'Ajuntament de València, en el marc del seu Sandbox Urbà. Es tracta d'una sol·licitud presentada, no d'una aprovació ni d'una autorització atorgada. Es menciona només com a senyal d'interès institucional concurrent.
- El sistema està **desenvolupat i plenament operatiu en entorn de proves**, amb l'inventari de funcionalitats descrit a l'apartat de maduresa tecnològica. El **desplegament públic amb HTTPS està en curs** i s'habilitarà abans de l'avaluació de l'expedient. Encara no hi ha clients ni ingressos. Aquesta seria la primera prova en un entorn laboral públic real.
- **Abans de presentar l'expedient s'executarà un preflight amb voluntariat adult extern**, els resultats del qual s'incorporaran als marcadors `{{...}}` de l'apartat de maduresa tecnològica.

---

## 2. Requisits per participar (elegibilitat)

### Nivell de maduresa tecnològica

El projecte es declara en **TRL 6** (tecnologia demostrada en entorn rellevant), d'acord amb l'article 12.2.a de l'Ordenança (TRL 5 o superior).

**Evidència del producte desplegat (inventari precís)**

El sistema no es presenta com a simple esborrany conceptual. Està desenvolupat, provat i operatiu en entorn de proves el conjunt següent (el desplegament públic amb HTTPS es completarà abans de l'avaluació):

1. **Aplicació de participant (PWA):** onboarding, consentiment informat versionat, check-in diari amb context, KSS i PVT-BA, resultat individual privat, historial i analítica personal. El context recollit es limita a tres camps: hores de son (0-12), qualitat del descans (1-5) i consum de cafeïna (sí/no); el servidor rebutja qualsevol camp addicional no previst.
2. **Qüestionaris planificats:** DASS-21, GAD-7 i Copenhagen Burnout Inventory, amb finestres temporals (inici, setmana 4 i setmana 8).
3. **Sincronització tolerant a desconnexió:** cua de reintents per a l'enviament de sessions quan no hi ha xarxa.
4. **Notificacions push** per a recordatoris operatius (sense contingut de resultats individuals dirigits a l'organització).
5. **Backend:** ingesta de payload íntegre, gestió de qüestionaris, panell d'administració i endpoints d'operació.
6. **Panell agregat per a l'organització** amb supressió automàtica K ≥ 5, comptant **persones úniques** (no sessions) i aplicada també cel·la a cel·la en les vistes creuades.
7. **Exportació estructurada** per a anàlisi.
8. **Scripts de còpia de seguretat i de restauració** amb procediment documentat i verificació d'integritat executada. La restauració completa contra una base de dades d'un sol ús es validarà durant la preparació prèvia.
9. **Suite de tests automatitzats** del producte i integració contínua.

**Demo per a l'avaluació**

- URL de demostració pública: `{{URL_DEMO}}` (prevista: `https://app.getpulsepath.com`).
- Credencials per a la persona avaluadora: `{{CREDENCIALS_AVALUADOR}}`.
- El desplegament públic amb HTTPS es completarà abans de l'avaluació de l'expedient. Fins llavors, les captures adjuntes corresponen a l'entorn de proves i s'identifiquen com a tals.

**Preflight amb voluntariat extern (base del TRL 6)**

Abans de la presentació s'executarà un preflight real amb voluntariat adult extern, no municipal:

| Indicador | Valor |
|---|---|
| Nombre de participants del preflight | `{{N_PARTICIPANTS_PREFLIGHT}}` |
| Dies de durada del preflight | `{{DIES_PREFLIGHT}}` |
| Adherència diària observada | `{{ADHERENCIA_DIARIA}}` |
| Taxa d'abandonament | `{{TASA_ABANDONO}}` |
| Incidents crítics oberts en tancar el preflight | `{{INCIDENTS_CRITICS_PREFLIGHT}}` |
| Data d'inici / fi del preflight | `{{DATA_INICI_PREFLIGHT}}` / `{{DATA_FI_PREFLIGHT}}` |

El preflight servirà per verificar usabilitat, compatibilitat entre dispositius, sincronització, suport, exercici del dret de supressió i aplicació de K ≥ 5. No constituirà una validació científica ni una avaluació laboral municipal. Les dades tècniques mínimes del preflight s'eliminaran segons el protocol acordat; cap resultat del preflight s'utilitzarà per entrenar models destinats a la prova municipal sense consentiment específic.

**Nota sobre marcadors pendents.** Els valors `{{...}}` d'aquest apartat s'han d'emplenar amb les xifres reals del preflight abans de presentar l'expedient. No s'han d'inventar.

### Compliment algorítmic

Aquest apartat respon a l'article 10.3.b.6 i al criteri d'elegibilitat de l'article 12.2.a de l'Ordenança, així com al Protocol municipal «Definició de metodologies de treball i protocols per a la implementació de sistemes algorítmics» (aprovat per la Comissió de Govern el 15 de desembre de 2022; referència ordinamental de l'Ajuntament de 2 de gener de 2023, o protocol que el substitueixi). El Protocol remarca la taxonomia de riscos del Reglament (UE) 2024/1689 (Reglament europeu d'intel·ligència artificial, «AI Act») i estableix que els sistemes de **risc inacceptable** seran rebutjats automàticament.

#### Marc normatiu vigent i calendari d'aplicació

L'anàlisi es fa sobre el Reglament (UE) 2024/1689 en la redacció resultant del **Reglament (UE) 2026/1744** («Digital Omnibus» sobre intel·ligència artificial, DOUE de 24 de juliol de 2026, en vigor des del 27 de juliol de 2026). Aquesta modificació és rellevant per a l'encaix temporal de la prova:

- Les **prohibicions de l'article 5** s'apliquen des del **2 de febrer de 2025** i **no han estat ajornades**. La modificació que el Reglament 2026/1744 introdueix a l'article 5 afecta les noves lletres (ba) i (bb) —material íntim no consentit i material d'abús sexual infantil—; la **lletra (f) roman inalterada**. L'anàlisi de l'article 5(1)(f) és, per tant, la que resulta exigible avui.
- Les obligacions del **capítol III per als sistemes d'alt risc de l'annex III** s'han ajornat del 2 d'agost de 2026 al **2 de desembre de 2027**. Una prova de vuit setmanes executada la tardor de 2026 finalitzaria més d'un any abans d'aquesta data, fins i tot en la lectura més desfavorable de l'annex III.
- L'**article 4 (alfabetització en matèria d'IA)** i les obligacions de transparència de l'**article 50** conserven el seu calendari i no s'han ajornat.

Aquesta precisió no s'utilitza com a argument per rebaixar el nivell d'exigència: el projecte assumeix les garanties descrites més avall amb independència del calendari.

#### Prudència metodològica i posició subsidiària

PulsePath no es presenta com un sistema d'IA generativa ni com un model opac de predicció clínica. Durant la prova, el motor de càlcul és una **heurística determinista i documentada** (ponderació explícita de mètriques de sessió), no un model entrenat.

Podria discutir-se si un motor d'aquestes característiques constitueix pròpiament un «sistema d'IA» en el sentit de l'article 3(1) i del considerant 12 de l'AI Act, que exclou del concepte els sistemes basats en regles definides exclusivament per persones físiques per executar operacions automàticament. **El promotor no basa la seva posició en aquesta exclusió.** L'anàlisi que segueix es fa *com si* el sistema quedés plenament dins de l'àmbit del Reglament, perquè el projecte tracta dades de benestar laboral i pot evolucionar, amb consentiment separat, cap a usos d'investigació o d'aprenentatge automàtic.

L'anàlisi és argumentativa i verificable: descriu què fa el sistema, què no fa i quines garanties operatives —algunes comprovables en el codi— impedeixen el seu ús com a eina de control laboral o d'inferència emocional prohibida.

#### Per què PulsePath no cau en el risc inacceptable de l'article 5(1)(f) de l'AI Act

L'article 5(1)(f) prohibeix la comercialització, la posada en servei o l'ús de sistemes d'IA destinats a **inferir emocions d'una persona física en l'àmbit del lloc de treball**. L'argumentació de PulsePath es construeix en tres nivells acumulatius, del més fort al més accessori.

**Primer nivell — exclusió per definició: no es tracten dades biomètriques.**

La prohibició no és autònoma: descansa en la definició de l'**article 3(39)**, segons la qual un sistema de reconeixement d'emocions és aquell destinat a identificar o inferir emocions o intencions **a partir de les dades biomètriques** de la persona. Al seu torn, l'**article 3(34)** defineix les dades biomètriques com les obtingudes d'un tractament tècnic específic relatiu a característiques físiques, fisiològiques o conductuals que permeten o confirmen la **identificació única** d'una persona.

PulsePath no tracta dades biomètriques en aquest sentit tècnic: no captura imatge facial, veu, expressió, to muscular, ritme cardíac, conductància de la pell ni cap senyal fisiològica; no hi ha càmera, micròfon ni sensors. La latència de reacció del PVT-BA és una dada conductual, però **no es tracta amb la finalitat d'identificar de manera única cap persona**: es registra sota un codi pseudònim per mesurar vigilància psicomotora.

L'exclusió opera, doncs, **en el pla de la definició**, sense necessitat d'acudir a cap excepció. Aquest primer nivell cobreix la totalitat del sistema, inclosos els qüestionaris psicomètrics.

**Segon nivell — no hi ha inferència: hi ha declaració voluntària.**

L'article 5(1)(f) prohibeix **inferir**. La KSS, el DASS-21, el GAD-7 i el CBI són instruments que la pròpia persona completa conscientment i decideix enviar. El sistema no dedueix estats amagats a partir de senyals no articulades: recull respostes explícites. Un sistema que llegeix la cara o la veu per etiquetar «enuig» o «tristesa» sense que la persona ho manifesti no és equivalent a un sistema que pregunta, amb consentiment informat, com se sent.

**Tercer nivell — la fatiga està expressament exclosa pel considerant 18.**

El considerant 18 de l'AI Act delimita la noció d'emoció o intenció (felicitat, tristesa, enuig, sorpresa, fàstic, vergonya, entusiasme, menyspreu, satisfacció, diversió) i precisa que **no inclou els estats físics com el dolor o la fatiga**, i esmenta com a exemple admissible els sistemes destinats a **detectar l'estat de fatiga de pilots o conductors professionals amb finalitat de prevenció d'accidents**.

L'objecte central de mesura de PulsePath —somnolència (KSS) i fatiga conductual (PVT-BA), amb finalitat preventiva— encaixa directament en aquesta exclusió expressa del legislador europeu.

**Precisió honesta.** El projecte no sosté que tot el que mesura sigui «fatiga física». El DASS-21 i el GAD-7 recullen ansietat i estrès, que pertanyen a un terreny psicoemocional. Precisament per això l'argument principal és el primer nivell (absència de dades biomètriques), que cobreix tot el sistema, i no el tercer, que reforça específicament la mesura objectiva.

**Excepció no invocada.** L'article 5(1)(f) preveu una excepció per raons mèdiques o de seguretat. El promotor **no la invoca**, perquè fer-ho seria incompatible amb el caràcter expressament no clínic de PulsePath, mantingut de manera coherent en tot l'expedient.

#### Per què no es classifica com a sistema d'alt risc de l'annex III

**Annex III, punt 4 (ocupació).** El punt 4(b) inclou els sistemes destinats a adoptar decisions que afectin les condicions de la relació laboral, la promoció o l'extinció, a assignar tasques en funció del comportament individual o de trets personals, **o a supervisar i avaluar el rendiment i el comportament** de les persones en aquestes relacions. Aquest darrer incís es transcriu de manera literal i deliberada, perquè és el que podria suscitar dubtes: PulsePath registra, en efecte, conducta de persones treballadores dins de la jornada.

La resposta és de **finalitat prevista**, que és el criteri que fixa l'article 6(2):

- el binomi del punt 4(b) és «supervisar **i** avaluar» en el context de la gestió de la relació laboral; aquí **no hi ha avaluació de la persona per part de l'ocupador**, perquè l'ocupador no rep cap resultat individual;
- no hi ha destinatari organitzatiu de la dada individual: el resultat individual només el veu la persona participant;
- l'organització només accedeix a agregats amb supressió K ≥ 5, aplicada comptant **persones úniques** i també cel·la a cel·la en les vistes creuades;
- no se seleccionen candidatures, no s'avalua el rendiment laboral, no es decideix sobre promoció, retribució, assignació de tasques ni extinció, i no s'emeten alertes nominatives a comandaments;
- el conveni inclourà la **prohibició contractual** d'utilitzar els resultats amb finalitats d'avaluació de rendiment, aptitud, disciplina o selecció.

**Annex III, punt 1(c) (reconeixement d'emocions).** Tampoc resulta aplicable: aquest punt cobreix els sistemes de reconeixement d'emocions no prohibits, i PulsePath no ho és per les raons de definició exposades a l'apartat anterior.

**No s'invoca la derogació de l'article 6(3).** El promotor deixa constància expressa que **no** fonamenta la seva posició en l'article 6(3) —que permet no considerar d'alt risc determinats sistemes de l'annex III—, atès que el darrer paràgraf d'aquest article estableix que un sistema de l'annex III es considerarà sempre d'alt risc quan efectuï **elaboració de perfils** de persones físiques. La posició del projecte és que el sistema **no entra** en l'annex III per raó de finalitat, no que hi entri i se'n salvi per una derogació.

#### Classificació proposada durant la prova

L'AI Act no configura una categoria jurídica autònoma anomenada «risc limitat»: es tracta de terminologia divulgativa, recollida també en la taxonomia del Protocol municipal, per referir-se als sistemes subjectes únicament a obligacions de transparència. Per precisió, la posició del promotor s'enuncia així:

1. El sistema queda **fora de l'àmbit de les pràctiques prohibides de l'article 5**.
2. El sistema **no és d'alt risc** en el sentit de l'article 6(2) i de l'annex III.
3. Encara que no li resultin directament exigibles les obligacions de transparència de l'article 50, el promotor **s'hi sotmet voluntàriament** i aplica mesures de transparència equivalents durant tota la prova.

Aquesta posició **no pretén eludir** el Protocol municipal ni l'AI Act; **reconeix** que qualsevol canvi de finalitat —passar a avaluar aptitud o rendiment, o inferir emocions a partir de biometria— exigiria una reavaluació i, si escau, comportaria el rebuig automàtic; i **assumeix** que l'entrenament futur d'un model d'aprenentatge automàtic requeriria consentiment separat, una nova anàlisi de risc i, si correspongués, el compliment del règim d'alt risc.

#### Declaració proactiva sobre el càlcul individual

Per transparència, i abans que l'Ajuntament ho detecti en la documentació tècnica que el promotor es compromet a lliurar, es fa constar de manera expressa:

- El sistema **calcula un índex de benestar/risc individual per sessió**, mitjançant una heurística determinista de pesos explícits sobre les mètriques de la sessió.
- Aquest índex **s'emmagatzema xifrat** i només és visible **per a la pròpia persona participant**, com a part del seu retorn privat.
- **Mai** s'exposa a l'organització, ni de manera nominativa ni pseudonimitzada: el panell organitzatiu només rep agregats que han superat la supressió K ≥ 5, i el codi pseudònim no s'inclou en cap sortida.
- **No s'utilitza** per a cap finalitat d'avaluació, aptitud, disciplina o comparació entre persones.
- Els pesos i el procediment de càlcul es documentaran i es posaran a disposició de l'Ajuntament en el marc del conveni.

#### Mesures de transparència i governança algorítmica durant la prova

1. Informació prèvia clara a les persones participants sobre què es mesura, què no es mesura i qui veu què.
2. Consentiment informat versionat abans de la recollida.
3. Documentació de l'heurística de càlcul (entrades, pesos, sortides) accessible a l'Ajuntament en el marc del conveni.
4. Absència de decisions automatitzades amb efectes jurídics o laborals significatius sobre la persona.
5. Revisió humana de qualsevol interpretació organitzativa dels agregats.
6. Prohibició contractual d'ús dels resultats per a avaluació de rendiment, aptitud, disciplina o selecció.
7. Qualsevol ús posterior per a investigació o entrenament de models requereix consentiment separat i no condiciona la participació.
8. **Alfabetització en matèria d'IA (article 4).** El promotor facilitarà una acció formativa breu sobre el funcionament, els límits i les finalitats excloses del sistema a la persona coordinadora municipal i als interlocutors implicats, en compliment de l'article 4, exigible amb independència de la classificació de risc.
9. **Informació a la representació de les persones treballadores.** Encara que l'obligació de l'article 26(7) es refereix als sistemes d'alt risc, el promotor assumeix el seu contingut de manera voluntària: informació al Comitè de Seguretat i Salut Laboral i a la representació sindical abans de l'inici, i informació individual a cada persona participant.
10. **Avaluació d'impacte relativa a la protecció de dades.** Es realitzarà una AIPD conforme a l'article 35 del RGPD amb caràcter previ a qualsevol recollida de dades. No es tracta d'una previsió condicional: el tractament sistemàtic de dades de salut de persones treballadores mitjançant una tecnologia nova la fa exigible.

La declaració responsable corresponent figura a `declaracions/06-protocol-sistemes-algoritmics.md`. L'anàlisi jurídica detallada que sustenta aquest apartat, incloent-hi les objeccions considerades i descartades, consta a `REVISION_AI_ACT.md`.

### El valor de provar en un entorn real

La validesa de la proposta depèn de factors que no es poden reproduir només amb dades sintètiques ni amb un preflight de curta durada:

- la diversitat de dispositius mòbils i contextos d'ús en centres de treball reals;
- els efectes de la càrrega percebuda, l'atenció directa a persones i el moment de la jornada en Serveis Socials i Atenció Ciutadana;
- l'adherència sostinguda durant diverses setmanes;
- la confiança de la plantilla en una eina vinculada al benestar laboral;
- la interpretació responsable de resultats agregats per part de l'organització;
- la coordinació entre innovació, persones, prevenció de riscos laborals, protecció de dades, comitè de seguretat i salut i representació sindical.

Barcelona ofereix un entorn especialment rellevant per la diversitat de serveis i perfils laborals i perquè ja disposa de polítiques actives de salut mental a la feina. La prova permetria validar tant la tecnologia com el model de governança, que és tan important com el producte.

### Coherència amb els objectius estratègics municipals

La proposta és coherent amb:

- el **II Pla de Salut Mental de Barcelona 2023-2030**, orientat a la promoció del benestar psicològic i la prevenció del malestar;
- l'**Acord de ciutat per cuidar la salut mental a la feina**, que promou la detecció precoç, la participació de les persones treballadores i la reducció dels riscos psicosocials;
- el **Pla per a la reducció de l'absentisme del personal de l'Ajuntament de Barcelona i ens adherits (2026)**, que identifica la fatiga física i mental, l'estrès acumulat i l'equilibri entre vida laboral i personal com a factors preventius;
- l'Agenda 2030 de Barcelona, especialment els ODS 3 (salut i benestar), 8 (treball digne) i 9 (innovació);
- l'article 6.1.i) de l'Ordenança (seguretat i protecció dels drets, especialment els relacionats amb les dades de caràcter personal) i l'article 6.1.a) (millora de la gestió dels recursos municipals i de la prestació de serveis).

PulsePath no pretén substituir les avaluacions reglamentàries de riscos psicosocials. Aspira a complementar-les amb una capa voluntària, freqüent i agregada que ajudi a observar canvis entre avaluacions puntuals.

### Durada prevista

La prova tindrà una durada total de **vuit setmanes**, més una preparació prèvia d'entre **dues i quatre setmanes** després de la signatura del conveni. Aquesta durada és molt inferior al màxim de **24 mesos** de l'article 13.5 de l'Ordenança.

- Setmanes 1-2: validació inicial, cohort sentinella, ajust operatiu i primer gate de continuïtat.
- Setmanes 3-8: desplegament principal, seguiment, informes periòdics i tancament.

Cap data concreta condiciona la viabilitat. L'inici es pot fixar un cop formalitzat el conveni i completades la revisió jurídica, el consentiment de les entitats titulars dels actius i la coordinació amb prevenció i representació laboral.

---

## 3. Innovació i valor per a Barcelona

### Què ens fa diferents? (innovació i valor diferencial)

1. **Mesura conductual més enllà de l'enquesta.** El PVT-BA aporta una senyal breu sobre vigilància psicomotora. Els qüestionaris continuen sent necessaris, però deixen de ser l'única font.
2. **Alta freqüència amb baixa càrrega.** El check-in ordinari es completa aproximadament en dos o tres minuts, una vegada per jornada laboral.
3. **Doble retorn sense vigilància individual.** La persona veu la seva evolució privada; l'organització només veu agregats K ≥ 5.
4. **Privacitat separada de l'adherència.** L'Ajuntament conserva la relació entre codi i participant per a invitacions i recordatoris. PulsePath no rep noms ni correus. L'estat de completitud es manté separat dels resultats.
5. **Disseny no clínic i preventiu.** No diagnostica, no determina aptituds, no puntua el rendiment i no genera alertes individuals a comandaments.
6. **Desplegament lleuger.** És una PWA: funciona en navegador mòbil, sense sensors, wearables, obra ni instal·lació corporativa complexa.
7. **Experimentació mesurable.** La proposta defineix prèviament hipòtesis, gates, indicadors, riscos, retenció i criteris de finalització.

La innovació no és afirmar que una fórmula pròpia ja prediu el burnout. L'element diferencial és integrar mesura conductual, autoinforme validat, privacitat per disseny i retorn agregat en un protocol operatiu verificable.

### Encaix amb Barcelona

La contribució operativa als plans municipals seria:

- provar una eina de detecció precoç i seguiment agregat coherent amb l'Acord de ciutat per cuidar la salut mental a la feina;
- generar evidència sobre adherència i confiança en equips de Serveis Socials i Atenció Ciutadana, on el burnout i el treball emocional estan especialment documentats;
- aportar indicadors complementaris, no substitutius, al Servei de Prevenció de Riscos Laborals;
- identificar si els patrons de fatiga i malestar varien segons context d'atenció, franja o tipus d'equip;
- oferir retorn privat i recursos oficials a les persones participants;
- produir una metodologia i una memòria agregada reutilitzables en altres organismes.

### Potencial de creixement

La solució es pot reproduir en altres serveis municipals, ens públics i organitzacions amb equips d'atenció o torns. L'escalabilitat deriva de:

- accés web multiplataforma;
- codis pseudònims i configuració per organització;
- instruments i calendari parametrizables;
- infraestructura de baix cost i desplegable en entorns europeus;
- informes i quadres de comandament per segments amb supressió automàtica K ≥ 5;
- absència d'equipament físic.

Qualsevol ampliació es faria per fases. La prova amb 50 persones no justificaria per si sola una generalització a tota la plantilla ni un model predictiu de producció.

---

## 4. El pla d'acció (com es farà la prova)

### Metodologia

La prova serà un estudi pilot observacional i preventiu, no un assaig clínic.

**Població**

- 50 persones treballadores municipals voluntàries.
- Col·lectiu prioritari: **Serveis Socials i Atenció Ciutadana**.
- Cap resultat individual serà accessible a comandaments, recursos humans o altres participants.

**Recorregut de participació**

1. L'Ajuntament, amb el consentiment de les entitats titulars, selecciona els equips, designa una persona coordinadora i conserva de manera separada la relació codi-participant.
2. Cada persona rep un codi pseudònim i la informació de participació.
3. Abans de recollir dades, la persona llegeix i accepta un consentiment informat versionat.
4. Una vegada per jornada laboral, en una franja pactada, completa KSS + PVT-BA i un context mínim.
5. A l'inici, setmana 4 i setmana 8 completa DASS-21, GAD-7 i CBI (aproximadament 8-12 minuts).
6. Rep retorn privat, no diagnòstic, sobre la seva pròpia tendència i recomanacions generals.
7. El quadre de comandament calcula únicament agregats de grups amb cinc o més persones.
8. PulsePath lliura informes periòdics (art. 14.3) i, en acabar, la memòria final (art. 18), a més d'un taller de retorn.

**Protocol davant puntuacions elevades**

La persona rep un avís privat, una explicació que el resultat no és un diagnòstic i recursos sanitaris o municipals oficials. No s'envia cap alerta nominativa a l'organització. PulsePath no és un servei d'emergència.

**Governança de dades**

- El codi és un pseudònim; no s'afirmarà que les dades crues són anònimes.
- PulsePath no rep nom, correu ni identificador laboral.
- Les dades viatgen xifrades (HTTPS) i es guarden xifrades en repòs (AES-256-GCM) en una infraestructura acordada. **Per precisió tècnica: no es tracta d'un xifrat d'extrem a extrem.** PulsePath opera la infraestructura i, com a tal, té capacitat tècnica de desxifrar les dades per prestar el servei. No s'afirma en cap cas que les dades no surtin del dispositiu ni que el promotor no hi pugui accedir; el que es garanteix és el control d'accés, la minimització, la limitació de finalitat i la separació respecte de l'organització.
- L'Ajuntament conserva la taula codi-persona només per a coordinació i recordatoris.
- Els resultats organitzatius s'oculten si el segment té menys de cinc persones úniques, i es limitarà el nombre de dimensions que es poden creuar simultàniament per evitar la reidentificació per diferència entre consultes.
- La reutilització per a recerca o millora de models requerirà un consentiment separat i no condicionarà la participació.
- Les dades pseudonimitzades s'eliminaran com a màxim sis mesos després de la memòria final. Només es podran conservar resultats irreversiblement agregats.
- Abans de començar es farà una revisió jurídica especialitzada, es definiran els rols RGPD, l'acord de tractament i l'anàlisi de riscos, i **es realitzarà una avaluació d'impacte relativa a la protecció de dades (art. 35 RGPD)**, que es considera exigible atès el tractament sistemàtic de dades de salut de persones treballadores amb una tecnologia nova.

**Seguiment, control i memòria final (arts. 14.3 i 18)**

El promotor reconeix expressament i assumeix les obligacions següents:

1. **Informes periòdics de seguiment** (art. 14.3), amb la periodicitat que fixi el conveni (es proposa periodicitat quinzenal durant les 8 setmanes), incloent-hi com a mínim:
   - estat d'execució respecte al pla previst;
   - incidències tècniques o operatives detectades;
   - verificació objectiva de les dades preliminars de resultats i del grau de consecució dels indicadors clau de rendiment;
   - propostes de millora o reajustament;
   - informació sobre taxes o preu públic, si n'hi hagués (en aquesta proposta no se'n preveuen).
2. **Comunicació immediata** de qualsevol incidència rellevant (art. 14.2).
3. **Memòria final completa** (art. 18), tant si la prova s'executa del tot com si acaba de manera anticipada, amb els continguts mínims de l'article 18.2 (descripció d'execució, avaluació d'impacte, grau d'assoliment d'objectius, escalabilitat, bones pràctiques i aprenentatges transferibles).
4. Col·laboració amb les inspeccions, requeriments d'informació i instruccions de l'Ajuntament o de l'entitat gestora (art. 14.1).

### Cronograma i fases d'execució

**Preparació prèvia (2-4 setmanes després del conveni)**

- consentiment exprés de les entitats titulars dels actius (art. 3.3);
- designació de responsable municipal i persona coordinadora;
- selecció d'equips i comunicació interna;
- informació i, si escau, consulta al Comitè de Seguretat i Salut Laboral i a la representació sindical;
- revisió jurídica, protecció de dades i seguretat;
- configuració de l'entorn, codis, idioma i segments;
- configuració i verificació del **calendari d'avaluacions** (inici, setmana 4 i setmana 8) a l'entorn de la prova;
- verificació final de compatibilitat, sincronització, supressió, K ≥ 5, prova de restauració completa de còpia de seguretat i protocol d'incidències;
- formació i protocol d'incidències.

**Setmana 1**

- sessió informativa i activació;
- consentiment;
- avaluació inicial DASS-21 + GAD-7 + CBI;
- inici de check-ins;
- cohort sentinella per verificar sincronització, suport i supressió K.

**Setmana 2**

- primer gate: continuïtat només si no hi ha incidents crítics i el flux és estable;
- ajustos de comunicació i usabilitat;
- primer informe periòdic de seguiment (art. 14.3).

**Setmanes 3-4**

- operació ordinària;
- seguiment de l'adherència per part de la persona coordinadora, sense accés a puntuacions;
- informe periòdic;
- avaluació intermèdia a la setmana 4.

**Setmanes 5-7**

- continuació dels check-ins;
- informes periòdics;
- revisió qualitativa amb representants municipals.

**Setmana 8 i tancament**

- avaluació final;
- enquesta d'utilitat i confiança;
- anàlisi agregada;
- memòria final (art. 18) i taller de retorn;
- acord sobre eliminació, conservació agregada i possibles passos posteriors.

### Actius necessaris

D'acord amb l'article 3.3 i l'article 4.8 de l'Ordenança, els actius sol·licitats no són espai públic ni infraestructures físiques urbanes, sinó **recursos humans i organitzatius municipals**: persones treballadores voluntàries i centres de treball digitals/híbrids on aquestes persones desenvolupen la seva activitat.

**Actiu principal sol·licitat**

- Participació voluntària de fins a **50 persones treballadores** del col·lectiu de **Serveis Socials i Atenció Ciutadana**.
- Justificació d'idoneïtat: en aquests serveis el treball emocional, l'atenció directa i el risc de burnout estan especialment documentats; el Copenhagen Burnout Inventory hi té un encaix substantiu; i la prova pot aportar aprenentatge útil per a polítiques municipals de salut mental a la feina sense interferir en l'atenció a la ciutadania.

**Entitats titulars el consentiment de les quals es requereix (art. 3.3)**

L'ús d'aquests actius exigeix el **consentiment exprés** de l'entitat titular. Es proposa canalitzar-lo, com a mínim, a través de:

1. **Per a Serveis Socials:**  
   - **Gerència de l'Institut Municipal de Serveis Socials (IMSS)**, com a entitat instrumental titular de l'organització del personal dels serveis socials municipals; i/o  
   - **Gerència d'Àrea de Drets Socials, Salut, Cooperació i Comunitat**, com a àrea de direcció superior de les polítiques corporatives del mateix àmbit.
2. **Per a Atenció Ciutadana (OAC / canals d'informació i atenció):**  
   - **Direcció de Serveis d'Informació i Atenció Ciutadana**, dependent de la **Gerència de Serveis Generals** (Gerència d'Àrea d'Economia, Recursos i Transformació Digital).

La identificació exacta de l'òrgan signant del consentiment es concretarà amb l'entitat gestora dels espais d'experimentació i amb els serveis municipals competents durant la tramitació. Aquesta proposta **no presumeix** que el consentiment ja s'hagi atorgat.

**Aportació municipal sol·licitada (càrrega operativa limitada)**

- designació d'**una persona coordinadora** interna;
- distribució d'invitacions i recordatoris a través dels canals interns;
- implicació puntual de Persones/Recursos Humans, Prevenció de Riscos Laborals i Protecció de Dades;
- **participació informativa / consulta** del **Comitè de Seguretat i Salut Laboral** i de la **representació sindical**, d'acord amb el marc de prevenció de riscos i de participació laboral aplicable;
- aproximadament 2-3 minuts dins de la jornada per al check-in i 8-12 minuts en tres fites;
- espai virtual o físic per a la sessió inicial i el taller final.

**Aportació de PulsePath**

- ús sense cost de llicència durant la prova;
- configuració, suport, infraestructura i manteniment;
- aplicació, quadre de comandament, informes periòdics, memòria final i taller;
- dedicació del responsable del projecte superior a 20 hores setmanals durant la prova.

No es demanen dades de recursos humans, historials clínics, baixes, productivitat individual ni accés a sistemes municipals de gestió interna.

**Clàusula de tope econòmic (art. 13.4)**

L'article 13.4 estableix que, llevat de motius d'interès públic prou justificats, l'entitat promotora ha d'assumir les despeses directes i indirectes que l'execució del projecte pugui ocasionar als serveis municipals, i que aquesta previsió ha de constar en el conveni amb criteris de proporcionalitat i sostenibilitat econòmica.

Atès que el promotor és una **persona física sense finançament dinerari específic** per a aquesta prova, es proposa incloure en el conveni una clàusula amb el contingut següent:

1. **Límit econòmic màxim acordat:** les eventuals despeses municipals repercutibles al promotor no excediran de **`{{TOPALL_COSTOS_MUNICIPALS_EUR}}` euros**, import a fixar de mutu acord en la fase de negociació del conveni.
2. **Disseny de cost gairebé nul per a l'Ajuntament:** la prova està concebuda per no generar cost material municipal perquè:
   - no hi ha desplegament físic ni ocupació de via pública;
   - no hi ha obra civil ni adequació d'espais;
   - no s'utilitza infraestructura tecnològica municipal (servidors, sensors, xarxes pròpies);
   - no hi ha llicència de programari a càrrec de l'Ajuntament;
   - la càrrega operativa municipal es limita a designar una persona coordinadora, distribuir invitacions/recordatoris i participar en les sessions de coordinació i tancament.
3. **Exclusions del tope:** el límit no minorarà la responsabilitat del promotor davant de terceres persones per danys (art. 21), ni substituirà les obligacions de protecció de dades o de reparació davant d'incidents imputables al promotor.
4. **Interès públic i proporcionalitat:** si l'Ajuntament considerés que hi ha motius d'interès públic per assumir alguna despesa, caldria fer-ho explícit al conveni, d'acord amb l'article 13.4.

### Necessitats tècniques i adequació

- telèfon o ordinador amb navegador modern i connexió a internet;
- infraestructura web de PulsePath amb HTTPS, xifrat en trànsit i en repòs, còpies de seguretat i control d'accés;
- interfície en català i castellà abans de l'inici;
- cap sensor, wearable, càmera, micròfon, geolocalització o accés a altres aplicacions;
- cap obra civil, intervenció física ni afectació de l'espai públic;
- suport remot i canal d'incidències;
- validació prèvia de compatibilitat i latència en una mostra de dispositius.

---

## 5. Viabilitat i convivència a la ciutat

### Capacitat d'execució

Max Borra Palau serà el responsable únic de PulsePath i dedicarà més de 20 hores setmanals a l'operació. Té experiència en desenvolupament de negoci i captació d'oportunitats i disposa del suport d'entorn d'ESIC i de la comunitat 1517. Aquestes xarxes no es presenten com a membres de l'equip ni com a avalistes.

La tecnologia disposa de l'inventari funcional descrit a l'apartat de maduresa, del preflight amb voluntariat extern i de gates de producció (HTTPS, còpia i restauració, monitoratge, pla d'incidències, consentiment i cohort sentinella).

El principal risc de capacitat és la dependència d'una sola persona. Es mitigarà amb documentació operativa, automatització de còpies i monitoratge, calendari de suport, persona coordinadora municipal i criteri de pausa davant una incidència crítica.

**Flexibilització normativa.** No se sol·licita una exempció de la normativa laboral, sanitària, de seguretat o de protecció de dades. La prova es planteja com a **banc de proves / experimentació digital controlada** dins del marc ordinari de l'Ordenança, sense ocupació de via pública ni alteració de serveis. Les qüestions a concretar al conveni són els rols RGPD, l'acord de tractament, la base i forma del consentiment, el consentiment de les entitats titulars dels actius, la consulta a Prevenció i representació laboral, el tope de costos de l'article 13.4 i el règim de responsabilitat de l'article 21.

Max presenta com a persona física i assumirà una revisió jurídica especialitzada abans de recollir dades.

### Integració urbana

La prova és digital, voluntària i de baixa intensitat. Es realitzarà dins d'una franja pactada, sense alterar torns, funcions, retribució, avaluació ni prestació de serveis a la ciutadania. Una persona pot abandonar en qualsevol moment sense conseqüències.

Els informes no identificaran equips quan la combinació de filtres pugui reduir el grup per sota de K = 5. No es publicaran rànquings d'equips ni s'utilitzaran puntuacions per comparar rendiment.

### Seguretat i prevenció

| Risc | Mesura de mitigació |
|---|---|
| Percepció de vigilància | comunicació clara, voluntarietat, retorn privat i prohibició d'ús individual |
| Reidentificació | pseudonimització, separació de la taula codi-persona, K ≥ 5 i limitació de filtres |
| Bretxa de dades | xifrat, mínim privilegi, secrets fora del codi, còpies, logs i pla d'incident |
| Puntuació alta de malestar | avís privat no diagnòstic i derivació a recursos oficials, sense alerta a RRHH |
| Baixa adherència | temps dins de jornada, recordatoris no invasius, coordinació i monitoratge de completitud separat |
| Biaix de mostra o gènere | reclutament divers, anàlisi d'abandonament i interpretació no generalitzable |
| Errors o indisponibilitat | preflight, cohort sentinella, monitoratge, reintents, còpia/restauració i possibilitat de pausa |
| Latència entre dispositius | prova prèvia, registre de context tècnic mínim i anàlisi de sensibilitat |
| Interpretació clínica o causal | etiquetatge exploratori, documentació de limitacions i revisió humana |
| Ús secundari no esperat | consentiment separat i dret a participar sense autoritzar ML |
| Classificació errònia com a IA prohibida | exclusió per definició (no es tracten dades biomètriques, art. 3(39) i 3(34)); autoinforme en lloc d'inferència; fatiga exclosa pel considerant 18; documentació algorítmica lliurada a l'Ajuntament |
| Lectura adversa de l'annex III, punt 4(b) | criteri de finalitat prevista (art. 6(2)): l'ocupador no rep cap resultat individual; K ≥ 5 per persones úniques; prohibició contractual d'ús avaluatiu, disciplinari o d'aptitud |

D'acord amb l'article 21, la responsabilitat directa pels danys o perjudicis derivats de l'execució de la prova correspon al promotor. L'Ajuntament queda indemne en els termes de l'Ordenança i del conveni, sens perjudici de les obligacions sectorials aplicables.

---

## 6. Coneixement compartit i retorn a la ciutat

### Compromís amb la diversitat i inclusió

- Reclutament voluntari que procuri diversitat de gènere, edat, funció, torn i competència digital, d'acord amb la composició real dels equips.
- Aplicació en català i castellà, llenguatge clar i recorregut accessible des de mòbil o ordinador.
- Cap exclusió per no voler instal·lar una app nativa: es podrà utilitzar des del navegador.
- Seguiment de diferències d'activació i abandonament, sempre que els grups compleixin K ≥ 5.
- Absència de penalització per no participar o abandonar.
- La composició unipersonal actual de PulsePath es declararà amb transparència; la perspectiva d'inclusió s'incorporarà mitjançant el protocol, la revisió municipal i el feedback de les persones participants.

### Criteris socioambientals i d'impacte de gènere

La prova és digital i no requereix desplaçaments addicionals, equipament nou ni intervencions físiques. Es prioritzarà infraestructura proporcionada a l'escala de 50 persones, minimització de dades i retenció limitada. El projecte es dissenya per complir el principi DNSH (no causar un perjudici significatiu al medi ambient).

L'anàlisi explorarà diferències d'adherència i tendència per gènere i altres variables només quan hi hagi consentiment, necessitat analítica i grups prou grans. No s'inferirà el gènere i s'inclouran opcions inclusives. Els resultats no s'utilitzaran per atribuir diferències a característiques personals sense considerar torns, càrrega, cures i altres determinants socials.

### Valor públic i retorn social

La prova deixarà:

- una metodologia documentada per a pilots digitals de benestar laboral amb privacitat K ≥ 5;
- evidència d'adherència, acceptabilitat i limitacions en Serveis Socials i Atenció Ciutadana;
- recomanacions pràctiques per a la detecció preventiva i la comunicació interna;
- una memòria de resultats agregats i un taller de transferència;
- un protocol de governança, consentiment, retenció i resposta davant puntuacions elevades;
- criteris per decidir amb evidència si cal aturar, adaptar, ampliar o descartar la solució.

Es podran publicar metodologia, indicadors i resultats agregats acordats amb l'Ajuntament. El codi, els models i la propietat intel·lectual de PulsePath es mantindran com a actius propis, sens perjudici del retorn públic d'informació previst a l'article 17. No es publicarà cap dada individual.

### Aprenentatge normatiu i millora de la gestió

La prova pot generar aprenentatges sobre:

- com coordinar Innovació, Persones, Prevenció, Protecció de Dades, Comitè de Seguretat i Salut i representació sindical en una eina preventiva;
- quina separació és necessària entre adherència, resultats individuals i informació organitzativa;
- quins criteris mínims hauria de complir una eina digital no clínica abans d'utilitzar-se amb personal públic;
- com aplicar K-anonimitat i minimització en equips petits;
- quin consentiment i quin protocol de retorn generen confiança;
- quan un indicador freqüent complementa —i quan no— les avaluacions reglamentàries;
- com documentar l'encaix d'una eina de benestar amb el Protocol de sistemes algorítmics i amb l'AI Act sense caure en usos prohibits.

L'objectiu no és flexibilitzar obligacions, sinó provar un marc supervisat que les compleixi i que pugui informar futurs procediments municipals (art. 20).

### Indicadors clau (KPI)

**Adopció i adherència**

- 50 persones convidades.
- Activació: objectiu ≥ 90%.
- Check-ins completats sobre els programats: gate de viabilitat ≥ 70%.
- Avaluacions DASS-21 + GAD-7 + CBI completes a inici, setmana 4 i setmana 8: ≥ 80%.
- Abandonament i motius, sense penalització.

**Qualitat tècnica**

- Preflight extern completat abans d'activar participants municipals, amb 0 incidents crítics oberts i 100% de les proves de supressió i K ≥ 5 superades.
- Sincronitzacions correctes: ≥ 98%.
- Disponibilitat del servei durant franges pactades: ≥ 99%.
- Aplicació automàtica de K ≥ 5: 100% dels resultats organitzatius.
- Incidents crítics de privacitat o seguretat: 0.
- Exercicis de dret de supressió resolts dins del termini pactat: 100%.

**Utilitat i confiança**

- Participants que consideren útil o comprensible el retorn privat: ≥ 75%.
- Participants que entenen que RRHH no veu resultats individuals: ≥ 80%.
- Interlocutors municipals que consideren útils el quadre i els informes per a converses preventives: ≥ 75%.

**Evidència exploratòria**

- Capacitat d'observar tendències temporals i diferències agregades entre contextos, sense objectiu de significació clínica.
- Associació exploratòria entre mètriques PVT-BA/KSS i DASS-21/GAD-7/CBI.
- Rendiment d'un baseline estadístic amb validació deixant una persona fora, reportat només si el volum i la qualitat són suficients.

**Retorn i compliment formal**

- Informes periòdics de seguiment conforme a l'article 14.3.
- Memòria final conforme a l'article 18.
- Un taller de transferència.
- Documentació de limitacions, incidents, biaixos i decisió final: ampliar, adaptar, repetir o aturar.

---

## Referències públiques

- Ajuntament de Barcelona. *Ordenança dels espais d'experimentació de Barcelona* (aprovada el 27 de març de 2026).
- Ajuntament de Barcelona. Protocol «Definició de metodologies de treball i protocols per a la implementació de sistemes algorítmics» (Comissió de Govern, 15 de desembre de 2022 / referència ordinamental 2 de gener de 2023).
- Reglament (UE) 2024/1689 del Parlament Europeu i del Consell (AI Act), especialment art. 3(1), 3(34), 3(39), 4, 5(1)(f), 6(2), 6(3), 26(7), 50, considerants 12 i 18, i annex III, punts 1(c) i 4(b).
- Reglament (UE) 2026/1744, pel qual es modifica el Reglament (UE) 2024/1689 («Digital Omnibus» sobre IA), DOUE de 24 de juliol de 2026, en vigor des del 27 de juliol de 2026.
- Reglament (UE) 2016/679 (RGPD), especialment art. 9 i 35.
- Ajuntament de Barcelona. *II Pla de Salut Mental de Barcelona 2023-2030*.
- Ajuntament de Barcelona. *Acord de ciutat per cuidar la salut mental a la feina*.
- Ajuntament de Barcelona. *Pla per a la reducció de l'absentisme del personal de l'Ajuntament de Barcelona i ens adherits a l'Acord de condicions* (2026).
- Ajuntament de Barcelona. *Agenda 2030 de Barcelona*.
- Basner M. et al. Publicacions sobre PVT-B i PVT-BA. La referència al paradigma no implica validació de la implementació de PulsePath.

## Evidència visual i demo

1. Aplicació de participant: accés mitjançant codi pseudònim i consentiment previ.
2. Quadre de comandament: vista agregada amb supressió K ≥ 5. Si es mostren captures amb dades, cal identificar-les com a sintètiques o de demostració.
3. Demo operativa: `{{URL_DEMO}}` amb `{{CREDENCIALS_AVALUADOR}}`.

---

## Annex A — Declaracions responsables (art. 10.3.b)

Les sis declaracions responsables exigides per l'article 10.3.b es presenten com a documents independents a:

1. `declaracions/01-proteccio-dades.md`
2. `declaracions/02-dnsh-sostenibilitat.md`
3. `declaracions/03-principis-etics-igualtat.md`
4. `declaracions/04-seguretat-persones-infraestructures.md`
5. `declaracions/05-condicions-ordenanca.md`
6. `declaracions/06-protocol-sistemes-algoritmics.md`

## Annex B — Marcadors pendents d'emplenar abans de presentar

| Marcador | Contingut esperat |
|---|---|
| `{{DATA_DOCUMENT}}` | Data de presentació (agost o setembre de 2026) |
| `{{N_PARTICIPANTS_PREFLIGHT}}` | Nombre real de voluntaris del preflight (objectiu **30** externs; durada 7–14 dies) |
| `{{DIES_PREFLIGHT}}` | Dies reals de durada (objectiu 7-14) |
| `{{ADHERENCIA_DIARIA}}` | Percentatge o ràtio d'adherència diària observada |
| `{{TASA_ABANDONO}}` | Taxa d'abandonament del preflight |
| `{{INCIDENTS_CRITICS_PREFLIGHT}}` | Nombre d'incidents crítics oberts en tancar |
| `{{DATA_INICI_PREFLIGHT}}` | Data d'inici del preflight |
| `{{DATA_FI_PREFLIGHT}}` | Data de fi del preflight |
| `{{URL_DEMO}}` | URL pública de demo (prevista: https://app.getpulsepath.com) |
| `{{CREDENCIALS_AVALUADOR}}` | Usuari/contrasenya o codi per a la persona avaluadora |
| `{{TOPALL_COSTOS_MUNICIPALS_EUR}}` | Límit econòmic màxim a acordar al conveni (art. 13.4) |

**No inventar cap xifra.** Si un marcador encara no té valor verificable, cal mantenir-lo visible o ajornar la presentació fins a disposar-ne.
