# Checklist de compliment de l'Ordenança dels espais d'experimentació

**Projecte:** PulsePath  
**Expedient / tràmit:** 20260001771  
**Objectiu d'aquest document:** verificar, un per un, els requisits de l'article 10.3 i els criteris d'elegibilitat de l'article 12.2.a, i indicar on queden coberts a l'expedient markdown.  
**Data de revisió:** {{DATA_DOCUMENT}}

Llegenda d'estat:

| Estat | Significat |
|---|---|
| Cobert | Contingut redactat a l'expedient |
| Parcial | Redactat, però depèn d'un fet extern o d'un marcador pendent |
| Pendent extern | No es pot completar només amb redacció; cal un acte o model municipal / dada real |

---

## A. Article 10.3 — Contingut mínim de la sol·licitud d'accés

| # | Requisit (art. 10.3) | Estat | On queda cobert |
|---|---|---|---|
| A1 | **10.3.a** Fitxa tècnica del projecte amb descripció funcional de la prova | Cobert | `proposta-pulsepath-contingut.md` → §1 Descripció |
| A2 | **10.3.a** Objectius | Cobert | `proposta-pulsepath-contingut.md` → §1 Objectius de la prova |
| A3 | **10.3.a** Metodologia | Cobert | `proposta-pulsepath-contingut.md` → §4 Metodologia |
| A4 | **10.3.a** Nivell de maduresa tecnològica | Parcial | `proposta-pulsepath-contingut.md` → §2 Nivell de maduresa tecnològica (TRL 6 amb marcadors `{{...}}` del preflight pendents d'emplenar) |
| A5 | **10.3.a** Proposta de calendari | Cobert | `proposta-pulsepath-contingut.md` → §2 Durada prevista + §4 Cronograma |
| A6 | **10.3.a** Ubicació | Cobert | Centres de treball digitals/híbrids de Serveis Socials i Atenció Ciutadana; prova digital sense via pública (`§4 Actius necessaris` i `§4 Necessitats tècniques`) |
| A7 | **10.3.a** Recursos necessaris | Cobert | `proposta-pulsepath-contingut.md` → §4 Actius necessaris |
| A8 | **10.3.b.1** Declaració responsable — protecció de dades | Cobert | `declaracions/01-proteccio-dades.md` |
| A9 | **10.3.b.2** Declaració responsable — DNSH i sostenibilitat | Cobert | `declaracions/02-dnsh-sostenibilitat.md` |
| A10 | **10.3.b.3** Declaració responsable — principis ètics, impacte social i igualtat de gènere | Cobert | `declaracions/03-principis-etics-igualtat.md` |
| A11 | **10.3.b.4** Declaració responsable — seguretat de persones, infraestructures i entorn urbà | Cobert | `declaracions/04-seguretat-persones-infraestructures.md` |
| A12 | **10.3.b.5** Declaració responsable — condicions de l'ordenança | Cobert | `declaracions/05-condicions-ordenanca.md` |
| A13 | **10.3.b.6** Declaració responsable — Protocol de sistemes algorítmics | Cobert | `declaracions/06-protocol-sistemes-algoritmics.md` + `proposta-pulsepath-contingut.md` → §2 Compliment algorítmic |
| A14 | **10.3 in fine** Ajustament de les declaracions als models aprovats per decret | Pendent extern | Verificat 2026-08-09: **no hi ha models oficials publicats** (vegeu `MODELOS_DECLARACION.md`). Les 6 declaracions de `declaracions/` es mantenen com a redacció substancial provisional; cal migrar si es publica el decret |
| A15 | **10.3.c** Acreditació de la personalitat jurídica de l'entitat sol·licitant | Parcial | Promotor = persona física. Cal adjuntar còpia de DNI/NIE o document identificatiu al tràmit electrònic (no és un markdown de contingut tècnic). No hi ha societat mercantil |

---

## B. Article 12.2.a — Criteris d'elegibilitat

| # | Criteri d'elegibilitat (art. 12.2.a) | Estat | On queda cobert |
|---|---|---|---|
| B1 | Valor afegit de la prova i coherència amb objectius estratègics municipals | Cobert | `§2 Coherència amb els objectius estratègics municipals` + `§3 Encaix amb Barcelona` |
| B2 | Durada prevista d'acord amb els límits temporals de l'Ordenança | Cobert | `§2 Durada prevista` (8 setmanes + 2-4 de preparació ≪ 24 mesos, art. 13.5) |
| B3 | Nivell de maduresa tecnològica TRL 5 o superior | Parcial | `§2 Nivell de maduresa tecnològica` declara TRL 6; cal emplenar marcadors del preflight abans de presentar |
| B4 | Protecció dels drets de les persones, la seguretat i l'entorn | Cobert | `§4 Metodologia (governança de dades)` + `§5 Seguretat i prevenció` + `declaracions/01` i `04` |
| B5 | Conformitat amb principis ètics, socials, d'igualtat de gènere i ambientals | Cobert | `§6 Compromís amb la diversitat i inclusió` + `§6 Criteris socioambientals...` + `declaracions/02` i `03` |
| B6 | Sostenibilitat i respecte als drets de la natura / principi DNSH | Cobert | `§6 Criteris socioambientals...` + `declaracions/02-dnsh-sostenibilitat.md` |
| B7 | Compliment del Protocol de sistemes algorítmics | Cobert | `§2 Compliment algorítmic` + `declaracions/06-protocol-sistemes-algoritmics.md` |
| B8 | Generació de valor públic | Cobert | `§6 Valor públic i retorn social` |
| B9 | Retorn social previst | Cobert | `§6 Valor públic i retorn social` + `§6 Aprenentatge normatiu...` + compromís de memòria final (art. 18) |

---

## C. Altres articles crítics coberts expressament (no són 10.3 / 12.2.a, però van motivar el rebuig o el risc de rebuig)

| # | Requisit | Estat | On queda cobert |
|---|---|---|---|
| C1 | **Art. 3.3** Consentiment exprés de l'entitat titular del recurs / actiu | Parcial | `§4 Actius necessaris` identifica IMSS / Gerència d'Àrea de Drets Socials i Direcció / Gerència d'Atenció Ciutadana. El consentiment encara s'ha d'obtenir en tramitació |
| C2 | **Art. 13.4** Assumpció de costos municipals + proporcionalitat | Parcial | `§4 Actius necessaris` — clàusula de tope econòmic amb `{{TOPALL_COSTOS_MUNICIPALS_EUR}}` |
| C3 | **Art. 13.5** Durada màxima 24 mesos | Cobert | `§2 Durada prevista` |
| C4 | **Art. 14.2** Comunicació immediata d'incidències | Cobert | `§4 Metodologia` + `declaracions/04` i `05` |
| C5 | **Art. 14.3** Informes periòdics de seguiment | Cobert | `§4 Metodologia — Seguiment, control i memòria final` + KPI de retorn |
| C6 | **Art. 18** Memòria final | Cobert | `§4 Metodologia — Seguiment, control i memòria final` + `declaracions/05` |
| C7 | **Art. 21** Responsabilitat del promotor | Cobert | `§5 Seguretat i prevenció` + `declaracions/04` |
| C8 | Participació del Comitè de Seguretat i Salut i representació sindical | Cobert (com a compromís de procés) | `§4 Actius necessaris` |

---

## D. Accions obligatòries abans de tornar a presentar

1. Emplenar tots els marcadors `{{...}}` de l'Annex B de la proposta i de les declaracions (dades personals del declarant + resultats del preflight + demo + tope econòmic).
2. Verificar si la Comissió de Govern ha aprovat models oficials de declaració responsable (estat actual: **no localitzats**; vegeu `MODELOS_DECLARACION.md`); si existeixen, substituir els markdowns de `declaracions/` pel model oficial emplenat.
3. Adjuntar acreditació d'identitat del promotor persona física (art. 10.3.c).
4. Confirmar amb l'entitat gestora (BIT Habitat / finestreta única) el canal per formalitzar el consentiment de les entitats titulars (art. 3.3): no cal que estigui signat abans de l'avaluació preliminar, però sí que la proposta l'identifiqui i el sol·liciti.
5. No inventar xifres del preflight: si el preflight encara no s'ha tancat, mantenir TRL amb evidència real disponible o ajornar la presentació fins a tenir les mètriques.

---

## E. Conclusió operativa

L'expedient markdown cobreix **tots els apartats formals de l'article 10.3.a-b i els criteris 12.2.a en redacció**. Els únics punts que poden tornar a bloquejar l'acceptació no són de contingut narratiu, sinó d'execució externa:

- models oficials de declaració (si ja existeixen i no s'utilitzen);
- acreditació d'identitat del promotor;
- marcadors del preflight / demo sense emplenar;
- consentiment posterior de les gerències titulars dels actius.
