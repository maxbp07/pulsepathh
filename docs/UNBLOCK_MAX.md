# Desbloqueo Bloque 0 — acciones solo tuyas

El Contabo `161.97.69.228` está **reinstalado**. Ninguna clave SSH local entra y las passwords guardadas (`.env.infra`, MatForge) fallan. Sin tu password nueva del panel Contabo no se puede provisionar.

Neon **sí responde** con la `DATABASE_URL` actual de `backend/.env` (probe `SELECT 1` OK). Aun así hay que rotarla porque la password estuvo en el historial público.

## Checklist (10 minutos)

### 1. Contabo — password root
1. Entra en https://my.contabo.com (o el panel que uses).
2. VPS `161.97.69.228` → Reset root password (o cópiala si la enviaron por email tras reinstalar).
3. Guárdala en `C:\Users\maxbp\pulsepath-v2\.env.infra` así:

```
VPS_HOST=161.97.69.228
VPS_USER=root
VPS_PASS=TU_PASSWORD_NUEVA
```

(`.env.infra` ya está en `.gitignore`.)

### 2. Namecheap — DNS
1. Domain List → `getpulsepath.com` → Advanced DNS.
2. Añadir registro **A Record**: Host `app`, Value `161.97.69.228`, TTL Automatic.
3. Verificar: `nslookup app.getpulsepath.com 1.1.1.1`

### 3. Neon — rotar password
1. https://console.neon.tech → proyecto `ep-solitary-night-a2a7k6o8`.
2. Reset role password de `neondb_owner`.
3. Actualiza `DATABASE_URL` en `backend/.env` local y (cuando exista) en `/opt/pulsepath/.env` del VPS.

## Cuando esté listo
Escribe en el chat: **"desbloqueado"** y el agente entrará por SSH, instalará tu clave pública y continuará el Bloque 1.
