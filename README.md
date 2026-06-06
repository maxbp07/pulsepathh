# PulsePath — Piloto Ayuntamiento de Barcelona

PulsePath es una PWA de salud digital B2B diseñada para el bienestar cognitivo y la prevención de riesgos psicosociales en el entorno laboral. Los empleados realizan check-ins diarios y semanales desde su dispositivo; los datos biométricos y personales nunca salen del dispositivo — solo se envían al servidor agregados anónimos (K-anonimidad). El piloto actual está orientado al Ayuntamiento de Barcelona (50 funcionarios, 8 semanas).

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Arranque rápido — desarrollo local](#2-arranque-rápido--desarrollo-local)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Flujo de prueba manual](#4-flujo-de-prueba-manual)
5. [Troubleshooting](#5-troubleshooting)
6. [Estructura de carpetas](#6-estructura-de-carpetas)
7. [Documentación](#7-documentación)

---

## 1. Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| [Node.js](https://nodejs.org/) | **20 LTS** | Usa `node -v` para verificar |
| [Docker](https://docs.docker.com/get-docker/) + Docker Compose | Docker 24 / Compose v2 | Solo se dockeriza PostgreSQL en dev |
| PostgreSQL | 16 (vía Docker) | No necesitas instalación local |
| npm | 10+ | Incluido con Node 20 |

> **Windows**: se recomienda Docker Desktop con WSL2 habilitado.  
> **Linux/Mac**: Docker Engine + Compose plugin es suficiente.

---

## 2. Arranque rápido — desarrollo local

> Alternativa automatizada: usa `scripts/dev-start.ps1` (Windows) o `scripts/dev-start.sh` (Linux/Mac) para levantar todo de una vez.

### Paso 1 — Variables de entorno

```bash
# Raíz del proyecto (usada por docker-compose)
cp .env.example .env

# Backend local (apunta a localhost en vez de al nombre de servicio Docker)
cp backend/.env.example backend/.env
```

Edita `backend/.env` si cambias puerto u credenciales de Postgres. En desarrollo, los valores por defecto funcionan sin modificación.

### Paso 2 — Levantar PostgreSQL

```bash
docker-compose up -d postgres
```

Espera a que el healthcheck pase (≈10 s). Puedes verificar con:

```bash
docker ps   # pulsepath-postgres debe aparecer como "healthy"
```

### Paso 3 — Backend (API Express + Prisma)

```bash
cd backend
npm install
npx prisma migrate dev   # aplica migraciones y genera el cliente
npm run prisma:seed      # carga org, 50 access codes y usuario RRHH
npm run dev              # nodemon en http://localhost:3000
```

> El seed es idempotente: puedes ejecutarlo varias veces sin duplicar datos.

### Paso 4 — Employee App (PWA empleado)

Abre una **nueva terminal**:

```bash
cd employee-app
npm install
npm run dev   # http://localhost:5173
```

### Paso 5 — Employer Dashboard (panel RRHH)

Abre otra **nueva terminal**:

```bash
cd employer-dashboard
npm install
npm run dev   # http://localhost:5174
```

### Servicios activos

| Servicio | URL |
|---|---|
| API Backend | http://localhost:3000 |
| Employee App (PWA) | http://localhost:5173 |
| Employer Dashboard | http://localhost:5174 |
| PostgreSQL | localhost:5432 |

Ambos frontends tienen proxy `/api → http://localhost:3000` configurado en Vite, por lo que no necesitas configurar CORS manualmente en desarrollo.

---

## 3. Variables de entorno

El proyecto usa dos archivos `.env` independientes:

### `.env` (raíz — usado por docker-compose)

```dotenv
DATABASE_URL=postgresql://pulsepath:pulsepath@postgres:5432/pulsepath
JWT_SECRET=change-me-in-production
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01
ADMIN_SECRET=change-me
NODE_ENV=development
PORT=3000
```

### `backend/.env` (usado por el backend local con nodemon)

```dotenv
DATABASE_URL=postgresql://pulsepath:pulsepath@localhost:5432/pulsepath
JWT_SECRET=change-me-in-production
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01
ADMIN_SECRET=change-me
NODE_ENV=development
PORT=3000
```

> La diferencia clave es el host: `@postgres:` (nombre de servicio Docker) en la raíz vs. `@localhost:` en el `.env` local del backend.

**En producción** debes cambiar obligatoriamente:
- `JWT_SECRET` → cadena aleatoria de 64+ caracteres
- `ENCRYPTION_KEY` → hex de 64 caracteres generado con `openssl rand -hex 32`
- `ADMIN_SECRET` → contraseña segura para el endpoint de administración

---

## 4. Flujo de prueba manual

Ejecuta este checklist de forma secuencial para validar el slice vertical E2E del piloto.

### Credenciales de prueba

| Rol | Dato | Valor |
|---|---|---|
| Empleado | Código de acceso | `BCN-2026-A001` (atencion_ciudadana / morning) |
| RRHH | Email | `rrhh@bcn.cat` |
| RRHH | Contraseña | `demo1234` |

> Códigos disponibles: `BCN-2026-A001` → `BCN-2026-A050`  
> A001–A025: departamento `atencion_ciudadana`, turno `morning`  
> A026–A050: departamento `informatica`, turno `afternoon`

### Checklist E2E

**Employee App** — http://localhost:5173

- [ ] Abrir la app y completar el onboarding introduciendo el código `BCN-2026-A001`
- [ ] Completar un check-in completo: PVT (tiempo de reacción) + test de Stroop
- [ ] Verificar que el resultado aparece en la pantalla de inicio (semáforo / puntuación)
- [ ] Navegar a "Historial" y confirmar que aparece la gráfica con el check-in registrado

**Employer Dashboard** — http://localhost:5174

- [ ] Hacer login con `rrhh@bcn.cat` / `demo1234`
- [ ] Ver el semáforo de bienestar y la tabla de departamentos con datos agregados
- [ ] Exportar los datos en formato CSV (botón "Exportar CSV")
- [ ] Generar PDF del informe (requiere Puppeteer; ver nota en Troubleshooting)
- [ ] Ejercer el derecho de supresión de un empleado (sección "Privacidad / RGPD")

---

## 5. Troubleshooting

### Puppeteer no genera el PDF

Puppeteer descarga Chromium la primera vez. Si falla en el servidor:

```bash
cd backend
node -e "const p = require('puppeteer'); p.launch().then(b => { console.log('OK'); b.close(); })"
```

En entornos Linux sin cabeza (headless) puede ser necesario:

```bash
# Ubuntu/Debian
sudo apt-get install -y libgbm-dev libasound2 libatk-bridge2.0-0 libgtk-3-0
```

En Windows con Docker, la generación de PDF se ejecuta dentro del contenedor si usas `docker-compose up` completo, o localmente si el backend corre con nodemon.

### CORS — "Access to fetch blocked"

El proxy de Vite (`/api → localhost:3000`) solo funciona en modo **desarrollo** (`npm run dev`). Si accedes directamente a `localhost:3000` desde el navegador sin pasar por Vite, verás errores de CORS. Solución: usa siempre la URL de Vite (`localhost:5173` o `:5174`) durante el desarrollo.

### PostgreSQL — "Connection refused" o "ECONNREFUSED"

1. Verifica que el contenedor está corriendo y sano:
   ```bash
   docker ps
   docker logs pulsepath-postgres
   ```
2. Asegúrate de que `backend/.env` usa `@localhost:5432` (no `@postgres:5432`).
3. Si el puerto 5432 está ocupado por otra instancia de Postgres local, cambia el mapeo en `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"
   ```
   Y actualiza `DATABASE_URL` en `backend/.env` para usar el puerto `5433`.

### "Cannot find module '@prisma/client'"

```bash
cd backend
npx prisma generate
```

Esto regenera el cliente Prisma a partir del schema. Ocurre cuando se instalan las dependencias por primera vez sin haber ejecutado `migrate dev`.

### Migraciones pendientes al reiniciar

```bash
cd backend
npx prisma migrate dev
```

Aplica cualquier migración nueva sin resetear datos existentes.

---

## 6. Estructura de carpetas

```
pulsepath-v2/
├── docker-compose.yml        # Orquestación: postgres (+ backend opcional en prod)
├── .env.example              # Plantilla para docker-compose (host=postgres)
├── README.md                 # Este archivo
├── PLAN.md                   # Plan de implementación completo
├── scripts/
│   ├── dev-start.ps1         # Arranque automatizado — Windows (PowerShell)
│   └── dev-start.sh          # Arranque automatizado — Linux/Mac (bash)
├── backend/                  # API Express + Prisma + PostgreSQL
│   ├── .env.example          # Plantilla local (host=localhost)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js           # Seed: org + 50 access codes + usuario RRHH
│   └── src/
├── employee-app/             # PWA del empleado (Vanilla JS + Vite) — :5173
└── employer-dashboard/       # Panel del empleador (Vanilla JS + Vite) — :5174
```

---

## 7. Documentación

Para el plan de implementación detallado (fases, arquitectura, stack y decisiones de privacidad), consulta [PLAN.md](./PLAN.md).
