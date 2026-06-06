(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();const ht={name:"PulsePath"},bt={home:"Inici",history:"Historial"},yt={title:"Benvingut/da a PulsePath",consent_title:"Consentiment informat per al tractament de dades",consent_body:`En virtut del Reglament (UE) 2016/679 (RGPD) i de la Llei orgànica 3/2018, de 5 de desembre, de protecció de dades personals i garantia dels drets digitals (LOPDGDD), l'organització promotora del programa PulsePath us informa del següent:

1. Responsable del tractament: l'organització empleadora participant en el programa pilot (en el cas del pilot, l'Ajuntament de Barcelona), amb suport tècnic del proveïdor del servei PulsePath.

2. Finalitat: avaluar factors de risc psicosocial i cognitiu relacionats amb la salut laboral, dins del marc de la prevenció de riscos laborals (Llei 31/1995 de prevenció de riscos laborals). Els resultats s'agreguen de forma anònima per departament i torn; no es poden identificar persones individuals.

3. Dades que es tracten: índexs numèrics derivats dels tests cognitius (PVT-B, Stroop, CBI) i dades declaratives del micro-check-in (hores de son, nivell d'estrès, consum d'estimulants), juntament amb metadades anònimes (departament i torn). No es recullen dades biomètriques en brut, temps de reacció individuals, respostes literals del CBI, adreça IP, nom, correu electrònic ni cap altre dada que permeti la vostra identificació directa.

4. Processament al dispositiu (Edge AI): els tests cognitius s'executen íntegrament al vostre dispositiu. Els càlculs es realitzen localment abans de transmetre's només els índexs agregats al servidor, ubicat a la Unió Europea.

5. Base jurídica: interès legítim de l'empresa en matèria de prevenció de riscos laborals i protecció de la salut dels treballadors (art. 6.1.f RGPD), així com el compliment d'obligacions legals en matèria de PRL.

6. Conservació: les dades s'emmagatzemen durant la vigència del programa pilot i un període addicional de dotze (12) mesos posterior a la seva finalització, després del qual seran suprimides de forma irreversible.

7. Destinataris: personal autoritzat de prevenció de riscos laborals i recursos humans de l'organització, exclusivament en format agregat i amb garanties de K-anonimitat (grups mínims de cinc persones). No es cediran dades a tercers excepte obligació legal.

8. Drets: podeu exercir els drets d'accés, rectificació, supressió, limitació del tractament, oposició i portabilitat mitjançant sol·licitud a l'oficina de prevenció de riscos laborals de la vostra organització. També teniu dret a presentar una reclamació davant l'Autoritat Catalana de Protecció de Dades (APDCAT).

9. Revocació: podeu retirar el consentiment en qualsevol moment des de l'aplicació o sol·licitant la supressió de les vostres dades. La revocació no afecta la licitud del tractament efectuat anteriorment.

En prémer «Accepto i continuo», declareu haver llegit i comprès la informació anterior i consentiu el tractament de les dades descrites exclusivament per a les finalitats indicades.`,code_label:"Codi d'accés anònim",code_placeholder:"Ex.: BCN-2026-A007",submit:"Accepto i continuo",language_label:"Idioma",right_to_delete:"Dret de supressió (RGPD)",delete_confirm:"Segur que vols eliminar totes les teves dades? Aquesta acció és irreversible."},_t={title:"El teu estat d'avui",test_pending:"Tens un test pendent per avui",test_done:"Has completat el test d'avui",start_test:"Començar test",cbi_pending:"Tens el qüestionari setmanal pendent",continue_weekly:"Continuar test setmanal",risk_low:"Risc baix",risk_medium:"Risc moderat",risk_high:"Risc alt",daily_reminder:"Completa el teu check-in diari",cbi_reminder:"Completa el qüestionari setmanal CBI"},vt={sleep_label:"Quantes hores has dormit la darrera nit?",stress_label:"Com valores el teu nivell d'estrès avui?",stimulants_label:"Has consumit estimulants (cafèina, energètiques) en les darreres 6 hores?",continue:"Continuar",cbi_step:"Qüestionari CBI setmanal"},wt={instruction:"Quan aparegui el cercle verd, toqueu la pantalla el més ràpid possible. No toqueu abans que aparegui.",wait:"Espereu…",tap:"Toca ara!",progress:"{current} de {total}",false_start:"Massa aviat! Espereu el senyal verd.",done:"Test PVT completat"},kt={instruction:"Seleccioneu el color de la tinta de la paraula, no el significat de la paraula.",progress:"{current} / {total}",done:"Test Stroop completat"},St={instruction:"Indiqueu amb quina freqüència us ha passat el següent durant les darreres setmanes.",progress:"{current} / {total}",done:"Qüestionari CBI completat",scale_always:"Sempre",scale_often:"Sovint",scale_sometimes:"De vegades",scale_seldom:"Rarament",scale_never:"Mai"},xt={title:"Resultats d'avui",risk_index:"Índex de risc",breakdown:"Desglossament"},$t={title:"Historial",subtitle:"Els teus últims check-ins locals",empty_title:"Encara no hi ha registres",empty_body:"Els check-ins completats apareixeran aquí amb la tendència del teu índex de risc.",trend_title:"Tendència del risc",summary_title:"Resum",week_avg:"Mitjana setmanal",best_day:"Millor dia",worst_day:"Pitjor dia",sessions_title:"Sessions recents",risk_label:"Risc"},Et={network:"Error de connexió. Comproveu la xarxa i torneu-ho a provar.",invalid_code:"Codi d'accés no vàlid o ja utilitzat.",generic:"S'ha produït un error inesperat. Torneu-ho a provar més tard."},Ct={loading:"Carregant…",close:"Tancar",back:"Enrere"},Tt={app:ht,nav:bt,onboarding:yt,home:_t,checkin:vt,pvt:wt,stroop:kt,cbi:St,results:xt,history:$t,errors:Et,common:Ct},Lt={name:"PulsePath"},At={home:"Inicio",history:"Historial"},Dt={title:"Bienvenido/a a PulsePath",consent_title:"Consentimiento informado para el tratamiento de datos",consent_body:`De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), la organización promotora del programa PulsePath le informa de lo siguiente:

1. Responsable del tratamiento: la organización empleadora participante en el programa piloto (en el caso del piloto, el Ayuntamiento de Barcelona), con apoyo técnico del proveedor del servicio PulsePath.

2. Finalidad: evaluar factores de riesgo psicosocial y cognitivo relacionados con la salud laboral, en el marco de la prevención de riesgos laborales (Ley 31/1995 de Prevención de Riesgos Laborales). Los resultados se agregan de forma anónima por departamento y turno; no es posible identificar a personas individuales.

3. Datos que se tratan: índices numéricos derivados de los tests cognitivos (PVT-B, Stroop, CBI) y datos declarativos del micro-check-in (horas de sueño, nivel de estrés, consumo de estimulantes), junto con metadatos anónimos (departamento y turno). No se recogen datos biométricos en bruto, tiempos de reacción individuales, respuestas literales del CBI, dirección IP, nombre, correo electrónico ni ningún otro dato que permita su identificación directa.

4. Procesamiento en el dispositivo (Edge AI): los tests cognitivos se ejecutan íntegramente en su dispositivo. Los cálculos se realizan localmente antes de transmitir únicamente los índices agregados al servidor, ubicado en la Unión Europea.

5. Base jurídica: interés legítimo de la empresa en materia de prevención de riesgos laborales y protección de la salud de los trabajadores (art. 6.1.f RGPD), así como el cumplimiento de obligaciones legales en materia de PRL.

6. Conservación: los datos se almacenan durante la vigencia del programa piloto y un período adicional de doce (12) meses posterior a su finalización, tras el cual serán suprimidos de forma irreversible.

7. Destinatarios: personal autorizado de prevención de riesgos laborales y recursos humanos de la organización, exclusivamente en formato agregado y con garantías de K-anonimidad (grupos mínimos de cinco personas). No se cederán datos a terceros salvo obligación legal.

8. Derechos: puede ejercer los derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición y portabilidad mediante solicitud a la oficina de prevención de riesgos laborales de su organización. También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).

9. Revocación: puede retirar el consentimiento en cualquier momento desde la aplicación o solicitando la supresión de sus datos. La revocación no afecta a la licitud del tratamiento efectuado con anterioridad.

Al pulsar «Acepto y continúo», declara haber leído y comprendido la información anterior y consiente el tratamiento de los datos descritos exclusivamente para las finalidades indicadas.`,code_label:"Código de acceso anónimo",code_placeholder:"Ej.: BCN-2026-A007",submit:"Acepto y continúo",language_label:"Idioma",right_to_delete:"Derecho de supresión (RGPD)",delete_confirm:"¿Seguro que quieres eliminar todos tus datos? Esta acción es irreversible."},It={title:"Tu estado de hoy",test_pending:"Tienes un test pendiente para hoy",test_done:"Has completado el test de hoy",start_test:"Empezar test",cbi_pending:"Tienes el cuestionario semanal pendiente",continue_weekly:"Continuar test semanal",risk_low:"Riesgo bajo",risk_medium:"Riesgo moderado",risk_high:"Riesgo alto",daily_reminder:"Completa tu check-in diario",cbi_reminder:"Completa el cuestionario semanal CBI"},Rt={sleep_label:"¿Cuántas horas has dormido la última noche?",stress_label:"¿Cómo valoras tu nivel de estrés hoy?",stimulants_label:"¿Has consumido estimulantes (cafeína, energéticas) en las últimas 6 horas?",continue:"Continuar",cbi_step:"Cuestionario CBI semanal"},Mt={instruction:"Cuando aparezca el círculo verde, toque la pantalla lo más rápido posible. No toque antes de que aparezca.",wait:"Espere…",tap:"¡Toque ahora!",progress:"{current} de {total}",false_start:"¡Demasiado pronto! Espere la señal verde.",done:"Test PVT completado"},Pt={instruction:"Seleccione el color de la tinta de la palabra, no el significado de la palabra.",progress:"{current} / {total}",done:"Test Stroop completado"},Nt={instruction:"Indique con qué frecuencia le ha ocurrido lo siguiente durante las últimas semanas.",progress:"{current} / {total}",done:"Cuestionario CBI completado",scale_always:"Siempre",scale_often:"A menudo",scale_sometimes:"A veces",scale_seldom:"Raramente",scale_never:"Nunca"},Bt={title:"Resultados de hoy",risk_index:"Índice de riesgo",breakdown:"Desglose"},qt={title:"Historial",subtitle:"Tus últimos check-ins locales",empty_title:"Aún no hay registros",empty_body:"Los check-ins completados aparecerán aquí con la tendencia de tu índice de riesgo.",trend_title:"Tendencia del riesgo",summary_title:"Resumen",week_avg:"Media semanal",best_day:"Mejor día",worst_day:"Peor día",sessions_title:"Sesiones recientes",risk_label:"Riesgo"},jt={network:"Error de conexión. Compruebe la red e inténtelo de nuevo.",invalid_code:"Código de acceso no válido o ya utilizado.",generic:"Se ha producido un error inesperado. Inténtelo de nuevo más tarde."},Ot={loading:"Cargando…",close:"Cerrar",back:"Atrás"},Ht={app:Lt,nav:At,onboarding:Dt,home:It,checkin:Rt,pvt:Mt,stroop:Pt,cbi:Nt,results:Bt,history:qt,errors:jt,common:Ot},zt={name:"PulsePath"},Ft={home:"Home",history:"History"},Ut={title:"Welcome to PulsePath",consent_title:"Informed consent for data processing",consent_body:`In accordance with Regulation (EU) 2016/679 (GDPR) and applicable national data protection legislation, the organisation sponsoring the PulsePath programme informs you of the following:

1. Data controller: the employer organisation participating in the pilot programme (for this pilot, Barcelona City Council), with technical support from the PulsePath service provider.

2. Purpose: to assess psychosocial and cognitive risk factors related to occupational health, within the framework of occupational risk prevention. Results are aggregated anonymously by department and shift; individual persons cannot be identified.

3. Data processed: numeric indices derived from cognitive tests (PVT-B, Stroop, CBI) and self-reported micro-check-in data (sleep hours, stress level, stimulant consumption), together with anonymous metadata (department and shift). No raw biometric data, individual reaction times, verbatim CBI responses, IP address, name, email address or any other data enabling your direct identification is collected.

4. On-device processing (Edge AI): cognitive tests run entirely on your device. Calculations are performed locally before transmitting only aggregated indices to the server, hosted in the European Union.

5. Legal basis: legitimate interest of the employer in occupational risk prevention and worker health protection (Art. 6(1)(f) GDPR), as well as compliance with legal obligations in occupational health and safety.

6. Retention: data is stored for the duration of the pilot programme and an additional twelve (12) months after it ends, after which it is irreversibly deleted.

7. Recipients: authorised occupational health and safety and human resources personnel within the organisation, exclusively in aggregated form and with K-anonymity guarantees (minimum group size of five). Data will not be disclosed to third parties except where required by law.

8. Rights: you may exercise your rights of access, rectification, erasure, restriction of processing, objection and portability by contacting your organisation's occupational risk prevention office. You also have the right to lodge a complaint with your national data protection authority.

9. Withdrawal: you may withdraw consent at any time from within the app or by requesting deletion of your data. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.

By tapping «I accept and continue», you declare that you have read and understood the above information and consent to the processing of the described data solely for the stated purposes.`,code_label:"Anonymous access code",code_placeholder:"E.g. BCN-2026-A007",submit:"I accept and continue",language_label:"Language",right_to_delete:"Right to erasure (GDPR)",delete_confirm:"Are you sure you want to delete all your data? This action is irreversible."},Kt={title:"Your status today",test_pending:"You have a test pending for today",test_done:"You have completed today's test",start_test:"Start test",cbi_pending:"You have the weekly questionnaire pending",continue_weekly:"Continue weekly test",risk_low:"Low risk",risk_medium:"Moderate risk",risk_high:"High risk",daily_reminder:"Complete your daily check-in",cbi_reminder:"Complete the weekly CBI questionnaire"},Yt={sleep_label:"How many hours did you sleep last night?",stress_label:"How would you rate your stress level today?",stimulants_label:"Have you consumed stimulants (caffeine, energy drinks) in the last 6 hours?",continue:"Continue",cbi_step:"Weekly CBI questionnaire"},Wt={instruction:"When the green circle appears, tap the screen as quickly as possible. Do not tap before it appears.",wait:"Wait…",tap:"Tap now!",progress:"{current} of {total}",false_start:"Too soon! Wait for the green signal.",done:"PVT test completed"},Gt={instruction:"Select the ink colour of the word, not the meaning of the word.",progress:"{current} / {total}",done:"Stroop test completed"},Vt={instruction:"Indicate how often the following has applied to you during recent weeks.",progress:"{current} / {total}",done:"CBI questionnaire completed",scale_always:"Always",scale_often:"Often",scale_sometimes:"Sometimes",scale_seldom:"Seldom",scale_never:"Never"},Jt={title:"Today's results",risk_index:"Risk index",breakdown:"Breakdown"},Qt={title:"History",subtitle:"Your recent local check-ins",empty_title:"No records yet",empty_body:"Completed check-ins will appear here with your risk index trend.",trend_title:"Risk trend",summary_title:"Summary",week_avg:"Weekly average",best_day:"Best day",worst_day:"Worst day",sessions_title:"Recent sessions",risk_label:"Risk"},Xt={network:"Connection error. Check your network and try again.",invalid_code:"Invalid or already used access code.",generic:"An unexpected error occurred. Please try again later."},Zt={loading:"Loading…",close:"Close",back:"Back"},en={app:zt,nav:Ft,onboarding:Ut,home:Kt,checkin:Yt,pvt:Wt,stroop:Gt,cbi:Vt,results:Jt,history:Qt,errors:Xt,common:Zt},ce="ca",J=["ca","es","en"],Je="pulsepath_lang",fe={ca:Tt,es:Ht,en};let Qe=ce,Xe=fe[ce];function tn(){try{const e=localStorage.getItem(Je);if(e&&J.includes(e))return e}catch{}return ce}function Ze(e){Qe=e,Xe=fe[e]??fe[ce]}Ze(tn());function j(){return Qe}function et(e){if(!J.includes(e))throw new Error(`Idioma no suportat: ${e}. Suportats: ${J.join(", ")}`);try{localStorage.setItem(Je,e)}catch{}Ze(e),typeof window<"u"&&window.dispatchEvent(new CustomEvent("languageChanged",{detail:{language:e}}))}function i(e){if(!e||typeof e!="string")return String(e??"");const t=e.split(".");let n=Xe;for(const s of t){if(n==null||typeof n!="object"||!(s in n))return e;n=n[s]}return typeof n=="string"?n:e}async function nn(e){const t=new TextEncoder().encode(e),n=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("")}const sn="pulsepath-db",on=1,M="sessions",P="config",ve="pulsepath_sessions",we="pulsepath_config_";let ne=null,$=!1;function an(){try{return typeof indexedDB<"u"&&indexedDB!==null}catch{return!1}}function K(){return $?Promise.resolve(null):ne||(an()?(ne=new Promise(e=>{let t;try{t=indexedDB.open(sn,on)}catch{$=!0,e(null);return}t.onupgradeneeded=()=>{const n=t.result;n.objectStoreNames.contains(M)||n.createObjectStore(M,{keyPath:"id"}).createIndex("takenAt","takenAt",{unique:!1}),n.objectStoreNames.contains(P)||n.createObjectStore(P,{keyPath:"key"})},t.onsuccess=()=>e(t.result),t.onerror=()=>{$=!0,e(null)},t.onblocked=()=>{$=!0,e(null)}}),ne):($=!0,Promise.resolve(null)))}async function X(){return K()}function ke(e){return new Promise((t,n)=>{e.oncomplete=()=>t(),e.onabort=()=>n(e.error||new Error("Transacció avortada")),e.onerror=()=>n(e.error||new Error("Error de transacció"))})}function tt(e){return new Promise((t,n)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>n(e.error||new Error("Error de petició"))})}function nt(){try{const e=localStorage.getItem(ve),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch{return[]}}function rn(e){try{localStorage.setItem(ve,JSON.stringify(e))}catch{}}async function ln(e){const t=await X();if(t)try{const o=t.transaction(M,"readwrite");o.objectStore(M).put(e),await ke(o);return}catch{$=!0}const s=nt().filter(o=>o.id!==e.id);s.push(e),rn(s)}async function cn(e=30){const t=await X();if(t)try{const n=t.transaction(M,"readonly"),s=await tt(n.objectStore(M).getAll());return Re(s,e)}catch{$=!0}return Re(nt(),e)}function Re(e,t){const n=Array.isArray(e)?[...e]:[];n.sort((o,a)=>String(a.takenAt).localeCompare(String(o.takenAt)));const s=Number.isFinite(t)&&t>0?t:n.length;return n.slice(0,s)}async function Z(e){const t=await X();if(t)try{const n=t.transaction(P,"readonly"),s=await tt(n.objectStore(P).get(e));return s?s.value:null}catch{$=!0}try{const n=localStorage.getItem(we+e);return n==null?null:JSON.parse(n)}catch{return null}}async function B(e,t){const n=await X();if(n)try{const s=n.transaction(P,"readwrite");s.objectStore(P).put({key:e,value:t}),await ke(s);return}catch{$=!0}try{localStorage.setItem(we+e,JSON.stringify(t))}catch{}}async function dn(){const e=await X();if(e)try{const t=e.transaction([M,P],"readwrite");t.objectStore(M).clear(),t.objectStore(P).clear(),await ke(t)}catch{$=!0}try{localStorage.removeItem(ve);const t=[];for(let n=0;n<localStorage.length;n+=1){const s=localStorage.key(n);s&&s.startsWith(we)&&t.push(s)}t.forEach(n=>localStorage.removeItem(n))}catch{}}const st="crypto_salt",ot="crypto_keymaterial",Se="encrypted_token",un=1e5,pn="SHA-256",mn=16,gn=32,fn=256,hn=12,re=16,bn=new TextEncoder,yn=new TextDecoder;let Q=null,G=null;function ie(e){let t="";for(let s=0;s<e.length;s+=32768)t+=String.fromCharCode.apply(null,e.subarray(s,s+32768));return btoa(t)}function le(e){const t=atob(e),n=new Uint8Array(t.length);for(let s=0;s<t.length;s+=1)n[s]=t.charCodeAt(s);return n}function _n(e,t){const n=new Uint8Array(e.length+t.length);return n.set(e,0),n.set(t,e.length),n}function xe(){if(typeof crypto>"u"||!crypto.subtle)throw new Error("Web Crypto API no disponible en este entorno.");return crypto.subtle}async function Me(e,t){const n=await Z(e);if(typeof n=="string"&&n.length>0)return le(n);const s=crypto.getRandomValues(new Uint8Array(t));return await B(e,ie(s)),s}async function vn(){const e=xe(),t=await Me(ot,gn),n=await Me(st,mn),s=await e.importKey("raw",t,{name:"PBKDF2"},!1,["deriveKey"]);return e.deriveKey({name:"PBKDF2",salt:n,iterations:un,hash:pn},s,{name:"AES-GCM",length:fn},!1,["encrypt","decrypt"])}async function $e(){Q||(G||(G=vn().then(e=>{Q=e}).catch(e=>{throw G=null,e})),await G)}async function at(){return Q||await $e(),Q}async function wn(e){const t=await at(),n=xe(),s=crypto.getRandomValues(new Uint8Array(hn)),o=new Uint8Array(await n.encrypt({name:"AES-GCM",iv:s,tagLength:re*8},t,bn.encode(e))),a=o.subarray(0,o.length-re),r=o.subarray(o.length-re);return{ciphertext:ie(a),iv:ie(s),tag:ie(r)}}async function kn(e){if(!e||typeof e!="object")return null;const{ciphertext:t,iv:n,tag:s}=e;if(typeof t!="string"||typeof n!="string"||typeof s!="string")return null;try{const o=await at(),a=xe(),r=_n(le(t),le(s)),c=await a.decrypt({name:"AES-GCM",iv:le(n),tagLength:re*8},o,r);return yn.decode(c)}catch{return null}}async function rt(e){const t=await wn(e);await B(Se,t)}async function Sn(){const e=await Z(Se);return e?kn(e):null}async function xn(){Q=null,G=null,await Promise.all([B(st,null),B(ot,null),B(Se,null)])}const Pe="pulsepath_token",$n="ayuntamiento_bcn",he="pulsepath_department",be="pulsepath_shift",En=new Set(["timestamp","risk_index","pvt_index","stroop_index","cbi_score","sleep_hours"]);async function de(){const e=await Sn();if(e)return e;const t=localStorage.getItem(Pe);return t?(await rt(t),localStorage.removeItem(Pe),t):null}async function Cn(e){await rt(e)}async function Tn(){await xn(),localStorage.removeItem(he),localStorage.removeItem(be)}function Ln({department:e,shift:t}){e?localStorage.setItem(he,e):localStorage.removeItem(he),t?localStorage.setItem(be,t):localStorage.removeItem(be)}function An(e){return e.startsWith("/api/")?e:`/api/v1${e.startsWith("/")?e:`/${e}`}`}function Dn(e,t){if(e&&typeof e=="object"){if(typeof e.error=="string")return e.error;if(typeof e.message=="string")return e.message;if(Array.isArray(e.fields)&&e.fields.length>0)return`Campos no permitidos: ${e.fields.join(", ")}`}return typeof e=="string"&&e.trim()?e:`Error ${t}`}async function Ee(e,t={}){const n=new Headers(t.headers||{});!n.has("Content-Type")&&t.body&&n.set("Content-Type","application/json");const s=await de();s&&n.set("Authorization",`Bearer ${s}`);const o=await fetch(An(e),{...t,headers:n}),c=(o.headers.get("content-type")||"").includes("application/json")?await o.json().catch(()=>null):await o.text();if(!o.ok){const d=Dn(c,o.status),m=new Error(d);throw m.status=o.status,m.data=c,m}return c}async function In(e,t,n){const s=await nn(e),o=await Ee("/auth/anonymous",{method:"POST",body:JSON.stringify({org_slug:$n,code_hash:s,consent:t,policy_version:n})});return await Cn(o.token),Ln({department:o.department,shift:o.shift}),o}function Rn(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("El payload de sesión debe ser un objeto.");const t=Object.keys(e).filter(n=>!En.has(n));if(t.length>0)throw new Error(`Privacidad: el payload contiene campos no permitidos (${t.join(", ")}). Solo se pueden enviar: timestamp, risk_index, pvt_index, stroop_index, cbi_score, sleep_hours.`)}async function Mn(e){return Rn(e),Ee("/session",{method:"POST",body:JSON.stringify(e)})}function Pn(e){function t(){const n=j(),s=i("onboarding.consent_body").split(`

`).map(u=>`<p style="margin:0 0 0.75rem">${u.replace(/\n/g,"<br>")}</p>`).join("");e.innerHTML=`
      <section class="screen screen--onboarding">

        <div class="glass-card" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
          <span style="font-size:0.85rem;color:var(--text-muted);flex-shrink:0">
            ${i("onboarding.language_label")}:
          </span>
          <div style="display:flex;gap:0.5rem">
            ${J.map(u=>`
              <button
                type="button"
                class="btn ${u===n?"":"btn--ghost"}"
                data-lang="${u}"
                style="padding:0.4rem 0.85rem;font-size:0.8rem;min-width:3rem"
              >${u.toUpperCase()}</button>
            `).join("")}
          </div>
        </div>

        <h1 class="screen__title" style="margin-top:1.25rem">${i("onboarding.title")}</h1>

        <div class="glass-card">
          <h2 style="margin:0 0 0.75rem;font-size:1rem;font-weight:600">
            ${i("onboarding.consent_title")}
          </h2>

          <div class="consent-scroll" tabindex="0" role="region" aria-label="${i("onboarding.consent_title")}">
            ${s}
          </div>

          <label class="consent-label">
            <input type="checkbox" id="consent-check" class="consent-checkbox">
            <span>${i("onboarding.submit")}</span>
          </label>
        </div>

        <div class="glass-card">
          <label for="code-input" class="form-label" style="display:block;margin-bottom:0.5rem">
            ${i("onboarding.code_label")}
          </label>
          <input
            type="text"
            id="code-input"
            class="form-input"
            placeholder="${i("onboarding.code_placeholder")}"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          >
        </div>

        <div id="onboarding-error" class="inline-error" style="display:none"></div>

        <button
          type="button"
          class="btn btn-block"
          id="btn-submit"
          disabled
          style="opacity:0.45;cursor:not-allowed"
        >${i("onboarding.submit")}</button>

        <div id="onboarding-loading" class="inline-loading" style="display:none">
          ${i("common.loading")}
        </div>

        <div style="margin-top:2rem;text-align:center">
          <button
            type="button"
            id="btn-delete"
            class="btn btn--danger-ghost"
          >${i("onboarding.right_to_delete")}</button>
        </div>

        <div id="delete-loading" class="inline-loading" style="display:none">
          ${i("common.loading")}
        </div>

      </section>
    `,e.querySelectorAll("[data-lang]").forEach(u=>{u.addEventListener("click",()=>{et(u.dataset.lang),t()})});const o=e.querySelector("#consent-check"),a=e.querySelector("#code-input"),r=e.querySelector("#btn-submit"),c=e.querySelector("#onboarding-error"),d=e.querySelector("#onboarding-loading"),m=e.querySelector("#btn-delete"),g=e.querySelector("#delete-loading");function w(){const u=o.checked&&a.value.trim().length>0;r.disabled=!u,r.style.opacity=u?"1":"0.45",r.style.cursor=u?"pointer":"not-allowed"}o.addEventListener("change",w),a.addEventListener("input",w),r.addEventListener("click",async()=>{const u=a.value.trim();if(!(!u||!o.checked)){r.disabled=!0,r.style.opacity="0.45",c.style.display="none",d.style.display="block";try{await K(),await $e(),await In(u,!0,"1.0"),window.dispatchEvent(new CustomEvent("pulsepath:auth-changed"))}catch(f){const l=f==null?void 0:f.status,p=i(l===404||l===409||l===400?"errors.invalid_code":"errors.network");c.textContent=p,c.style.display="block",r.disabled=!1,r.style.opacity="1",r.style.cursor="pointer"}finally{d.style.display="none"}}}),m.addEventListener("click",async()=>{const u=i("onboarding.delete_confirm");if(confirm(u)){m.disabled=!0,g.style.display="block";try{await de()&&await Ee("/me/delete",{method:"POST"}).catch(()=>{})}finally{await Tn(),await dn(),g.style.display="none",window.dispatchEvent(new CustomEvent("pulsepath:auth-changed"))}}})}t()}const Nn="pulsepath_last_test_date",Bn="pulsepath_last_risk_index";function qn(){return new Date().toISOString().slice(0,10)}function Ne(e){const t=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t-s)/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}async function jn(){try{await K();const e=new Date;if(e.getDay()===1)return!0;const t=await Z("last_cbi_date");return t?Ne(e)!==Ne(new Date(t)):!0}catch{return!1}}function On(e){return e===null?"":e<35?"risk-badge--low":e<60?"risk-badge--medium":"risk-badge--high"}function Hn(e){return e===null?"⚪":e<35?"🟢":e<60?"🟡":"🔴"}function zn(e){return e===null?"var(--text-muted)":e<35?"#4ade80":e<60?"#facc15":"#f87171"}function Fn(e,{navigate:t}){const n=qn(),o=localStorage.getItem(Nn)===n,a=localStorage.getItem(Bn),r=a!==null?parseInt(a,10):null;function c(d){var l;const m=Hn(o?r:null),g=zn(o?r:null),w=On(o?r:null),u=d?`<div class="cbi-badge">
           <span class="cbi-badge__icon" aria-hidden="true">⚠️</span>
           <span>${i("home.cbi_pending")}</span>
         </div>`:"",f=o?`<div class="day-status">
           <span class="day-status__semaphore" aria-hidden="true">${m}</span>
           <span class="day-status__risk-label">${i("results.risk_index")}</span>
           ${r!==null?`<span class="day-status__risk-num" style="color:${g}">${r}</span>
                <span class="day-status__denom">/100</span>`:""}
           <span class="day-status__done-label">✓ ${i("home.test_done")}</span>
           ${r!==null?`<span class="risk-badge ${w}" style="margin-top:0.5rem">
                  ${r<35?i("home.risk_low")||"Risc baix":r<60?i("home.risk_medium")||"Risc moderat":i("home.risk_high")||"Risc alt"}
                </span>`:""}
         </div>
         ${u}
         ${d?`<button type="button" class="btn btn-block" id="btn-start-test" style="margin-top:1rem">
                ${i("home.continue_weekly")}
              </button>`:""}`:`<div class="day-status">
           <span class="day-status__semaphore" aria-hidden="true">⚪</span>
           <p style="margin:0.25rem 0 0.75rem;font-size:1rem;color:var(--text-muted);text-align:center">
             ${i("home.test_pending")}
           </p>
         </div>
         ${u}
         <button type="button" class="btn btn-block" id="btn-start-test"
                 style="margin-top:${d?"0.75rem":"0.5rem"}">
           ${i("home.start_test")}
         </button>`;e.innerHTML=`
      <section class="screen screen--home">
        <h1 class="screen__title">${i("home.title")}</h1>

        <div class="glass-card">
          ${f}
        </div>

        ${!o||d?`<div class="alert-banner alert-banner--warning" style="margin-top:0.85rem" role="status">
               <span aria-hidden="true">💡</span>
               <span>${o?i("home.cbi_reminder")||i("home.cbi_pending"):i("home.daily_reminder")||i("home.test_pending")}</span>
             </div>`:""}
      </section>
    `,(l=e.querySelector("#btn-start-test"))==null||l.addEventListener("click",()=>{t("checkin")})}c(!1),jn().then(d=>{d&&c(!0)})}const se={pvt:.4,stroop:.25,cbi:.25,sleep:.1};function Un(e){const t=Number(e);return Number.isNaN(t)||t>=7?0:t>=5?25:t>=4?50:75}function Kn(e={}){const t=Math.max(1,e.trials??30),n=e.lapses??0,s=e.falseStarts??0,o=e.meanRt??250,a=e.sdRt??50,r=n/t,c=s/t,d=Math.min(40,r*200),m=Math.min(20,c*100),g=Math.min(25,Math.max(0,(o-200)/4)),w=Math.min(15,Math.max(0,(a-30)/3)),u=d+m+g+w;return Ce(u)}function Yn(e={}){const t=Math.max(1,e.trials??20),n=e.errors??0,s=e.meanRt??600,o=n/t,a=Math.min(50,o*250),r=Math.min(50,Math.max(0,(s-400)/8)),c=a+r;return Ce(c)}function Wn({pvtIndex:e,stroopIndex:t,cbiScore:n,sleepHours:s}){const o=Number(e)||0,a=Number(t)||0,r=Number(n)??50,c=Un(s),d={pvt:oe(o*se.pvt),stroop:oe(a*se.stroop),cbi:oe(r*se.cbi),sleep:oe(c*se.sleep)},m=d.pvt+d.stroop+d.cbi+d.sleep;return{riskIndex:Ce(m),breakdown:d}}function Ce(e){return Math.round(Math.min(100,Math.max(0,e)))}function oe(e){return Math.round(e*100)/100}const T=30,Be=1e3,Gn=4e3,it=355,Vn=650,Jn=1300,Qn=100,qe="pvt-inline-styles",Xn={"pvt.instruction":"Cuando aparezca el círculo verde, toca la pantalla lo más rápido posible. No toques antes de que aparezca.","pvt.wait":"Espere…","pvt.tap":"¡Toca ahora!","pvt.progress":"{current} / {total}","pvt.false_start":"¡Demasiado pronto! Espera la señal verde.","pvt.done":"Test PVT completado","pvt.start":"Comenzar","pvt.lapse":"Lento"};function Zn(e=[],t=0){const n=(Array.isArray(e)?e:[]).map(Number).filter(p=>Number.isFinite(p)&&p>=0),s=n.length,o=Number.isFinite(t)?Math.max(0,Math.round(t)):0;if(s===0)return{trials:0,lapses:0,falseStarts:o,meanRt:0,medianRt:0,sdRt:0,p10Slowest:0,times:[]};const a=n.filter(p=>p>it).length,c=n.reduce((p,h)=>p+h,0)/s,d=[...n].sort((p,h)=>p-h),m=ts(d),g=n.reduce((p,h)=>p+(h-c)**2,0)/s,w=Math.sqrt(g),u=Math.max(1,Math.round(s*.1)),f=d.slice(s-u),l=f.reduce((p,h)=>p+h,0)/f.length;return{trials:s,lapses:a,falseStarts:o,meanRt:W(c),medianRt:W(m),sdRt:W(w),p10Slowest:W(l),times:n.map(W)}}function es(e,t={}){if(!e)throw new Error("runPvtTest: se requiere un contenedor DOM.");const{onProgress:n,onComplete:s,onFalseStart:o,t:a}=t,r=(y,R)=>{const De=(typeof a=="function"?a(y):null)||Xn[y]||y;return R?Object.keys(R).reduce((ft,Ie)=>ft.replaceAll(`{${Ie}}`,String(R[Ie])),De):De};ns();const c=[];let d=0,m=0,g="ready",w=0,u=null,f=null,l=!1;e.innerHTML="";const p=document.createElement("section");p.className="pvt",p.innerHTML=`
    <header class="pvt__head">
      <div class="pvt__progress" role="progressbar"
           aria-valuemin="0" aria-valuemax="${T}" aria-valuenow="0">
        <div class="pvt__progress-track">
          <div class="pvt__progress-fill" style="width:0%"></div>
        </div>
        <span class="pvt__progress-label">${r("pvt.progress",{current:0,total:T})}</span>
      </div>
    </header>
    <div class="pvt__stage" data-phase="ready" tabindex="0"
         role="button" aria-live="polite">
      <div class="pvt__stimulus" aria-hidden="true"></div>
      <p class="pvt__message">${r("pvt.instruction")}</p>
      <p class="pvt__rt" aria-hidden="true"></p>
      <button type="button" class="pvt__start">${r("pvt.start")}</button>
    </div>
  `,e.appendChild(p);const h=p.querySelector(".pvt__stage"),_=p.querySelector(".pvt__stimulus"),b=p.querySelector(".pvt__message"),k=p.querySelector(".pvt__rt"),D=p.querySelector(".pvt__start"),O=p.querySelector(".pvt__progress"),Y=p.querySelector(".pvt__progress-fill"),H=p.querySelector(".pvt__progress-label");function x(y){g=y,h.setAttribute("data-phase",y)}function N(){const y=Math.min(m+(g==="done"?0:1),T),R=Math.round(m/T*100);Y.style.width=`${R}%`,H.textContent=r("pvt.progress",{current:g==="done"?T:y,total:T}),O.setAttribute("aria-valuenow",String(m)),typeof n=="function"&&n(g==="done"?T:y,T)}function I(){u!==null&&(clearTimeout(u),u=null),f!==null&&(clearTimeout(f),f=null)}function E(){if(l)return;I(),x("waiting"),_.classList.remove("pvt__stimulus--on"),b.textContent=r("pvt.wait"),k.textContent="",k.className="pvt__rt",N();const y=Be+Math.random()*(Gn-Be);u=setTimeout(v,y)}function v(){l||(u=null,x("stimulus"),_.classList.add("pvt__stimulus--on"),b.textContent=r("pvt.tap"),w=performance.now())}function S(){if(l)return;if(g==="waiting"){C();return}if(g!=="stimulus")return;const y=performance.now()-w;if(y<Qn){C();return}c.push(y),m+=1,z(y)}function C(){I(),d+=1,x("feedback"),_.classList.remove("pvt__stimulus--on"),b.textContent=r("pvt.false_start"),b.classList.add("pvt__message--error"),k.textContent="",k.className="pvt__rt",typeof o=="function"&&o(),f=setTimeout(()=>{f=null,b.classList.remove("pvt__message--error"),E()},Jn)}function z(y){x("feedback"),_.classList.remove("pvt__stimulus--on");const R=y>it;b.textContent=`${Math.round(y)} ms`,k.textContent=R?r("pvt.lapse"):"",k.className=R?"pvt__rt pvt__rt--lapse":"pvt__rt",N(),f=setTimeout(()=>{f=null,m>=T?te():E()},Vn)}function te(){I(),x("done"),_.classList.remove("pvt__stimulus--on"),b.textContent=r("pvt.done"),b.classList.remove("pvt__message--error"),k.textContent="",N(),Ae();const y=Zn(c,d);typeof s=="function"&&s(y)}function Te(y){y.target!==D&&(y.preventDefault(),S())}function Le(y){(y.code==="Space"||y.code==="Enter")&&(g==="waiting"||g==="stimulus")&&(y.preventDefault(),S())}function mt(){h.addEventListener("pointerdown",Te),h.addEventListener("keydown",Le)}function Ae(){h.removeEventListener("pointerdown",Te),h.removeEventListener("keydown",Le)}function gt(){D.remove(),mt(),h.focus({preventScroll:!0}),E()}return D.addEventListener("click",gt,{once:!0}),{destroy(){l=!0,I(),Ae()}}}function ts(e){const t=e.length;if(t===0)return 0;const n=Math.floor(t/2);return t%2===0?(e[n-1]+e[n])/2:e[n]}function W(e){return Math.round(e*10)/10}function ns(){if(typeof document>"u"||document.getElementById(qe))return;const e=document.createElement("style");e.id=qe,e.textContent=`
.pvt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 70vh;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.pvt__head { flex-shrink: 0; }
.pvt__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.pvt__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.pvt__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.pvt__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.pvt__stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 2rem 1.25rem;
  text-align: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  outline: none;
  transition: background 0.2s ease;
}
.pvt__stage[data-phase='stimulus'] { background: #0a1410; }
.pvt__stage[data-phase='waiting'] { background: #05060b; }
.pvt__stage:focus-visible { border-color: rgba(34, 211, 238, 0.4); }
.pvt__stimulus {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(120, 180, 255, 0.05);
  border: 2px dashed rgba(120, 180, 255, 0.15);
  transform: scale(0.7);
  opacity: 0;
  transition: opacity 0.08s ease, transform 0.08s ease;
}
.pvt__stimulus--on {
  background: radial-gradient(circle at 35% 30%, #4ade80, #16a34a 70%);
  border: none;
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 50px rgba(74, 222, 128, 0.55), 0 0 90px rgba(34, 197, 94, 0.25);
}
.pvt__message {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
  max-width: 22ch;
}
.pvt__stage[data-phase='ready'] .pvt__message {
  font-size: 1rem;
  font-weight: 400;
  color: #8b9bb8;
}
.pvt__message--error { color: #fb7185; }
.pvt__rt { margin: 0; min-height: 1.1rem; font-size: 0.85rem; color: #8b9bb8; }
.pvt__rt--lapse { color: #fbbf24; font-weight: 600; }
.pvt__start {
  margin-top: 0.5rem;
  padding: 0.85rem 2rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: #07090f;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.25);
}
.pvt__start:active { transform: scale(0.98); }
`,document.head.appendChild(e)}const L=20,ss=3,je=400,os=350,Oe="stroop-inline-styles",ye=[{id:"red",hex:"#ef4444"},{id:"blue",hex:"#3b82f6"},{id:"green",hex:"#22c55e"},{id:"yellow",hex:"#facc15"}],He={ca:{red:"VERMELL",blue:"BLAU",green:"VERD",yellow:"GROC"},es:{red:"ROJO",blue:"AZUL",green:"VERDE",yellow:"AMARILLO"},en:{red:"RED",blue:"BLUE",green:"GREEN",yellow:"YELLOW"}},ze={ca:{red:"Vermell",blue:"Blau",green:"Verd",yellow:"Groc"},es:{red:"Rojo",blue:"Azul",green:"Verde",yellow:"Amarillo"},en:{red:"Red",blue:"Blue",green:"Green",yellow:"Yellow"}},as={"stroop.instruction":"Selecciona el color de la tinta de la paraula, no el seu significat.","stroop.progress":"{current} / {total}","stroop.done":"Test Stroop completat"};function rs(e=[],t=0,n=L){const s=(Array.isArray(e)?e:[]).map(Number).filter(m=>Number.isFinite(m)&&m>=0),o=s.length,a=Number.isFinite(t)?Math.max(0,Math.round(t)):0,r=Number.isFinite(n)?Math.max(0,Math.round(n)):L;if(o===0)return{errors:a,trials:r,meanRt:0,sdRt:0,times:[]};const c=s.reduce((m,g)=>m+g,0)/o,d=s.reduce((m,g)=>m+(g-c)**2,0)/o;return{errors:a,trials:r,meanRt:me(c),sdRt:me(Math.sqrt(d)),times:s.map(me)}}function is(){const e=ye.map(o=>o.id),t=[];let n=0,s=null;for(let o=0;o<L;o+=1){let a=pe(e);if(a===s&&n>=ss){const d=e.filter(m=>m!==s);a=pe(d)}const r=e.filter(d=>d!==a),c=pe(r);a===s?n+=1:(n=1,s=a),t.push({wordColor:c,inkColor:a})}return t}function pe(e){return e[Math.floor(Math.random()*e.length)]}function ls(e,t={}){if(!e)throw new Error("runStroopTest: es requereix un contenidor DOM.");const{onProgress:n,onComplete:s,t:o}=t,a=(v,S)=>{const C=(typeof o=="function"?o(v):null)||as[v]||v;return S?Object.keys(S).reduce((z,te)=>z.replaceAll(`{${te}}`,String(S[te])),C):C},r=j(),c=He[r]??He.en,d=ze[r]??ze.en;cs();const m=is(),g=[];let w=0,u=0,f=0,l=!1,p=!1,h=null;e.innerHTML="";const _=document.createElement("section");_.className="stroop",_.innerHTML=`
    <header class="stroop__head">
      <p class="stroop__instruction">${a("stroop.instruction")}</p>
      <div class="stroop__progress">
        <div class="stroop__progress-track">
          <div class="stroop__progress-fill" style="width:0%"></div>
        </div>
        <span class="stroop__progress-label">${a("stroop.progress",{current:0,total:L})}</span>
      </div>
    </header>
    <div class="stroop__stage">
      <span class="stroop__word">&nbsp;</span>
    </div>
    <div class="stroop__buttons">
      ${ye.map(v=>`<button type="button" class="stroop__btn" data-color="${v.id}">${d[v.id]}</button>`).join("")}
    </div>
  `,e.appendChild(_);const b=_.querySelector(".stroop__word"),k=_.querySelector(".stroop__progress-fill"),D=_.querySelector(".stroop__progress-label"),O=Array.from(_.querySelectorAll(".stroop__btn"));function Y(v){const S=Math.round(v/L*100);k.style.width=`${S}%`,D.textContent=a("stroop.progress",{current:v,total:L}),typeof n=="function"&&n(v,L)}function H(){if(p)return;const v=m[u],S=ye.find(C=>C.id===v.inkColor);b.textContent=c[v.wordColor],b.style.color=S.hex,b.className="stroop__word",l=!0,f=performance.now()}function x(v){if(!l||p)return;const S=v.currentTarget.getAttribute("data-color"),C=performance.now()-f,z=S===m[u].inkColor;l=!1,g.push(C),z||(w+=1),b.classList.add(z?"stroop__word--ok":"stroop__word--err"),u+=1,Y(u),h=setTimeout(()=>{p||(u>=L?N():(b.textContent=" ",b.className="stroop__word",h=setTimeout(H,je)))},os)}function N(){E();const v=rs(g,w,L);b.textContent=a("stroop.done"),b.style.color="var(--accent-cyan)",b.classList.add("stroop__word--done"),typeof s=="function"&&s(v)}function I(){O.forEach(v=>v.addEventListener("click",x))}function E(){O.forEach(v=>v.removeEventListener("click",x))}return I(),Y(0),h=setTimeout(H,je),{destroy(){p=!0,h!==null&&clearTimeout(h),E()}}}function me(e){return Math.round(e*10)/10}function cs(){if(typeof document>"u"||document.getElementById(Oe))return;const e=document.createElement("style");e.id=Oe,e.textContent=`
.stroop {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.stroop__head { display: flex; flex-direction: column; gap: 0.9rem; }
.stroop__instruction {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  text-align: center;
  color: #8b9bb8;
}
.stroop__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.stroop__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.stroop__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.stroop__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.stroop__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 2rem 1.25rem;
}
.stroop__word {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: transform 0.1s ease;
}
.stroop__word--ok { transform: scale(1.08); }
.stroop__word--err { transform: scale(0.92); }
.stroop__word--done { font-size: 1.3rem; font-weight: 600; }
.stroop__buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.stroop__btn {
  padding: 1rem 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #f0f4fc;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(120, 180, 255, 0.18);
  border-radius: 0.75rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.1s ease, background 0.2s ease;
}
.stroop__btn:active { transform: scale(0.96); background: rgba(34, 211, 238, 0.12); }
.stroop__btn[data-color='red']::before { content: '\\25cf '; color: #ef4444; }
.stroop__btn[data-color='blue']::before { content: '\\25cf '; color: #3b82f6; }
.stroop__btn[data-color='green']::before { content: '\\25cf '; color: #22c55e; }
.stroop__btn[data-color='yellow']::before { content: '\\25cf '; color: #facc15; }
`,document.head.appendChild(e)}const ds={always:100,often:75,sometimes:50,seldom:25,never:0},us={always:0,often:25,sometimes:50,seldom:75,never:100},ps=50,ms=["always","often","sometimes","seldom","never"],U=[{id:"P1",subscale:"personal",text:{ca:"Et sents esgotat/da?",es:"¿Te sientes agotado/a?",en:"Do you feel tired?"}},{id:"P2",subscale:"personal",text:{ca:"Et sents físicament exhaust/a?",es:"¿Te sientes físicamente exhausto/a?",en:"Are you physically exhausted?"}},{id:"P3",subscale:"personal",text:{ca:"Et sents emocionalment esgotat/da?",es:"¿Te sientes emocionalmente agotado/a?",en:"Are you emotionally exhausted?"}},{id:"P4",subscale:"personal",text:{ca:"Penses: «No puc més»?",es:"¿Piensas: «No puedo más»?",en:"Do you think: “I can't take it anymore”?"}},{id:"P5",subscale:"personal",text:{ca:"Et sents desgastat/da?",es:"¿Te sientes desgastado/a?",en:"Do you feel worn out?"}},{id:"P6",subscale:"personal",text:{ca:"Et sents dèbil i susceptible a emmalaltir?",es:"¿Te sientes débil y susceptible a enfermar?",en:"Do you feel weak and susceptible to illness?"}},{id:"W1",subscale:"work",text:{ca:"És el teu treball emocionalment esgotador?",es:"¿Es tu trabajo emocionalmente agotador?",en:"Is your work emotionally exhausting?"}},{id:"W2",subscale:"work",text:{ca:"Et sents esgotat/da al final de la jornada laboral?",es:"¿Te sientes agotado/a al final de la jornada laboral?",en:"Do you feel burnt out at the end of the working day?"}},{id:"W3",subscale:"work",text:{ca:"Et sents esgotat/da al matí en pensar en un altre dia de feina?",es:"¿Te sientes agotado/a por la mañana al pensar en otro día de trabajo?",en:"Are you exhausted in the morning at the thought of another day at work?"}},{id:"W4",subscale:"work",text:{ca:"Sents que cada hora de treball és esgotadora?",es:"¿Sientes que cada hora de trabajo es agotadora?",en:"Do you feel that every working hour is tiring for you?"}},{id:"W5",subscale:"work",reversed:!0,text:{ca:"Tens prou energia per a la família i els amics en el temps lliure?",es:"¿Tienes suficiente energía para la familia y los amigos en tu tiempo libre?",en:"Do you have enough energy for family and friends during leisure time?"}},{id:"W6",subscale:"work",text:{ca:"Et resulta frustrant el teu treball?",es:"¿Te resulta frustrante tu trabajo?",en:"Is your work frustrating?"}},{id:"W7",subscale:"work",text:{ca:"Et sents cremat/da pel treball?",es:"¿Te sientes quemado/a por el trabajo?",en:"Do you feel burnt out because of your work?"}},{id:"C1",subscale:"client",text:{ca:"Et resulta difícil treballar amb clients/usuaris?",es:"¿Te resulta difícil trabajar con clientes/usuarios?",en:"Do you find it hard to work with clients/users?"}},{id:"C2",subscale:"client",text:{ca:"Treballar amb clients/usuaris t'esgota emocionalment?",es:"¿Trabajar con clientes/usuarios te agota emocionalmente?",en:"Does working with clients/users drain your energy?"}},{id:"C3",subscale:"client",text:{ca:"Et frustra treballar amb clients/usuaris?",es:"¿Te frustra trabajar con clientes/usuarios?",en:"Do you find it frustrating to work with clients/users?"}},{id:"C4",subscale:"client",text:{ca:"Sents que dones més del que reps treballant amb clients/usuaris?",es:"¿Sientes que das más de lo que recibes trabajando con clientes/usuarios?",en:"Do you feel that you give more than you get back when working with clients/users?"}},{id:"C5",subscale:"client",text:{ca:"Estàs fart/a de treballar amb clients/usuaris?",es:"¿Estás harto/a de trabajar con clientes/usuarios?",en:"Are you tired of working with clients/users?"}},{id:"C6",subscale:"client",text:{ca:"Et preguntes quant de temps més podràs continuar treballant amb clients/usuaris?",es:"¿Te preguntas cuánto tiempo más podrás seguir trabajando con clientes/usuarios?",en:"Do you wonder how long you will be able to continue working with clients/users?"}}],F={personal:6,work:7,client:6};function gs(e,t){return(t?us:ds)[String(e).toLowerCase()]??50}function fs(e={}){const t=Array.isArray(e)?U.reduce((d,m,g)=>(d[m.id]=e[g],d),{}):e||{},n={personal:0,work:0,client:0};for(const d of U){const m=t[d.id],g=m==null?50:gs(m,d.reversed===!0);n[d.subscale]+=g}const s=ae(n.personal/F.personal),o=ae(n.work/F.work),a=ae(n.client/F.client),r=F.personal+F.work+F.client,c=ae((n.personal+n.work+n.client)/r);return{personalScore:s,workScore:o,clientScore:a,globalScore:c,burnout:c>=ps,subscales:{personal:s,work:o,client:a}}}const Fe="cbi-inline-styles",hs={"cbi.instruction":"Indica amb quina freqüència t’ha passat el següent durant les darreres setmanes.","cbi.progress":"{current} / {total}","cbi.done":"Qüestionari CBI completat","cbi.scale_always":"Sempre","cbi.scale_often":"Sovint","cbi.scale_sometimes":"De vegades","cbi.scale_seldom":"Rarament","cbi.scale_never":"Mai"};function bs(e,t={}){if(!e)throw new Error("runCbiTest: es requereix un contenidor DOM.");const{onComplete:n,t:s}=t,o=t.lang||ys(s),a=(u,f)=>{const l=(typeof s=="function"?s(u):null)||hs[u]||u;return f?Object.keys(f).reduce((p,h)=>p.replaceAll(`{${h}}`,String(f[h])),l):l};_s();const r={};let c=0,d=!1;e.innerHTML="";const m=document.createElement("section");m.className="cbi",e.appendChild(m);function g(){if(d)return;const u=U[c],f=u.text[o]||u.text.en;m.innerHTML=`
      <header class="cbi__head">
        <p class="cbi__instruction">${a("cbi.instruction")}</p>
        <div class="cbi__progress">
          <div class="cbi__progress-track">
            <div class="cbi__progress-fill" style="width:${Math.round(c/U.length*100)}%"></div>
          </div>
          <span class="cbi__progress-label">${a("cbi.progress",{current:c+1,total:U.length})}</span>
        </div>
      </header>
      <div class="cbi__question">
        <span class="cbi__qid">${u.id}</span>
        <p class="cbi__qtext">${f}</p>
      </div>
      <div class="cbi__options">
        ${ms.map(l=>`<button type="button" class="cbi__option" data-key="${l}">${a(`cbi.scale_${l}`)}</button>`).join("")}
      </div>
    `,m.querySelectorAll(".cbi__option").forEach(l=>{l.addEventListener("click",()=>{d||(r[u.id]=l.getAttribute("data-key"),c+=1,c>=U.length?w():g())})})}function w(){const u=fs(r);m.innerHTML=`
      <div class="cbi__done">
        <p class="cbi__done-text">${a("cbi.done")}</p>
      </div>
    `,typeof n=="function"&&n(u)}return g(),{destroy(){d=!0}}}function ys(e){if(typeof e=="function"){const t=e("cbi.scale_always");if(t==="Always")return"en";if(t==="Siempre")return"es";if(t==="Sempre")return"ca"}return"ca"}function ae(e){return Math.round(Math.min(100,Math.max(0,e)))}function _s(){if(typeof document>"u"||document.getElementById(Fe))return;const e=document.createElement("style");e.id=Fe,e.textContent=`
.cbi {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #f0f4fc;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
}
.cbi__head { display: flex; flex-direction: column; gap: 0.9rem; }
.cbi__instruction {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
  color: #8b9bb8;
}
.cbi__progress { display: flex; flex-direction: column; gap: 0.4rem; }
.cbi__progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(120, 180, 255, 0.12);
  overflow: hidden;
}
.cbi__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 55%, #6366f1 100%);
  transition: width 0.3s ease;
}
.cbi__progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8b9bb8;
  text-align: center;
}
.cbi__question {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 130px;
  border-radius: 1.25rem;
  background: #07090f;
  border: 1px solid rgba(120, 180, 255, 0.12);
  padding: 1.5rem 1.25rem;
  text-align: center;
}
.cbi__qid {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #22d3ee;
}
.cbi__qtext {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.4;
  max-width: 26ch;
}
.cbi__options { display: flex; flex-direction: column; gap: 0.6rem; }
.cbi__option {
  padding: 0.85rem 1rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: #f0f4fc;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(120, 180, 255, 0.18);
  border-radius: 0.75rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.1s ease, background 0.2s ease;
}
.cbi__option:active { transform: scale(0.98); background: rgba(34, 211, 238, 0.12); }
.cbi__done {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}
.cbi__done-text { margin: 0; font-size: 1.2rem; font-weight: 600; color: #22d3ee; }
`,document.head.appendChild(e)}const vs="pulsepath_last_test_date",ws="pulsepath_last_risk_index";function Ue(){return new Date().toISOString().slice(0,10)}function ks(){return typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`s_${Date.now()}_${Math.random().toString(36).slice(2,10)}`}function Ke(e){const t=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t-s)/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}async function Ss(){const e=new Date;if(e.getDay()===1)return!0;const t=await Z("last_cbi_date");return t?Ke(e)!==Ke(new Date(t)):!0}function Ye(e){return e<35?"#4ade80":e<60?"#facc15":"#f87171"}function xs(e){return e<35?"🟢":e<60?"🟡":"🔴"}function $s(e,{navigate:t}){let n={},s={},o={},a=!1,r=50;e.innerHTML=`
    <section class="screen screen--checkin">
      <div class="glass-card" style="text-align:center;padding:2rem">
        <p style="margin:0;color:var(--text-muted)">${i("common.loading")}</p>
      </div>
    </section>
  `,(async()=>{await K().catch(()=>{}),a=await Ss();const l=await Z("last_cbi_score");l!==null&&(r=Number(l)),m()})();function c(){return a?5:4}function d(l,p){return`
      <div class="step-header">
        <h1 class="step-header__title">${l}</h1>
        <span class="step-indicator" aria-label="Pas ${p} de ${c()}">${p} / ${c()}</span>
      </div>
    `}function m(){const l=j(),p={ca:{low:"Baix",medium:"Mitjà",high:"Alt"},es:{low:"Bajo",medium:"Medio",high:"Alto"},en:{low:"Low",medium:"Medium",high:"High"}}[l]??{low:"Low",medium:"Medium",high:"High"},h={ca:"Sí",es:"Sí",en:"Yes"}[l]??"Sí";e.innerHTML=`
      <section class="screen screen--checkin">
        ${d("Check-in",1)}

        <div class="glass-card" style="display:flex;flex-direction:column;gap:1.1rem">

          <div class="form-field">
            <label for="sleep-input" class="form-label">${i("checkin.sleep_label")}</label>
            <input
              type="number"
              id="sleep-input"
              class="form-input"
              min="0"
              max="12"
              step="0.5"
              placeholder="7"
            >
          </div>

          <div class="form-field">
            <label for="stress-select" class="form-label">${i("checkin.stress_label")}</label>
            <select id="stress-select" class="form-select">
              <option value="low">${p.low}</option>
              <option value="medium" selected>${p.medium}</option>
              <option value="high">${p.high}</option>
            </select>
          </div>

          <div class="form-field">
            <label for="stimulants-select" class="form-label">${i("checkin.stimulants_label")}</label>
            <select id="stimulants-select" class="form-select">
              <option value="no">No</option>
              <option value="yes">${h}</option>
            </select>
          </div>

          <button type="button" class="btn btn-block" id="btn-continue" style="margin-top:0.25rem">
            ${i("checkin.continue")}
          </button>

        </div>
      </section>
    `,e.querySelector("#btn-continue").addEventListener("click",()=>{const _=parseFloat(e.querySelector("#sleep-input").value);n={sleepHours:Number.isNaN(_)?7:Math.min(12,Math.max(0,_)),stress:e.querySelector("#stress-select").value,stimulants:e.querySelector("#stimulants-select").value},g()})}function g(){e.innerHTML=`
      <section class="screen screen--checkin">
        ${d("PVT-B",2)}
        <div class="glass-card" id="pvt-host"></div>
      </section>
    `,es(e.querySelector("#pvt-host"),{onProgress:(l,p)=>{},onComplete:l=>{s=l,w()},t:i})}function w(){e.innerHTML=`
      <section class="screen screen--checkin">
        ${d("Stroop",3)}
        <div class="glass-card" id="stroop-host"></div>
      </section>
    `,ls(e.querySelector("#stroop-host"),{onProgress:(l,p)=>{},onComplete:l=>{o=l,a?u():f()},t:i})}function u(){e.innerHTML=`
      <section class="screen screen--checkin">
        ${d(i("checkin.cbi_step"),4)}
        <div class="glass-card" id="cbi-host"></div>
      </section>
    `,bs(e.querySelector("#cbi-host"),{onComplete:l=>{r=l.globalScore,Promise.all([B("last_cbi_date",Ue()),B("last_cbi_score",r)]).catch(()=>{}).then(()=>f())},t:i})}function f(){const l=c(),p=Kn(s),h=Yn(o),{riskIndex:_,breakdown:b}=Wn({pvtIndex:p,stroopIndex:h,cbiScore:r,sleepHours:n.sleepHours}),k=new Date().toISOString();localStorage.setItem(vs,Ue()),localStorage.setItem(ws,String(_)),ln({id:ks(),takenAt:k,riskIndex:_,pvtIndex:p,stroopIndex:h,cbiScore:r,sleepHours:n.sleepHours,pvtMetrics:s,stroopMetrics:o}).catch(()=>{}),Mn({timestamp:k,risk_index:_,pvt_index:p,stroop_index:h,cbi_score:r,sleep_hours:n.sleepHours}).catch(()=>{});const D=Ye(_),O=xs(_),H=[{label:"PVT",weight:"40%",value:b.pvt,raw:b.pvt},{label:"Stroop",weight:"25%",value:b.stroop,raw:b.stroop},{label:"CBI",weight:"25%",value:b.cbi,raw:b.cbi},{label:"💤",weight:"10%",value:b.sleep,raw:b.sleep}].map(({label:x,weight:N,value:I,raw:E})=>`
      <div class="breakdown-row">
        <span class="breakdown-label">
          ${x}
          <span class="breakdown-label__weight">${N}</span>
        </span>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${Math.min(E,100)}%"></div>
        </div>
        <span class="breakdown-value" style="color:${Ye(E)}">${I}</span>
      </div>
    `).join("");e.innerHTML=`
      <section class="screen screen--checkin">
        <div class="step-header">
          <h1 class="step-header__title">${i("results.title")}</h1>
          <span class="step-indicator">${l} / ${l}</span>
        </div>

        <div class="glass-card">
          <div class="risk-display">
            <span class="risk-display__semaphore" aria-hidden="true">${O}</span>
            <p class="risk-display__label">${i("results.risk_index")}</p>
            <span class="risk-display__number" style="color:${D}">${_}</span>
            <span class="risk-display__denom">/100</span>
          </div>
        </div>

        <div class="glass-card">
          <h3 style="margin:0 0 0.85rem;font-size:0.8rem;font-weight:600;
                     color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em">
            ${i("results.breakdown")}
          </h3>
          ${H}
          <div class="breakdown-total">
            <span>Total</span>
            <span style="color:${D}">${_} / 100</span>
          </div>
        </div>

        <button type="button" class="btn btn--ghost btn-block" id="btn-back-home">
          ${i("common.back")}
        </button>

      </section>
    `,e.querySelector("#btn-back-home").addEventListener("click",()=>{t("home")})}}const Es={ca:"ca-ES",es:"es-ES",en:"en-GB"};function V(e){return e<35?"#4ade80":e<60?"#facc15":"#f87171"}function lt(){return Es[j()]??"ca-ES"}function Cs(e){const t=new Date(e);return Number.isNaN(t.getTime())?String(e):new Intl.DateTimeFormat(lt(),{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(t)}function We(e){const[t,n,s]=e.split("-").map(Number),o=new Date(t,n-1,s);return Number.isNaN(o.getTime())?e:new Intl.DateTimeFormat(lt(),{weekday:"short",day:"numeric",month:"short"}).format(o)}function Ts(e){return[...e].sort((t,n)=>String(t.takenAt).localeCompare(String(n.takenAt)))}function Ls(e){const t=new Date;return t.setHours(0,0,0,0),t.setDate(t.getDate()-6),e.filter(n=>{const s=new Date(n.takenAt);return!Number.isNaN(s.getTime())&&s>=t})}function As(e){const n=Ls(e).map(s=>Number(s.riskIndex)).filter(s=>Number.isFinite(s));return n.length===0?null:Math.round(n.reduce((s,o)=>s+o,0)/n.length)}function Ds(e){const t=new Map;for(const n of e){const s=Number(n.riskIndex);if(!Number.isFinite(s))continue;const o=String(n.takenAt).slice(0,10);t.has(o)||t.set(o,[]),t.get(o).push(s)}return[...t.entries()].map(([n,s])=>({day:n,avg:s.reduce((o,a)=>o+a,0)/s.length}))}function Is(e){const t=Ds(e);if(t.length===0)return{best:null,worst:null};let n=t[0],s=t[0];for(const o of t)o.avg<n.avg&&(n=o),o.avg>s.avg&&(s=o);return{best:n,worst:s}}function Rs(e){const t=e.map(l=>Number(l.riskIndex)).filter(l=>Number.isFinite(l));if(t.length===0)return"";const n=280,s=72,o={t:10,r:10,b:10,l:10},a=n-o.l-o.r,r=s-o.t-o.b,c=t.map((l,p)=>{const h=t.length===1?o.l+a/2:o.l+p/(t.length-1)*a,_=o.t+r-l/100*r;return{x:h,y:_,v:l}}),d=c.map(l=>`${l.x},${l.y}`).join(" "),m=o.t+r,g=`${o.l},${m} ${d} ${c[c.length-1].x},${m}`,w=[35,60].map(l=>{const p=o.t+r-l/100*r;return`<line x1="${o.l}" y1="${p}" x2="${n-o.r}" y2="${p}"
      stroke="rgba(139,155,184,0.2)" stroke-width="1" stroke-dasharray="3 3"/>`}).join(""),u=c.map(l=>`<circle cx="${l.x}" cy="${l.y}" r="3" fill="${V(l.v)}"
      stroke="rgba(7,9,15,0.6)" stroke-width="1.5"/>`).join(""),f=t.length>1?`<polygon points="${g}" fill="url(#history-spark-fill)"/>
       <polyline points="${d}" fill="none" stroke="#22d3ee"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`:`<circle cx="${c[0].x}" cy="${c[0].y}" r="5" fill="#22d3ee"/>`;return`
    <svg viewBox="0 0 ${n} ${s}" width="100%" height="${s}"
      role="img" aria-label="${i("history.trend_title")}"
      style="display:block;margin-top:0.5rem">
      <defs>
        <linearGradient id="history-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(34,211,238,0.3)"/>
          <stop offset="100%" stop-color="rgba(34,211,238,0)"/>
        </linearGradient>
      </defs>
      ${w}
      ${f}
      ${u}
    </svg>
  `}function Ms(){return`
    <svg class="empty-state__svg" width="200" height="56" viewBox="0 0 200 56"
         aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 28 H60 L72 8 L84 48 L96 20 L108 36 L120 28 H200"
        stroke="rgba(34,211,238,0.35)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `}function Ps(e){const t=Number(e.riskIndex),n=Number.isFinite(t),s=n?V(t):"var(--text-muted)";return`
    <div class="session-card">
      <span class="session-card__date">${Cs(e.takenAt)}</span>
      <div class="session-card__risk">
        <span class="session-card__risk-label">${i("history.risk_label")}</span>
        <span class="session-card__risk-value" style="color:${s}">
          ${n?t:"—"}
        </span>
      </div>
    </div>
  `}function Ns(e){const t=As(e),n=e.length>=3,{best:s,worst:o}=n?Is(e):{best:null,worst:null};if(t===null&&!n)return"";const a="display:flex;flex-direction:column;gap:0.15rem",r="font-size:0.75rem;color:var(--text-muted)",c="font-size:1.1rem;font-weight:600";return`
    <div class="glass-card">
      <h2 style="margin:0 0 0.85rem;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
        ${i("history.summary_title")}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(5.5rem,1fr));gap:0.85rem">
        ${t!==null?`
          <div style="${a}">
            <span style="${r}">${i("history.week_avg")}</span>
            <span style="${c};color:${V(t)}">${t}</span>
          </div>
        `:""}
        ${s?`
          <div style="${a}">
            <span style="${r}">${i("history.best_day")}</span>
            <span style="${c};color:${V(Math.round(s.avg))}">
              ${We(s.day)}
              <span style="font-size:0.8rem;font-weight:500;color:var(--text-muted)">
                (${Math.round(s.avg)})
              </span>
            </span>
          </div>
        `:""}
        ${o?`
          <div style="${a}">
            <span style="${r}">${i("history.worst_day")}</span>
            <span style="${c};color:${V(Math.round(o.avg))}">
              ${We(o.day)}
              <span style="font-size:0.8rem;font-weight:500;color:var(--text-muted)">
                (${Math.round(o.avg)})
              </span>
            </span>
          </div>
        `:""}
      </div>
    </div>
  `}function Ge(e){return`
    <section class="screen screen--history">
      <h1 class="screen__title">${i("history.title")}</h1>
      <p class="screen__subtitle">${i("history.subtitle")}</p>
      <div class="glass-card">
        <div class="empty-state">
          ${Ms()}
          <p class="empty-state__title">${i("history.empty_title")}</p>
          <p class="empty-state__body">${i("history.empty_body")}</p>
        </div>
      </div>
      ${typeof e=="function"?`
        <button type="button" class="btn btn--ghost btn-block" id="btn-history-back">
          ${i("common.back")}
        </button>
      `:""}
    </section>
  `}function Bs(e,t){const n=Ts(e),s=Ns(e),o=e.map(Ps).join("");return`
    <section class="screen screen--history">
      <h1 class="screen__title">${i("history.title")}</h1>
      <p class="screen__subtitle">${i("history.subtitle")}</p>

      <div class="glass-card">
        <h2 style="margin:0;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
          ${i("history.trend_title")}
        </h2>
        ${Rs(n)}
        <div class="sparkline-legend">
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#4ade80"></span>
            &lt;35
          </span>
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#facc15"></span>
            &lt;60
          </span>
          <span class="sparkline-legend__item">
            <span class="sparkline-legend__dot" style="background:#f87171"></span>
            ≥60
          </span>
        </div>
      </div>

      ${s}

      <div class="glass-card">
        <h2 style="margin:0 0 0.75rem;font-size:0.95rem;font-weight:600;color:var(--text-primary)">
          ${i("history.sessions_title")}
        </h2>
        <div>
          ${o}
        </div>
      </div>

      ${typeof t=="function"?`
        <button type="button" class="btn btn--ghost btn-block" id="btn-history-back">
          ${i("common.back")}
        </button>
      `:""}
    </section>
  `}function Ve(e,t){var n;(n=e.querySelector("#btn-history-back"))==null||n.addEventListener("click",()=>{t("home")})}function qs(e,{navigate:t}={}){e.innerHTML=`
    <section class="screen screen--history">
      <h1 class="screen__title">${i("history.title")}</h1>
      <p class="screen__subtitle" style="margin-bottom:1rem">${i("common.loading")}</p>
      <div class="glass-card">
        <p style="margin:0;color:var(--text-muted);text-align:center">${i("common.loading")}</p>
      </div>
    </section>
  `,(async()=>{try{await K();const n=await cn(30);n.length?e.innerHTML=Bs(n,t):e.innerHTML=Ge(t),Ve(e,t)}catch{e.innerHTML=Ge(t),Ve(e,t)}})()}const js={ca:"CA",es:"ES",en:"EN"};function Os(e){if(!e)return;const t=j();e.className="lang-switcher",e.setAttribute("role","group"),e.setAttribute("aria-label",i("onboarding.language_label")),e.replaceChildren(...J.flatMap((n,s)=>{const o=document.createElement("button");if(o.type="button",o.className="lang-switcher__btn",o.dataset.lang=n,o.textContent=js[n],o.setAttribute("aria-pressed",n===t?"true":"false"),n===t&&o.classList.add("lang-switcher__btn--active"),s===0)return[o];const a=document.createElement("span");return a.className="lang-switcher__sep",a.textContent="|",a.setAttribute("aria-hidden","true"),[a,o]}))}function Hs(e,t){e==null||e.addEventListener("click",n=>{const s=n.target.closest("[data-lang]");if(!(s!=null&&s.dataset.lang))return;const o=s.dataset.lang;o!==j()&&et(o)})}const zs=new Set(["home","history"]),ct={onboarding:Pn,home:Fn,checkin:$s,history:qs};let _e=null,ue=!1;const q=document.getElementById("view"),A=document.getElementById("bottom-nav"),dt=document.getElementById("lang-switcher");function ge(){return ue}function ut(){return ue?"home":"onboarding"}function Fs(e){A==null||A.classList.toggle("bottom-nav--hidden",!e),q==null||q.classList.toggle("view--no-nav",!e)}function Us(e){A==null||A.querySelectorAll(".bottom-nav__item").forEach(t=>{const n=t.dataset.route===e;t.setAttribute("aria-current",n?"page":"false")})}function Ks(){document.querySelectorAll("[data-i18n]").forEach(e=>{const t=e.dataset.i18n;t&&(e.textContent=i(t))})}function Ys(){document.documentElement.lang=j()}function pt(){Ys(),Ks(),Os(dt)}function Ws(){if(pt(),_e&&q){const e=ct[_e];e&&e(q,{navigate:ee})}}function ee(e){!ge()&&e!=="onboarding"&&(e="onboarding"),ge()&&e==="onboarding"&&(e="home");const t=ct[e];if(!t||!q)return;_e=e;const n=ge()&&zs.has(e);Fs(n),n&&Us(e),t(q,{navigate:ee})}function Gs(){A==null||A.addEventListener("click",e=>{const t=e.target.closest("[data-route]");t!=null&&t.dataset.route&&ee(t.dataset.route)})}function Vs(){window.addEventListener("pulsepath:auth-changed",async()=>{ue=!!await de(),ee(ut())})}function Js(){window.addEventListener("languageChanged",()=>{Ws()})}async function Qs(){await K(),await $e(),ue=!!await de(),pt(),Hs(dt),Gs(),Vs(),Js(),ee(ut())}Qs();
