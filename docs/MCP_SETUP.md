# MCP — entorno MatForge (investigación local)

Configuración preparada el **2026-06-25** para apoyar `docs/MATFORGE_RESEARCH.md`.  
No incluye secretos: sustituye los placeholders o define variables de entorno en el sistema / en Cursor.

## Dónde está la config

| Ámbito | Ruta | Contenido |
|--------|------|-----------|
| Global (todos los proyectos) | `C:\Users\maxbp\.cursor\mcp.json` | `playwright`, `duckduckgo` (sin cambiar nombres; no duplicar los MCP ya integrados en Cursor) |
| Proyecto pulsepath-v2 | `C:\Users\maxbp\pulsepath-v2\.cursor\mcp.json` | `comfyui`, `n8n-mcp`, `huggingface`, `github` |
| Código fuente de referencia (clonado) | `C:\Users\maxbp\.cursor\mcp-servers\` | Repos MCP en shallow clone (`git clone --depth 1`) |

No se encontró MCP en `AppData\Roaming\Cursor\User\globalStorage` (solo el JSON anterior).

## MCP ya presentes en Cursor (no tocar)

- `cursor-ide-browser`
- `user-playwright` (equivalente npm: `@playwright/mcp` en global `mcp.json` como `playwright`)
- `user-duckduckgo`
- `cursor-app-control`

## MCP añadidos para MatForge

### 1. comfyui (`comfyui-mcp`) — prioridad alta

- **Paquete:** `npx -y comfyui-mcp` ([artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp))
- **Requisitos:** Node.js ≥ 22 (local: v24.x OK). ComfyUI accesible (local, túnel SSH al A10, o RunPod).
- **Config:** entrada `comfyui` en `.cursor/mcp.json` del proyecto.
- **Variables opcionales:**
  - `CIVITAI_API_TOKEN` — descargas Civitai desde el MCP (vacío = sin Civitai autenticado).
  - `COMFYUI_API_KEY` — solo modo Comfy Cloud ([docs](https://comfyui-mcp.artokun.io/docs)).
- **Remoto (Lambda A10):** con túnel activo, documentar en tu entorno `COMFYUI_HOST` / URL según [deployment modes](https://comfyui-mcp.artokun.io/docs) del paquete npm (el MCP auto-detecta instalación local en Windows si existe ComfyUI Desktop).

### 2. n8n-mcp — prioridad alta

- **Paquete:** `npx -y n8n-mcp` ([czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp))
- **Modo actual:** solo documentación de nodos (sin gestión de workflows en la instancia).
- **Para gestionar el n8n de MatForge (VPS Hetzner),** añade en `env` de la entrada `n8n-mcp`:

```json
"N8N_API_URL": "https://TU-INSTANCIA-N8N",
"N8N_API_KEY": "TU_API_KEY"
```

- **Pendiente Max:** URL pública o túnel del n8n de producción + API key (Settings → n8n API).
- **Alternativa cloud:** [dashboard.n8n-mcp.com](https://dashboard.n8n-mcp.com) (API key distinta; no configurada aquí).

### 3. huggingface (`hf-mcp-server`) — prioridad alta

- **Tipo:** HTTP remoto oficial — `https://huggingface.co/mcp?login`
- **Config:** entrada `huggingface` en `.cursor/mcp.json`.
- **Auth:** al abrir el proyecto, Cursor puede guiar login OAuth con `?login`.  
  **O** PAT en headers (recomendado para CI/estable):

```json
"huggingface": {
  "url": "https://huggingface.co/mcp",
  "headers": {
    "Authorization": "Bearer TU_HF_TOKEN"
  }
}
```

- **Pendiente Max:** crear token en [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) y habilitar herramientas en [huggingface.co/settings/mcp](https://huggingface.co/settings/mcp).
- **Repo clonado:** `hf-mcp-server` (referencia; en Cursor se usa el endpoint hosted, no hace falta `npx` local).

### 4. github — opcional

- **Tipo:** HTTP remoto `https://api.githubcopilot.com/mcp/`
- **Config:** entrada `github` con `Authorization: Bearer REPLACE_WITH_GITHUB_PAT` — **sustituir** el placeholder.
- **Pendiente Max:** [Personal Access Token](https://github.com/settings/tokens) con scopes acordes a repos MatForge.
- **Local Docker (no preparado):** Docker Desktop **no estaba en ejecución** al preparar el entorno; imagen `ghcr.io/github/github-mcp-server` no se precacheó. Para modo Docker, arranca Docker y sigue [install-cursor.md](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-cursor.md).

### 5. comfyui-arbo-mcp-hub — opcional, no activado

- **Repo clonado:** `C:\Users\maxbp\.cursor\mcp-servers\comfyui-arbo-mcp-hub`
- **Uso:** custom node **dentro** de ComfyUI (`custom_nodes/comfyui-arbo-mcp-hub`), no vía `npx`.
- **No se añadió a `mcp.json`** hasta tener ruta de Python del venv de ComfyUI, por ejemplo:

```json
"comfyui-arbo-mcp-hub": {
  "command": "C:\\ruta\\a\\ComfyUI\\.venv\\Scripts\\python.exe",
  "args": ["C:\\ruta\\a\\ComfyUI\\custom_nodes\\comfyui-arbo-mcp-hub\\mcp_server\\main.py"]
}
```

- Instalar el nodo en la máquina donde corre ComfyUI (Manager o git clone) y usar el panel **AI Clients → Configure All**.

## Variables de entorno — estado (2026-06-25)

| Variable | ¿Definida en Windows? | Acción |
|----------|----------------------|--------|
| `HF_TOKEN` / `HUGGING_FACE_HUB_TOKEN` | No | Token HF para MCP o header Bearer |
| `GITHUB_PAT` / `GITHUB_TOKEN` | No | Sustituir `REPLACE_WITH_GITHUB_PAT` en `.cursor/mcp.json` |
| `N8N_API_URL` | No | URL del n8n MatForge |
| `N8N_API_KEY` | No | API key n8n |
| `CIVITAI_API_TOKEN` | No | Opcional Civitai |
| `COMFYUI_API_KEY` | No | Solo Comfy Cloud |

## Activar cambios

1. **Reiniciar Cursor por completo** (cierra todas las ventanas).
2. **Settings → Tools & MCP** — comprobar punto verde en cada servidor.
3. Primera ejecución de `npx` puede tardar (descarga de `comfyui-mcp` / `n8n-mcp`).
4. Para **comfyui-mcp:** tener ComfyUI corriendo o túnel SSH al puerto API (típ. `8188`) antes de usar herramientas.

## Resumen instalación

| Componente | Estado |
|------------|--------|
| Clones `research/*` (7 repos) | OK |
| Clones `~/.cursor/mcp-servers/*` (5 repos) | OK |
| `.cursor/mcp.json` proyecto | OK |
| `~/.cursor/mcp.json` global | OK (playwright + duckduckgo) |
| npm `comfyui-mcp` / `n8n-mcp` | Se resuelven en primer arranque vía `npx` (no se ejecutó servidor stdio en batch) |
| Docker GitHub MCP | Falló: daemon Docker apagado |
| Tokens / URLs producción | Pendiente Max |

## Referencias

- Investigación: `docs/MATFORGE_RESEARCH.md`
- Índice repos clonados: `research/README.md`