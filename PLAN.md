# PulsePath — Plan de Implementación: Demo → Producción

> Piloto Ayuntamiento de Barcelona · Expediente 2026_OVT_694068  
> Última actualización: 5 junio 2026 (v2 — i18n ca/es/en + Informe de Impacto PDF)  
> Scope: 50 funcionarios · 8 semanas · MVP listo antes de septiembre 2026

---

## Guía de modelos de IA recomendados

Antes de empezar, referencia rápida de cuándo usar qué. Aplícala en cada sección del plan.


| Modelo                                | Coste      | Cuándo usarlo                                                                                |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **composer-2.5-fast**                 | Mínimo     | Boilerplate, HTML, CSS, archivos de config simples                                           |
| **composer-2.5**                      | Bajo       | Código de conectividad simple, rutas Express básicas, scripts de un solo propósito           |
| **claude-4.6-sonnet-medium-thinking** | Medio      | La mayoría del código de producto: tests cognitivos, lógica de negocio, componentes          |
| **gpt-5.3-codex**                     | Medio      | Alternativa sólida a Sonnet para código puro y algoritmos; buen razonamiento estructural     |
| **gpt-5.5-medium**                    | Medio-alto | Cuando necesitas razonamiento + generación de código en un paso; buen para revisión          |
| **claude-opus-4-8-thinking-high**     | Alto       | Solo para los problemas más difíciles: K-anonimidad, Web Crypto, lógica de seguridad crítica |


**Regla general:** empieza siempre con el modelo más barato que pueda hacerlo bien. Sube solo si la primera respuesta no es correcta o el problema requiere razonamiento profundo. **composer-2.5** cubre el ~60% del trabajo.

---

## Decisiones de arquitectura consolidadas


| Tema               | Decisión                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Punto de partida   | Proyecto nuevo en `/pulsepath/`, prototipo como referencia                                           |
| Modelo de riesgo   | Fórmula determinista (pesos 0.40/0.25/0.25/0.10), módulo `risk_engine` aislado y reemplazable por ML |
| Check-in           | Diario ligero (PVT + Stroop + micro-check 3 preguntas) + CBI semanal (19 preguntas fijas)            |
| Adaptatividad      | Por reglas simples (no LLM — destruiría el argumento de privacidad Edge AI)                          |
| Base de datos      | PostgreSQL 16                                                                                        |
| Push notifications | Nice-to-have, Fase 6 opcional; no bloquea MVP                                                        |
| Multi-tenant       | Sí desde el inicio (org_id)                                                                          |
| Despliegue         | Docker + docker-compose en Contabo (Ubuntu)                                                          |
| Auth empleador     | Login usuario/contraseña → JWT                                                                       |
| Metadata K-anon    | department + shift únicamente (sin género/edad para evitar grupos < 5 con 50 personas)               |
| Idiomas (i18n)     | Catalán (`ca`, por defecto), castellano (`es`), inglés (`en`) — app del empleado                     |
| Informe de impacto | PDF ejecutivo generado server-side con Puppeteer, motor de conclusiones por reglas                   |


---

## Stack tecnológico

### Backend (servidor Contabo — Alemania)

- Node.js 20 LTS + Express
- PostgreSQL 16
- Prisma (ORM — esquema declarativo, ideal para vibe coding)
- `jsonwebtoken` · `bcrypt` · `helmet` · `cors` · `express-rate-limit`
- Cifrado en reposo: módulo `crypto` nativo de Node (AES-256-GCM)
- **Puppeteer** (Chromium headless) para generar el Informe de Impacto en PDF server-side
- Docker + docker-compose + Nginx + Certbot (SSL)

### Employee App (PWA)

- Vanilla JS + Vite (sin frameworks — mantiene estilo actual, añade build PWA + env vars)
- Web Crypto API (cifrado local + SHA-256 del código anónimo)
- IndexedDB vía librería `idb` (fallback localStorage)
- Workbox (Service Worker, PWA instalable)

### Employer Dashboard

- Vanilla JS + Vite + Chart.js

---

## Estructura de carpetas final

```
pulsepath/
├── docker-compose.yml
├── .env.example
├── README.md
├── PLAN.md                        ← este archivo
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── config/env.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── rateLimit.js
│       ├── lib/
│       │   ├── crypto.js
│       │   └── kanon.js
│       ├── routes/
│       │   ├── session.routes.js
│       │   ├── auth.routes.js
│       │   ├── dashboard.routes.js
│       │   └── admin.routes.js
│       ├── controllers/
│       │   ├── session.controller.js
│       │   ├── auth.controller.js
│       │   └── dashboard.controller.js
│       └── reports/
│           ├── report.controller.js   ← endpoint /report.pdf, orquesta render → Puppeteer
│           ├── insights.js            ← motor de conclusiones por reglas (no IA generativa)
│           ├── template.html          ← plantilla HTML del informe ejecutivo
│           └── report.css             ← estilos print del informe (A4, semáforo PRL)
│
├── employee-app/
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── public/icons/
│   └── src/
│       ├── main.js
│       ├── styles.css
│       ├── api/client.js
│       ├── storage/db.js
│       ├── crypto/local.js
│       ├── i18n/
│       │   ├── index.js        ← función t('key'), detecta y carga idioma activo
│       │   ├── ca.json         ← catalán (idioma por defecto)
│       │   ├── es.json         ← castellano
│       │   └── en.json         ← inglés
│       ├── screens/
│       │   ├── onboarding.js
│       │   ├── home.js
│       │   ├── checkin.js
│       │   └── history.js
│       └── tests/
│           ├── pvt.js
│           ├── stroop.js
│           ├── cbi.js
│           └── risk_engine.js
│
└── employer-dashboard/
    ├── vite.config.js
    ├── package.json
    ├── index.html
    └── src/
        ├── main.js
        ├── styles.css
        ├── api/client.js
        ├── auth/login.js
        ├── components/
        │   ├── filters.js
        │   ├── charts.js
        │   ├── alerts.js
        │   ├── exportCsv.js
        │   └── reportButton.js     ← botón "Generar informe PDF" (un clic → descarga)
        └── views/dashboard.js
```

---

## Inventario completo de archivos

Cada entrada incluye: descripción, complejidad y modelo de IA recomendado.

### Raíz del proyecto


| Archivo              | Qué hace                                               | Complejidad | Modelo                |
| -------------------- | ------------------------------------------------------ | ----------- | --------------------- |
| `docker-compose.yml` | Orquesta backend + postgres + nginx                    | Media       | **composer-2.5**      |
| `.env.example`       | Variables de entorno documentadas (sin valores reales) | Simple      | **composer-2.5-fast** |
| `README.md`          | Instrucciones de arranque del proyecto                 | Simple      | **composer-2.5-fast** |


### Backend — Infraestructura


| Archivo                | Qué hace                                                                    | Complejidad | Modelo                |
| ---------------------- | --------------------------------------------------------------------------- | ----------- | --------------------- |
| `backend/Dockerfile`   | Imagen Node 20 LTS + dependencias                                           | Simple      | **composer-2.5-fast** |
| `backend/package.json` | Dependencias del backend                                                    | Simple      | **composer-2.5-fast** |
| `prisma/schema.prisma` | Define todas las tablas (ver §Esquema DB)                                   | Media       | **composer-2.5**      |
| `prisma/seed.js`       | Crea org BCN + 50 códigos `BCN-2026-Axxx` + hashea cada uno                 | Media       | **composer-2.5**      |
| `src/index.js`         | Configura Express, carga middlewares, monta rutas, manejo de errores global | Simple      | **composer-2.5**      |
| `src/config/env.js`    | Carga y valida variables de entorno; falla si falta alguna crítica          | Simple      | **composer-2.5-fast** |


### Backend — Middleware


| Archivo                   | Qué hace                                                                      | Complejidad | Modelo                |
| ------------------------- | ----------------------------------------------------------------------------- | ----------- | --------------------- |
| `middleware/auth.js`      | Verifica JWT del empleador en rutas del dashboard; rechaza anónimos sin token | Simple      | **composer-2.5**      |
| `middleware/rateLimit.js` | Rate limiting por IP (más estricto en `/auth`, más suave en `/session`)       | Simple      | **composer-2.5-fast** |


### Backend — Librerías críticas


| Archivo         | Qué hace                                                                                                                                                         | Complejidad  | Modelo                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------- |
| `lib/crypto.js` | AES-256-GCM: cifrar al guardar, descifrar en memoria al agregar. Gestión de IV/tag.                                                                              | **Compleja** | **claude-opus-4-8-thinking-high** |
| `lib/kanon.js`  | Núcleo de K-anonimidad: agrupa sesiones por (dept, shift), suprime grupos < 5, calcula medias, % riesgo alto, tendencias. Descifra en memoria, nunca expone raw. | **Compleja** | **claude-opus-4-8-thinking-high** |


### Backend — Rutas y controladores


| Archivo                               | Qué hace                                                                                                                                                      | Complejidad  | Modelo                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| `routes/auth.routes.js`               | Monta POST /auth/anonymous y POST /auth/login                                                                                                                 | Simple       | **composer-2.5-fast**                 |
| `routes/session.routes.js`            | Monta POST /session                                                                                                                                           | Simple       | **composer-2.5-fast**                 |
| `routes/dashboard.routes.js`          | Monta GET /dashboard/:orgId y GET /dashboard/:orgId/export.csv                                                                                                | Simple       | **composer-2.5-fast**                 |
| `routes/admin.routes.js`              | Monta POST /admin/codes (uso interno, protegido por header secreto)                                                                                           | Simple       | **composer-2.5-fast**                 |
| `controllers/auth.controller.js`      | Lógica de activación de código anónimo (busca code_hash, verifica org, emite JWT-anon) + login empleador (bcrypt + JWT-employer) + registro de consentimiento | Media        | **claude-4.6-sonnet-medium-thinking** |
| `controllers/session.controller.js`   | Recibe payload del empleado, valida campos permitidos (rechaza cualquier campo extra), cifra cada índice con AES, escribe en DB                               | Media        | **claude-4.6-sonnet-medium-thinking** |
| `controllers/dashboard.controller.js` | Llama a kanon.js con los filtros, devuelve JSON agregado, gestiona el caso K-protegido                                                                        | **Compleja** | **claude-4.6-sonnet-medium-thinking** |


### Employee App — Tests cognitivos


| Archivo                | Qué hace                                                                                                                                                                                                                       | Complejidad  | Modelo                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------- |
| `tests/pvt.js`         | PVT-B completo: 30 ensayos, ISI aleatorio 1000-4000ms, medición con `performance.now()`, detección de lapses >355ms y false starts, cálculo de media/mediana/SD/percentil-10%, progress indicator, devuelve objeto de métricas | **Compleja** | **claude-opus-4-8-thinking-high**     |
| `tests/stroop.js`      | Stroop 20 ensayos incongruentes: selección aleatoria garantizando que tinta ≠ palabra, registro RT por ítem, cálculo de media/error rate/interferencia                                                                         | Media        | **claude-4.6-sonnet-medium-thinking** |
| `tests/cbi.js`         | CBI 19 ítems: presenta preguntas por subescala (Personal/Work/Client), scoring 100/75/50/25/0, calcula media por subescala y puntuación global, detecta burnout ≥50                                                            | Media        | **claude-4.6-sonnet-medium-thinking** |
| `tests/risk_engine.js` | Combina PVT/Stroop/CBI/sueño en índice 0-100 con los pesos definidos. Módulo aislado y reemplazable. Incluye sleep_penalty.                                                                                                    | Media        | **composer-2.5**                      |


### Employee App — Pantallas y funcionalidad


| Archivo                 | Qué hace                                                                                                                                            | Complejidad  | Modelo                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| `screens/onboarding.js` | Pantalla de bienvenida → consentimiento RGPD → campo código anónimo → hash SHA-256 local → call /auth/anonymous → guarda token cifrado en IndexedDB | Media        | **claude-4.6-sonnet-medium-thinking** |
| `screens/home.js`       | Pantalla principal: muestra estado del día (test pendiente/completado), historial resumido, botón de inicio                                         | Media        | **composer-2.5**                      |
| `screens/checkin.js`    | Orquesta el flujo diario: micro-check (sueño/estrés/estimulantes) → PVT → Stroop → (si semana) CBI → risk_engine → guardar local → POST /session    | **Compleja** | **claude-4.6-sonnet-medium-thinking** |
| `screens/history.js`    | Muestra historial local de tests con gráfica de tendencia del índice                                                                                | Media        | **composer-2.5**                      |
| `storage/db.js`         | IndexedDB: guardar/leer historial de sesiones, token, configuración. Fallback a localStorage.                                                       | Media        | **claude-4.6-sonnet-medium-thinking** |
| `crypto/local.js`       | Web Crypto API: derecha clave AES de token anónimo (PBKDF2), cifra/descifra datos locales, exportar historial como JSON cifrado                     | **Compleja** | **claude-opus-4-8-thinking-high**     |
| `api/client.js`         | fetch wrapper al backend: adjunta token, maneja errores, valida que el payload solo contiene campos permitidos antes de enviarlo                    | Simple       | **composer-2.5**                      |
| `main.js`               | Router/SPA: gestiona navegación entre pantallas, detecta si es primera vez (redirige a onboarding)                                                  | Media        | **composer-2.5**                      |


### Employee App — Internacionalización (i18n)

Idiomas: catalán (`ca`, por defecto), castellano (`es`), inglés (`en`). El catalán es el idioma por defecto porque el piloto es con el Ayuntamiento de Barcelona (administración catalana).


| Archivo         | Qué hace                                                                                                                                                          | Complejidad | Modelo                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| `i18n/index.js` | Carga el JSON del idioma activo (guardado en localStorage), expone función `t('key')` para obtener cualquier string traducido, permite cambiar idioma en caliente | Simple      | **composer-2.5**      |
| `i18n/ca.json`  | Todas las cadenas de texto de la app en catalán: tests, botones, mensajes de resultado, texto legal del consentimiento RGPD, errores                              | Simple      | **composer-2.5-fast** |
| `i18n/es.json`  | Ídem en castellano                                                                                                                                                | Simple      | **composer-2.5-fast** |
| `i18n/en.json`  | Ídem en inglés                                                                                                                                                    | Simple      | **composer-2.5-fast** |


### Employee App — PWA


| Archivo                | Qué hace                                                                           | Complejidad | Modelo                                |
| ---------------------- | ---------------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| `sw.js`                | Service Worker: cache de assets (offline-first), manejo de push (Fase 6)           | Media       | **claude-4.6-sonnet-medium-thinking** |
| `manifest.webmanifest` | Metadatos PWA: nombre, iconos, colores, display standalone                         | Simple      | **composer-2.5-fast**                 |
| `vite.config.js`       | Build con Workbox, variables de entorno VITE_API_URL                               | Simple      | **composer-2.5-fast**                 |
| `styles.css`           | Estilo oscuro (#07090F), glassmorphism, Outfit, gradientes cyan-azul, mobile-first | Simple      | **composer-2.5**                      |


### Employer Dashboard


| Archivo                      | Qué hace                                                                                                                                     | Complejidad | Modelo                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| `auth/login.js`              | Formulario de login, POST /auth/login, guarda JWT en sessionStorage                                                                          | Simple      | **composer-2.5**                      |
| `views/dashboard.js`         | Orquesta la carga de datos: llama API, pasa a componentes, gestiona estado de filtros                                                        | Media       | **claude-4.6-sonnet-medium-thinking** |
| `components/charts.js`       | Chart.js: gráfica de tendencia (línea) + distribución de riesgo (barras) por departamento                                                    | Media       | **claude-4.6-sonnet-medium-thinking** |
| `components/filters.js`      | UI de filtros (departamento/turno/rango de fechas) que emiten eventos para recargar datos                                                    | Media       | **composer-2.5**                      |
| `components/alerts.js`       | Comprueba si algún grupo tiene % de riesgo alto > 20%; muestra banner rojo si sí                                                             | Simple      | **composer-2.5**                      |
| `components/exportCsv.js`    | Genera y descarga CSV con los datos agregados del JSON del dashboard (nunca datos individuales)                                              | Simple      | **composer-2.5**                      |
| `components/reportButton.js` | Botón "Generar informe de impacto (PDF)": llama a `/report.pdf` con los filtros activos, muestra spinner, descarga el archivo. Un solo clic. | Simple      | **composer-2.5**                      |
| `api/client.js`              | fetch al backend con JWT empleador adjunto                                                                                                   | Simple      | **composer-2.5-fast**                 |
| `styles.css`                 | Estilo desktop oscuro, coherente con app del empleado                                                                                        | Simple      | **composer-2.5**                      |


### Backend — Informe de Impacto (PDF)

Generación server-side con Puppeteer (ver justificación en §Informe de Impacto Periódico). El backend ya posee los datos agregados con K-anonimidad, por lo que el informe nunca expone datos individuales.


| Archivo                        | Qué hace                                                                                                                                                                                                | Complejidad  | Modelo                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| `reports/report.controller.js` | Endpoint `GET /dashboard/:orgId/report.pdf`: obtiene los agregados K-anon, ejecuta `insights.js`, inyecta datos en `template.html`, lanza Puppeteer (headless Chromium) y devuelve el PDF como descarga | **Compleja** | **claude-4.6-sonnet-medium-thinking** |
| `reports/insights.js`          | Motor de conclusiones automáticas basado en reglas (sin IA generativa): convierte los datos agregados en frases ejecutivas, semáforos PRL y recomendaciones accionables                                 | **Compleja** | **claude-opus-4-8-thinking-high**     |
| `reports/template.html`        | Plantilla HTML del informe ejecutivo: portada, secciones, placeholders de datos, contenedores `<canvas>` para Chart.js renderizado dentro de Puppeteer                                                  | Media        | **claude-4.6-sonnet-medium-thinking** |
| `reports/report.css`           | Estilos de impresión A4: tipografía, paleta corporativa, código de colores semáforo (verde/amarillo/rojo) reconocible para técnicos de PRL, saltos de página                                            | Media        | **composer-2.5**                      |


---

## Esquema de base de datos (PostgreSQL)

```sql
-- Organizaciones clientes
TABLE organizations
  id              UUID          PK  DEFAULT gen_random_uuid()
  name            TEXT          NOT NULL    -- "Ayuntamiento de Barcelona"
  slug            TEXT          UNIQUE      -- "ayuntamiento_bcn"
  pilot_ref       TEXT                      -- "2026_OVT_694068"
  created_at      TIMESTAMPTZ   DEFAULT now()
  retention_until DATE          NOT NULL    -- fin_piloto + 12 meses → job de borrado

-- Códigos de acceso anónimos (1 por empleado)
TABLE access_codes
  id              UUID          PK  DEFAULT gen_random_uuid()
  org_id          UUID          FK → organizations.id
  code_hash       TEXT          UNIQUE NOT NULL   -- SHA-256 del código (nunca en claro)
  department      TEXT          NOT NULL
  shift           TEXT                            -- "morning" | "afternoon" | NULL
  activated_at    TIMESTAMPTZ                     -- NULL hasta que el empleado activa
  revoked         BOOLEAN       DEFAULT false

-- Sesiones de test (una fila por test completado)
TABLE sessions
  id              UUID          PK  DEFAULT gen_random_uuid()
  org_id          UUID          FK → organizations.id
  code_hash       TEXT          FK → access_codes.code_hash
  department      TEXT          NOT NULL          -- desnormalizado para queries de agregación
  shift           TEXT
  taken_at        TIMESTAMPTZ   NOT NULL
  risk_index_enc  BYTEA         NOT NULL          -- AES-256-GCM
  pvt_index_enc   BYTEA         NOT NULL
  stroop_index_enc BYTEA        NOT NULL
  cbi_score_enc   BYTEA                           -- NULL en días sin CBI semanal
  sleep_hours_enc BYTEA         NOT NULL
  -- NUNCA: tiempos crudos de reacción, respuestas individuales CBI, IP, nombre, email

-- Usuarios del dashboard (RRHH del empleador)
TABLE employer_users
  id              UUID          PK  DEFAULT gen_random_uuid()
  org_id          UUID          FK → organizations.id
  email           TEXT          UNIQUE NOT NULL
  password_hash   TEXT          NOT NULL          -- bcrypt
  role            TEXT          DEFAULT 'viewer'  -- "admin" | "viewer"
  created_at      TIMESTAMPTZ   DEFAULT now()

-- Registro de consentimientos RGPD
TABLE consents
  id              UUID          PK  DEFAULT gen_random_uuid()
  code_hash       TEXT          FK → access_codes.code_hash
  consented_at    TIMESTAMPTZ   NOT NULL
  policy_version  TEXT          NOT NULL          -- "1.0"
```

**Relaciones:** `organizations 1—N access_codes`, `organizations 1—N sessions`, `access_codes 1—N sessions`, `organizations 1—N employer_users`, `access_codes 1—1 consents`.

**Borde de cifrado:** los índices se almacenan siempre cifrados (BYTEA). Se descifran solo en memoria dentro de `kanon.js` durante la agregación. Nunca salen del backend descifrados.

---

## Endpoints de la API REST

### `POST /api/v1/auth/anonymous`

Activa un código y emite token anónimo. El código en claro nunca llega al servidor.

```json
// request
{
  "org_slug": "ayuntamiento_bcn",
  "code_hash": "9f86d0818...",
  "consent": true,
  "policy_version": "1.0"
}
// response 200
{ "token": "<jwt-anon>", "department": "atencion_ciudadana", "shift": "morning" }
// 404 → código no existe | 409 → revocado | 400 → ya activado por otro dispositivo
```

### `POST /api/v1/auth/login`

Login del empleador.

```json
// request
{ "email": "rrhh@bcn.cat", "password": "..." }
// response 200
{ "token": "<jwt-employer>", "org_id": "uuid...", "role": "admin" }
// 401 → credenciales incorrectas
```

### `POST /api/v1/session`

El teléfono envía el resultado del test. Requiere token anónimo.

```json
// request (Authorization: Bearer <jwt-anon>)
{
  "timestamp": "2026-10-15T09:30:00Z",
  "risk_index": 67,
  "pvt_index": 72,
  "stroop_index": 55,
  "cbi_score": 68,
  "sleep_hours": 5
}
// response 201
{ "status": "stored" }
// 400 → si llega cualquier campo fuera de la whitelist (rechaza y registra intento)
```

### `GET /api/v1/dashboard/:orgId`

Datos agregados con K-anonimidad. Requiere JWT de empleador.

```
Query: ?department=atencion_ciudadana&shift=morning&from=2026-10-01&to=2026-10-31
```

```json
// response 200
{
  "groups": [
    {
      "department": "atencion_ciudadana",
      "count": 23,
      "avg_risk_index": 58,
      "avg_pvt_index": 64,
      "avg_stroop_index": 52,
      "pct_high_risk": 26,
      "trend": [52, 55, 58, 61],
      "kanon_protected": false
    },
    {
      "department": "rrhh",
      "count": 3,
      "kanon_protected": true,
      "message": "Protected (K-anonymity)"
    }
  ],
  "org_total": {
    "count": 50,
    "avg_risk_index": 54,
    "pct_high_risk": 18
  }
}
```

### `GET /api/v1/dashboard/:orgId/export.csv`

CSV agregado ya filtrado por K=5. Requiere JWT de empleador.

### `GET /api/v1/dashboard/:orgId/report.pdf`

Genera el Informe de Impacto en PDF. Requiere JWT de empleador. Acepta los mismos query params que el dashboard + `?period=week|fortnight|full&lang=ca|es|en`.

```
Query: ?from=2026-10-01&to=2026-10-31&period=fortnight&lang=ca
```

Respuesta: `Content-Type: application/pdf` con `Content-Disposition: attachment`. El backend obtiene los agregados K-anon, ejecuta `insights.js`, renderiza `template.html` con Puppeteer y devuelve el binario. Si todos los grupos quedan bajo K=5, el informe se genera igualmente pero con secciones marcadas "Datos insuficientes para informar (K-anonimidad)".

### `POST /api/v1/me/delete`

Derecho de supresión RGPD. Borra todas las sesiones del token.

```json
// request (Authorization: Bearer <jwt-anon>)
{}
// response 200
{ "deleted_sessions": 14 }
```

### `POST /api/v1/admin/codes` (interno)

Genera N códigos para una org. Devuelve la lista en claro **una sola vez** (para imprimir y repartir). El servidor guarda solo el hash. Protegido por header `X-Admin-Secret`.

```json
// request
{ "org_slug": "ayuntamiento_bcn", "count": 50, "department_map": { "BCN-2026-A001-A025": "atencion_ciudadana", "BCN-2026-A026-A050": "informatica" } }
// response 201
{ "codes": ["BCN-2026-A001", "BCN-2026-A002", ...] }
```

---

## Flujo de usuario completo (extremo a extremo)

### Empleado — Primera vez

1. Abre la PWA → detecta que no hay token local → redirige a **onboarding**.
2. Lee la pantalla de **consentimiento RGPD** (qué se recoge, qué no, derecho de supresión). Acepta.
3. Introduce su código `BCN-2026-A007`.
4. El cliente hashea el código con **SHA-256** en el dispositivo → `code_hash`. El código en claro nunca sale del dispositivo.
5. `POST /auth/anonymous` → recibe token anónimo + departamento + turno.
6. Token se cifra con Web Crypto y se guarda en **IndexedDB**.
7. Pantalla de home: "Bienvenido a PulsePath. Tu primer test te espera."

### Empleado — Uso diario (lunes-viernes, ~3-4 min)

1. Notificación o acceso manual → home → "Test de hoy".
2. **Micro-check** (3 preguntas: horas de sueño, nivel de estrés, estimulantes). 15 segundos.
3. **PVT-B** (30 ensayos, progress indicator "12/30", ISI 1000-4000ms, detecta lapses >355ms y false starts).
4. **Stroop** (20 ensayos incongruentes, 4 colores).
5. Si es el día de check-in semanal → **CBI** (19 preguntas, ~3 min adicionales).
6. `risk_engine.js` calcula **localmente**: PVT_index × 0.40 + Stroop_index × 0.25 + CBI_score × 0.25 + sleep_penalty × 0.10.
7. Resultado cifrado se guarda en **IndexedDB** (historial local completo).
8. `POST /session` envía **solo** los índices + metadata anónima al servidor Contabo.
9. Pantalla de resultado: índice del día + comparativa con tu semana anterior.

### Empleador — Dashboard

1. RRHH accede a la URL del dashboard → **login** (email + contraseña) → JWT.
2. `GET /dashboard/:orgId` → backend descifra índices en memoria → `kanon.js` agrega por grupos → devuelve JSON.
3. Ve medias por departamento, % de riesgo alto, tendencia temporal.
4. Si algún departamento tiene > **20% de riesgo alto** → banner de alerta rojo.
5. Filtra por departamento / turno / rango de fechas.
6. Exporta **CSV** (siempre agregado, nunca individual).
7. Imposible ver a un individuo: no hay datos individuales legibles en el servidor + K=5 suprime grupos pequeños.

---

## Orden de implementación por fases

### FASE 0 — Esqueleto (estimación: medio día)

**Objetivo:** repo funcionando localmente con DB conectada.

1. `docker-compose.yml` con postgres + backend stub
2. `prisma/schema.prisma` (todas las tablas)
3. `prisma/seed.js` (org BCN + 50 códigos)
4. `backend/src/index.js` (Express básico, health check en GET /)
5. `backend/.env.example`

**IA:** composer-2.5  
**Hito:** `docker-compose up` levanta postgres + backend. `GET /` devuelve `{ status: "ok" }`.

---

### FASE 1 — Slice vertical / Test ácido (estimación: 1-2 días)

**Objetivo:** un empleado hace un test y el número aparece en el dashboard. Demostrable.

1. `lib/crypto.js` ← **Opus 4.8** (crítico, no improvisar aquí)
2. `controllers/auth.controller.js` (activar código + login empleador)
3. `controllers/session.controller.js` (recibir y cifrar sesión)
4. `controllers/dashboard.controller.js` (servir datos sin K-anon aún)
5. `tests/pvt.js` en employee-app ← **Opus 4.8** (el test más complejo)
6. `tests/risk_engine.js` (la fórmula)
7. `screens/checkin.js` (orquestación del flujo, sin CBI aún)
8. `api/client.js` (employee-app)
9. Login básico en employer-dashboard + vista de datos crudos

**IA:** Opus 4.8 para crypto.js y pvt.js; Sonnet para lo demás.  
**Hito:** test → índice en pantalla del empleado → aparece en el dashboard.

---

### FASE 2 — Tests completos (estimación: 1 día)

1. `tests/stroop.js`
2. `tests/cbi.js`
3. `screens/checkin.js` (añadir Stroop + CBI semanal)
4. `storage/db.js` (IndexedDB — historial local)
5. `screens/history.js` (historial visible para el empleado)

**IA:** Sonnet para todos  
**Hito:** flujo completo de tests funcionando de punta a punta.

---

### FASE 3 — Privacidad real (estimación: 1-2 días)

1. `lib/kanon.js` ← **Opus 4.8** (lógica de supresión K=5, la más delicada)
2. `crypto/local.js` (Web Crypto en el dispositivo) ← **Opus 4.8**
3. `screens/onboarding.js` (consentimiento RGPD + hash SHA-256 del código)
4. Integrar K-anon en `dashboard.controller.js`
5. `POST /me/delete` (derecho de supresión)

**IA:** Opus 4.8 para kanon.js y local.js; Sonnet para onboarding y supresión.  
**Hito:** K=5 activo, datos locales cifrados, consentimiento registrado.

---

### FASE 4 — UX, i18n, dashboard e Informe PDF (estimación: 2-3 días)

1. `**i18n/`** — sistema de traducciones (`index.js`) + los 3 JSONs completos (`ca`, `es`, `en`). **El texto legal del consentimiento RGPD en catalán es prioritario y debe revisarse cuidadosamente** (idealmente por un humano nativo). Catalán por defecto.
2. **Selector de idioma** visible en la pantalla de onboarding y accesible desde cualquier pantalla (icono en cabecera). Cambio en caliente sin recargar.
3. `components/charts.js` (Chart.js — tendencias y distribución)
4. `components/filters.js` (departamento/turno/fecha)
5. `components/alerts.js` (alerta > 20% riesgo alto)
6. `components/exportCsv.js`
7. **Informe de Impacto PDF** (ver §Informe de Impacto Periódico):
  - `reports/insights.js` ← **Opus 4.8** (motor de reglas, núcleo del valor del informe)
  - `reports/template.html` + `reports/report.css`
  - `reports/report.controller.js` (Puppeteer)
  - `components/reportButton.js` en el dashboard
8. `styles.css` (employee-app) — polish glassmorphism, mobile-first
9. `styles.css` (dashboard) — desktop polish
10. Progress indicator visible durante PVT (no puede parecer interminable)
11. `manifest.webmanifest` + iconos (PWA instalable)

**IA:** Opus 4.8 para `insights.js`; Sonnet para charts, alerts, report.controller y template; composer-2.5 para i18n, estilos, CSV, manifest; composer-2.5-fast para los JSONs de traducción.  
**Hito:** dashboard con datos reales, filtros, alertas, exportación CSV, app multiidioma (ca/es/en) y generación del Informe de Impacto en PDF con un clic.

---

### FASE 5 — Producción en Contabo (estimación: 1 día)

1. `backend/Dockerfile`
2. `nginx.conf` (reverse proxy → backend, HTTPS)
3. Certbot (Let's Encrypt — SSL automático)
4. Variables de entorno de producción en el servidor
5. Script de backup de PostgreSQL (cron)
6. Job de retención de datos (borrar sesiones de orgs con `retention_until` pasado)
7. `middleware/rateLimit.js` con valores de producción

**IA:** Sonnet para Dockerfile y nginx; composer-2.5 para scripts de cron.  
**Hito:** app accesible por HTTPS en dominio real. Lista para el piloto.

---

### FASE 6 — Push notifications (opcional, post-piloto si acuerdo)

1. `sw.js` — Service Worker con push handler
2. Backend: endpoint para suscripción Web Push
3. Job diario de envío de recordatorios
4. Gestión de limitaciones iOS (documentar que requiere "Añadir a pantalla de inicio" en iOS 16.4+)

**IA:** Sonnet  
**Hito:** notificación push llega al dispositivo del empleado.

---

## Fórmula del Índice de Riesgo

```
Índice de Riesgo (0-100) =
  (PVT_index   × 0.40) +
  (Stroop_index × 0.25) +
  (CBI_score    × 0.25) +
  (Sleep_penalty × 0.10)

Sleep_penalty:
  ≥ 7h  → 0
  5-7h  → 25
  4-5h  → 50
  < 4h  → 75

PVT_index (0-100):
  Combina: lapses (>355ms), false starts, media RT, SD
  A más lapses y mayor media RT → mayor índice

Stroop_index (0-100):
  Combina: error rate, media RT incongruente

CBI_score (0-100):
  Media de las 3 subescalas (Personal/Work/Client)
  Umbral clínico de burnout: ≥ 50
  Días sin CBI → usar última puntuación semanal conocida (o 50 si es primer uso)
```

---

## Informe de Impacto Periódico (PDF)

Documento ejecutivo que el Ayuntamiento recibe por email / imprime / presenta en reuniones. **No es el dashboard**: el dashboard explora datos, el informe cuenta una historia y concluye. Es la pieza que se enseñará a otros departamentos para escalar el piloto de 50 a 500 funcionarios, así que debe transmitir rigor, claridad y valor accionable.

### Investigación previa (en qué se basan las decisiones de diseño)

**Qué quiere y qué teme un Director de RRHH / técnico de PRL de una administración pública:**

- **Le motiva:** poder demostrar a sus superiores (gerencia, dirección política) que el dinero/tiempo invertido genera resultados medibles; tener argumentos objetivos para justificar plantilla, turnos o medidas; aparecer como innovador sin asumir riesgos.
- **Le preocupa / le da miedo:** que el dato señale a personas concretas (responsabilidad legal y sindical); que el sistema "vigile" en lugar de "cuidar" (riesgo reputacional con los sindicatos y el comité de empresa); recibir un número que no sabe interpretar ni defender; que un informe diga "tu departamento está mal" sin decir qué hacer.
- **Conclusión de diseño:** el informe debe (1) ser explícito y repetitivo sobre la privacidad/K-anonimidad en cada página, (2) traducir todo a lenguaje de gestión, no de neurociencia, (3) terminar siempre en recomendaciones concretas, (4) usar un código semáforo familiar.

**Estándares de PRL en España que imitamos para que sea reconocible:**

- **Ley 31/1995 de Prevención de Riesgos Laborales** y la obligación de evaluar riesgos psicosociales → el informe se enmarca explícitamente como apoyo a la evaluación de riesgos psicosociales.
- **INSST (Instituto Nacional de Seguridad y Salud en el Trabajo)** y sus NTP (Notas Técnicas de Prevención) sobre factores psicosociales (p. ej. NTP 318, 704/705).
- **Método CoPsoQ-istas21** (adaptación española del Copenhagen Psychosocial Questionnaire — la misma familia que nuestro CBI). istas21 usa un **semáforo verde / amarillo / rojo** por dimensión y por niveles de exposición. **Imitamos ese semáforo** porque cualquier técnico de PRL español lo reconoce de inmediato → credibilidad instantánea.
- Lenguaje y estructura tipo "informe de evaluación": objeto, metodología, resultados, conclusiones, propuestas de medida.

### 1. Estructura del informe


| #   | Sección                               | Contenido                                                                                                                                                                                                                                                                |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| —   | **Portada**                           | Logo PulsePath + escudo/nombre del Ayuntamiento, título "Informe de Impacto — Bienestar Cognitivo", expediente `2026_OVT_694068`, periodo cubierto (ej. "Semanas 3-4"), nº de informe, fecha, sello "Datos anonimizados · K-anonimidad K=5".                             |
| 1   | **Resumen ejecutivo**                 | Media página. 3-4 frases generadas automáticamente con el titular del periodo (semáforo global + tendencia) + 3 KPIs grandes: índice de riesgo medio, % de plantilla en riesgo alto, adherencia (% de tests completados). Pensado para quien solo lee la primera página. |
| 2   | **Metodología y privacidad**          | Qué mide PulsePath (PVT-B, Stroop, CBI), cómo se calcula el índice, y un bloque destacado de privacidad: procesamiento en el dispositivo (Edge), solo índices anónimos salen, K-anonimidad K=5, base legal PRL. Tranquiliza al lector antes de mostrar datos.            |
| 3   | **Visión global de la organización**  | Semáforo global + gauge del índice medio + tendencia temporal de toda la plantilla. Responde: "¿cómo está mi gente en conjunto y hacia dónde va?".                                                                                                                       |
| 4   | **Análisis por departamento**         | Tabla y mapa de calor por departamento (solo grupos ≥ K=5). Cada departamento con su semáforo, índice medio, % riesgo alto y tendencia. Grupos pequeños → "Protegido (K-anonimidad)".                                                                                    |
| 5   | **Desglose de drivers**               | Qué pesa más en el riesgo: contribución de PVT (fatiga/atención), Stroop (control cognitivo), CBI (burnout) y sueño. Responde: "¿es fatiga puntual o burnout estructural?".                                                                                              |
| 6   | **Patrones temporales**               | Riesgo por día de la semana y por turno (mañana/tarde, si ≥ K=5). Responde: "¿hay días o turnos críticos sobre los que actuar?".                                                                                                                                         |
| 7   | **Conclusiones automáticas**          | Frases de `insights.js`: qué ha pasado, qué es significativo, qué vigilar.                                                                                                                                                                                               |
| 8   | **Recomendaciones accionables**       | Lista priorizada de medidas concretas generadas por reglas (ver motor abajo).                                                                                                                                                                                            |
| 9   | **Anexo metodológico y limitaciones** | Limitaciones (validez relativa, no diagnóstico clínico, K-anon oculta grupos pequeños), glosario, referencias (Ley 31/1995, INSST, CoPsoQ). Protege legalmente y da rigor.                                                                                               |


### 2. Catálogo de visualizaciones


| Visualización                      | Tipo                                     | Qué pregunta responde                          | Por qué esta                                     |
| ---------------------------------- | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| **Semáforo global**                | Indicador verde/amarillo/rojo grande     | "¿Estamos bien, regular o mal?"                | Lenguaje istas21, comprensible sin saber nada    |
| **Gauge del índice medio**         | Medidor 0-100 con zonas de color         | "¿Cómo de alto es el riesgo?"                  | Un número con contexto visual inmediato          |
| **KPIs grandes**                   | 3 tarjetas numéricas                     | Índice medio · % riesgo alto · adherencia      | Para el lector de 10 segundos                    |
| **Tendencia temporal**             | Gráfica de línea                         | "¿Mejora o empeora con el tiempo?"             | La dirección importa más que el valor absoluto   |
| **Mapa de calor por departamento** | Heatmap (dept × semana)                  | "¿Qué departamentos y cuándo?"                 | Localiza el problema de un vistazo               |
| **Barras por departamento**        | Barras horizontales ordenadas + semáforo | "¿Quién está peor?"                            | Comparativa clara, prioriza la acción            |
| **Desglose de drivers**            | Barras apiladas / donut                  | "¿Fatiga, control cognitivo, burnout o sueño?" | Distingue causa puntual vs estructural           |
| **Riesgo por día/turno**           | Barras agrupadas                         | "¿Lunes? ¿Turno de tarde?"                     | Convierte el dato en decisión operativa (turnos) |


Todas se renderizan con **Chart.js dentro de la página que Puppeteer imprime** (los `<canvas>` se dibujan y luego se captura el PDF), salvo el semáforo y los KPIs que son HTML/CSS puro. Solo se grafican grupos con ≥ K=5; el resto se etiqueta "Protegido".

### 3. Motor de conclusiones automáticas (`insights.js`, basado en reglas, sin IA generativa)

Funciona como un sistema de reglas `condición → frase`. Se evalúan todas las reglas sobre los datos agregados y se ensamblan las frases activadas, ordenadas por severidad. Ejemplos de reglas:

**Titulares (resumen ejecutivo):**

- `índice_global < 35` → 🟢 "El nivel de bienestar cognitivo de la plantilla es **saludable** este periodo."
- `35 ≤ índice_global < 50` → 🟡 "El nivel de bienestar cognitivo es **moderado**; conviene vigilar la evolución."
- `índice_global ≥ 50` → 🔴 "El nivel de riesgo cognitivo es **elevado** y requiere atención."
- `tendencia sube ≥ 8 puntos vs periodo anterior` → "⚠️ El riesgo ha **aumentado** respecto al periodo anterior (+X puntos)."
- `tendencia baja ≥ 8 puntos` → "✅ El riesgo ha **mejorado** respecto al periodo anterior (−X puntos)."

**Por departamento:**

- `pct_riesgo_alto > 20%` → "🔴 El departamento **{dept}** supera el umbral de alerta (X% en riesgo alto)."
- `un dept ≥ 15 puntos por encima de la media` → "El departamento **{dept}** está notablemente por encima de la media de la organización."

**Drivers (causa):**

- `contribución CBI dominante` → "El principal factor es el **burnout acumulado** (no fatiga puntual): el problema es estructural."
- `contribución PVT dominante + sueño bajo` → "El principal factor es la **fatiga aguda asociada a falta de sueño**: probablemente reversible con descanso."
- `Stroop dominante` → "Destaca la pérdida de **control cognitivo/atencional**, asociada a sobrecarga mental."

**Temporal:**

- `un día concreto > media + 10` → "Los **{día}** concentran el mayor riesgo: revisar carga de trabajo ese día."
- `turno de tarde > turno de mañana + 10` → "El **turno de tarde** presenta mayor riesgo que el de mañana."

**Adherencia (calidad del dato):**

- `adherencia < 60%` → "⚠️ La participación es baja (X%); los resultados deben interpretarse con cautela."

### 4. Recomendaciones accionables (también por reglas)

Cada conclusión enciende recomendaciones de un catálogo predefinido, redactadas en lenguaje de gestión y enmarcadas en PRL:

- Riesgo alto sostenido en un dept → "Convocar al departamento {dept} para una sesión de evaluación de carga de trabajo conforme a la evaluación de riesgos psicosociales."
- Burnout estructural (CBI) → "Valorar medidas organizativas: redistribución de tareas, refuerzo de plantilla en picos, revisión de objetivos."
- Fatiga + sueño bajo → "Revisar turnos y descansos; considerar formación en higiene del sueño."
- Día/turno crítico → "Reequilibrar la planificación del {día}/turno de tarde."
- Mejora sostenida → "Mantener las medidas actuales; documentar como buena práctica para otros departamentos."

> **Disclaimer obligatorio en el informe:** las recomendaciones son orientativas y de apoyo a la gestión preventiva; no sustituyen la evaluación de riesgos psicosociales ni el criterio del Servicio de Prevención.

### 5. Stack técnico elegido: **Puppeteer (server-side)**

Genera el PDF en el backend renderizando una plantilla HTML+CSS+Chart.js real con Chromium headless e imprimiéndola a PDF.

**Por qué Puppeteer para este caso (dashboard web, usuario no técnico, un clic, informe ejecutivo de alta calidad):**

- **Fidelidad tipográfica perfecta:** el texto es texto real (vectorial, seleccionable, nítido), no una imagen. Imprescindible para un documento que se imprime y se presenta.
- **Maquetación profesional con CSS de impresión:** `@page`, saltos de página controlados, cabeceras/pies, A4 — control total del layout multipágina.
- **Reutiliza Chart.js:** las mismas gráficas del dashboard se renderizan en la plantilla; no hay que reimplementar nada.
- **El backend ya tiene los datos agregados K-anon:** generar allí es natural y nunca toca datos individuales (el informe se nutre del mismo agregado que el dashboard).
- **Un clic real:** el usuario pulsa un botón y recibe el PDF; toda la complejidad queda en el servidor.

**Alternativas evaluadas y por qué se descartan:**


| Opción                            | Pros                                                                | Contras                                                                                                                         | Veredicto                                       |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **jsPDF** (cliente)               | Sin dependencia de servidor; texto vectorial                        | Maquetación 100% manual coordenada a coordenada → lentísimo de desarrollar y frágil para un informe de 9 secciones con gráficas | ❌ Demasiado trabajo manual                      |
| **html2canvas + jsPDF** (cliente) | Convierte el DOM tal cual                                           | Rasteriza a imagen → **texto borroso**, archivos pesados, cortes de página rotos, mala calidad de impresión                     | ❌ Calidad insuficiente para documento ejecutivo |
| **pdfmake** (cliente)             | Declarativo, buen texto                                             | Modelo propio (no HTML/CSS), gráficas difíciles, curva de aprendizaje                                                           | ❌ Gráficas complicadas                          |
| **@react-pdf**                    | Bueno en React                                                      | El proyecto es Vanilla JS, no React                                                                                             | ❌ No encaja en el stack                         |
| **Puppeteer** (servidor)          | Fidelidad total, CSS print, reutiliza Chart.js, datos ya en backend | Imagen Docker más pesada (~Chromium); algo más de RAM al generar                                                                | ✅ **Elegido**                                   |


**Mitigación del único contra real (peso/RAM de Chromium en Docker):** usar la imagen base oficial de Puppeteer o instalar solo las dependencias de Chromium; el piloto son 50 personas y los informes se generan bajo demanda (no en caliente), así que el consumo es puntual y asumible en el servidor Contabo.

### 6. Encaje en el plan

- **Archivos nuevos:** `backend/src/reports/{report.controller.js, insights.js, template.html, report.css}` y `employer-dashboard/src/components/reportButton.js` (ya añadidos a la estructura y al inventario).
- **Endpoint nuevo:** `GET /api/v1/dashboard/:orgId/report.pdf` (ya añadido a la API).
- **Fase:** se implementa en la **Fase 4**, tras tener charts y agregados K-anon listos (de los que el informe depende). El núcleo de valor —`insights.js`— se construye con **Opus 4.8**; el resto con Sonnet/composer.

---

## Riesgos y decisiones antes de programar


| Riesgo                          | Descripción                                                                             | Mitigación                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| iOS PWA + push                  | Push muy limitado en iOS (requiere 16.4+, app en pantalla de inicio)                    | Fase 6 opcional, fallback email/recordatorio                                                           |
| K=5 con 50 personas             | Desglose excesivo → muchos grupos "Protected" → dashboard vacío                         | Solo dept + shift; gestionar expectativas con BCN                                                      |
| Validez clínica del PVT táctil  | Latencia de pantalla añade ruido al RT                                                  | Usar `performance.now()`, documentar limitación, usar tendencias no valores absolutos                  |
| Edge AI honesto                 | Es una fórmula, no ML. Discurso: "ML cuando tengamos datos del piloto"                  | Consistente en todos los materiales comerciales                                                        |
| Anti-trampa                     | Sesiones basura desde un código comprometido                                            | Rate limit + validación de rangos. No crítico con 50 personas controladas                              |
| Reidentificación temporal       | Secuencias en grupos pequeños pueden filtrar individuos                                 | K=5 + sin género/edad mitiga suficientemente                                                           |
| DPA firmado                     | Contrato de Encargado del Tratamiento debe estar firmado antes de datos reales          | Bloqueante legal; no esperar al último momento                                                         |
| Dominio y SSL                   | Necesario antes de Fase 5                                                               | Comprar `pulsepath.app` (frontend) + `api.pulsepath.app` (backend) antes de septiembre                 |
| Mapeo dept → código             | El Ayuntamiento asigna qué código va a qué departamento sin que tú lo sepas             | El reparto lo hace RRHH del Ayuntamiento; tú recibes solo el CSV de (code → dept)                      |
| Texto legal en catalán          | El consentimiento RGPD en `ca.json` tiene valor legal; una mala traducción es un riesgo | Redacción jurídica revisada por humano nativo antes del piloto; versionar `policy_version`             |
| Puppeteer en Docker             | Chromium aumenta peso de imagen y RAM al generar PDF                                    | Imagen base oficial de Puppeteer; generación bajo demanda, no en caliente; 50 usuarios → carga puntual |
| Informe sin auto-interpretación | RRHH no técnico puede malinterpretar o usar el informe para señalar personas            | `insights.js` siempre concluye + disclaimer PRL en cada informe; K=5 impide ver individuos             |


---

## Resumen del plan para usar con IA en sesiones futuras

Cuando abras una nueva sesión para implementar un archivo específico, pega esto al principio:

```
Estoy construyendo PulsePath, una PWA de salud digital B2B con arquitectura Edge AI.
El plan completo está en pulsepath/PLAN.md. Ahora necesito implementar [NOMBRE_ARCHIVO].
Stack: [backend: Node+Express+PostgreSQL+Prisma | employee-app: Vanilla JS+Vite | employer-dashboard: Vanilla JS+Vite+Chart.js]
Fase actual: [FASE X]
Dependencias ya implementadas: [listar]
Restricción crítica: ningún dato personal ni biométrico crudo puede salir del dispositivo del empleado.
```

---

*Plan generado el 5 de junio de 2026. Actualizar este archivo cuando se completen fases o cambien decisiones.*