# MatForge — Investigación Arquitectónica PBR (Jun 2026)

> **Alcance:** investigación exhaustiva. Sin cambios de código.  
> **Contexto:** pipeline MatForge (n8n VPS Hetzner → Lambda A10 → ComfyUI → Blender → ZIP).  
> **Estado actual validado:** workflow SDXL + `CLIPTextEncodeSDXL` + `Asymmetric_Tiling_KSampler` + BAE normal + MiDaS height **sí generó muro de piedra correcto** (22 jun 2026).

---

## Resumen ejecutivo (actualizado 26 jun — loop ecosistema)

MatForge debe evaluar **3 motores comerciales** en paralelo (A10), no casarse con Marigold todavía:

| Track | Motor | Licencia venta | Rol |
|-------|--------|----------------|-----|
| **A — candidato #1** | **StableMaterials** / MatForger (`gvecchio/StableMaterials`) | OpenRAIL ✅ | Texto → **5 mapas tileables** en 1 modelo (como CHORD, legal) |
| **B — fallback** | SDXL seamless + Marigold + TextureAlchemy | OpenRAIL ✅ | Ya diseñado; multi-paso |
| **C — R&D** | CHORD | Research-only ❌ | Techo de calidad; benchmark interno |

**CHORD y RGBX no son vendibles.** El pipeline anterior (BAE/MiDaS/filtros) queda **descartado** salvo emergencia.

**Decisión pendiente:** A/B en A10 (mismo prompt cerebro.csv) antes de tocar `provision_lambda.sh` o batch.

Esto elimina las 3 causas raíz de `matforge-vps.md`: PBR falso, prompts mal inyectados, SDXL sin seamless.

---

## 1. Workflows ComfyUI 2025–2026 para PBR seamless

### 1.1 Patrón ganador (consenso industria + comunidad)

```
[Prompt] → SDXL seamless albedo (1024²)
         → CHORD material estimation
         → (opcional) upscale 4x por canal
         → QA tileability
         → export 4–5 mapas
```

**Por qué dos etapas y no un solo modelo:** ningún checkpoint generalista (SDXL, Flux) genera los 4 mapas PBR físicamente correctos en un solo paso. Los modelos que sí lo hacen (MatFuse, CHORD completo) o no tienen nodos ComfyUI maduros, o requieren albedo flat-lit como input.

### 1.2 Comparativa de modelos

| Modelo / Enfoque | Seamless nativo | PBR real (4+ mapas) | Calidad AAA | ComfyUI | VRAM A10 | Licencia venta packs | Veredicto MatForge |
|---|---|---|---|---|---|---|---|
| **SDXL + Asymmetric Tiling** | ✅ Sí (conv tiling) | ❌ Solo albedo | ⭐⭐⭐⭐ | ✅ Probado | ~8 GB | ✅ Open | **Motor albedo #1** |
| **CHORD** (estimación) | N/A (input) | ✅ SVBRDF completo | ⭐⭐⭐⭐⭐ | ✅ Nodos oficiales | ~6 GB extra | ⚠️ Research-only* | **Descompositor #1** |
| **Flux Dev + Seamless LoRA** | ⚠️ Post-proceso | ❌ Solo albedo | ⭐⭐⭐⭐⭐ detalle | ✅ | ~12–16 GB | ⚠️ NC para dev | Secundario / stylized |
| **MatFuse** | ✅ Tileable | ✅ 4 mapas directos | ⭐⭐⭐⭐ | ❌ Sin nodos oficiales | ~10 GB | ⚠️ Research | No automatizable aún |
| **RGBX / rgb2x** | N/A | ⚠️ Estimación por canal | ⭐⭐⭐ | ✅ | ~8 GB | ✅ | Fallback si CHORD falla |
| **Marigold + TextureAlchemy** | N/A | ⚠️ Normal/AO/rough estimados | ⭐⭐⭐ | ✅ | ~8 GB | ✅ | Mejor que BAE/MiDaS, peor que CHORD |
| **BAE + MiDaS** (actual) | N/A | ⚠️ Normal/height aproximados | ⭐⭐ | ✅ | ~4 GB | ✅ | **Reemplazar por CHORD** |
| **DeepBump** | ✅ seamless height | ⚠️ Solo normal→height | ⭐⭐⭐ | ✅ (mtb) | ~2 GB | ✅ GPLv3 | Complemento height |
| **Juggernaut XL** | Con tiling nodes | ❌ | ⭐⭐⭐⭐ fotoreal | ✅ | ~8 GB | ✅ | Checkpoint albedo recomendado |
| **SXZ Texture Bringer LoRA** | Con tiling | ❌ | ⭐⭐⭐ stylized | ✅ | +1 GB | ✅ | Packs stylized/hand-painted |

\* CHORD tiene licencia Research-Only de Ubisoft. **Validar legalmente** antes de vender packs comerciales en Fab/Itch.io. Para uso interno/prototipo está claro; para venta masiva, contactar Ubisoft o usar RGBX/Marigold como alternativa con licencia permisiva.

### 1.3 Flux vs SDXL vs especializados

| Criterio | SDXL + Tiling | Flux Dev | CHORD / MatFuse |
|---|---|---|---|
| Seamless real | ✅ Modifica capas conv | ❌ Sin conv tiling; LoRA imperfecto | MatFuse sí; CHORD necesita input seamless |
| Control prompt material | ✅ Con `CLIPTextEncodeSDXL` | ✅ Mejor adherencia | CHORD: input visual; MatFuse: multi-cond |
| Evitar "calle con gente" | ✅ Negativo + prompt material | ⚠️ Más creativo = más drift | ✅ Si albedo es plano/material |
| Coste inferencia A10 | Bajo (~30s) | Alto (~60–90s, más VRAM) | CHORD: ~5–15s extra |
| Automatización API | ✅ Probado en MatForge | ✅ Posible | ✅ Nodos API-ready |

**Conclusión:** SDXL para albedo + CHORD para mapas. Flux solo para packs stylized/hand-painted donde el seamless se corrige post (MakeSeamlessTexture).

### 1.4 Nodos críticos y custom packs

| Pack / Nodo | Función | URL |
|---|---|---|
| `asymmetric-tiling-comfyui` | `Asymmetric_Tiling_KSampler` — tiling X/Y independiente | https://github.com/alsritter/asymmetric-tiling-comfyui |
| `tiled_ksampler` | `Circular VAEDecode` — evita bleeding en bordes | https://github.com/FlyingFireCo/tiled_ksampler |
| `ComfyUI-seamless-tiling` | `Seamless Tile`, `Offset Image`, `Make Circular VAE` | https://github.com/spinagon/ComfyUI-seamless-tiling |
| `ComfyUI-Chord` | `ChordLoadModel`, `ChordMaterialEstimation`, `ChordNormalToHeight` | https://github.com/ubisoft/ComfyUI-Chord |
| `comfyui_controlnet_aux` | BAE, MiDaS, DSINE (fallback) | https://github.com/Fannovel16/comfyui_controlnet_aux |
| `ComfyUI-TextureAlchemy` | Marigold/Lotus extraction, seamless, channel pack | https://github.com/amtarr/ComfyUI-TextureAlchemy |
| `ComfyUI-QFX-PBRGenerator` | One-click PBR desde imagen | https://github.com/qornflex/ComfyUI-QFX-PBRGenerator |
| `mc-pbr-master` | Tile Checker 2×2–5×5, 3D preview WebGL, export | https://github.com/soojungkn/mc-pbr-master |
| `ComfyUI-rgbx` | Descomposición RGB→albedo/normal/rough/metallic | https://github.com/leob03/ComfyUI-rgbx |
| `ComfyUI-MakeSeamlessTexture` | Post-corrección seamless (Flux/albedo imperfecto) | https://github.com/SparknightLLC/ComfyUI-MakeSeamlessTexture |
| `comfy_mtb` / Deep Bump | Normal→height seamless | https://github.com/melMass/comfy_mtb |
| `ComfyUI_Blender_toolbox` | Workflows PBR + CHORD + seamless SDXL/Flux | https://github.com/GeekatplayStudio/ComfyUI_Blender_toolbox |

### 1.5 LoRAs y checkpoints recomendados

| Asset | Uso | URL |
|---|---|---|
| `sd_xl_base_1.0` | Base fiable (ya en NFS) | HuggingFace stabilityai |
| **Juggernaut XL v9/v10** | Fotorealismo material (comunidad textures) | https://civitai.com/models/133005/juggernaut-xl |
| **SXZ Texture Bringer** | Stylized/concept art textures | https://civitai.com/models/53858/sxz-texture-bringer-concept |
| **Flux Seamless Texture LoRA** | Solo si se usa Flux (con corrección post) | https://huggingface.co/gokaygokay/Flux-Seamless-Texture-LoRA |
| **Flux Hand-Painted Textures** | Packs hand-painted | https://civitai.com/models/652904/flux-hand-painted-textures |
| `chord_v1.safetensors` | Descomposición PBR | Repo Ubisoft ComfyUI-Chord |
| `4x-UltraSharp` | Upscale albedo pre-CHORD | Ya usado en workflow actual |

### 1.6 Workflows descargables

| Workflow | Descripción | URL |
|---|---|---|
| CHORD image→material (oficial) | `chord_image_to_material.json` | https://github.com/ubisoft/ComfyUI-Chord |
| CHORD text→seamless→PBR | SDXL + CHORD integrado | https://www.runcomfy.com/comfyui-workflows/chord-model-workflow-in-comfyui-pbr-material-generation |
| Seamless PBR all maps (Civitai) | RGBX + Marigold + DeepBump | https://civitai.com/articles/11045/seamless-pbr-texture-generator-with-all-maps |
| OpenArt seamless PBR (original) | Base del artículo Civitai | https://openart.ai/workflows/henry_triplette/seamless-pbr-texture-generator/eXnrsEFaDGpqBD3s1z4Q |
| InstaSD SDXL seamless | Juggernaut + SeamlessTile + Offset | https://www.instasd.com/workflows/create-seamless-patterns-tileable-textures |
| Geekatplay PBR Studio | CHORD + seamless SDXL/Flux | https://github.com/GeekatplayStudio/ComfyUI_Blender_toolbox |

---

## 2. Generación de mapas PBR reales — qué hace la industria

### 2.1 ¿Derivar vs generar cada mapa?

| Enfoque | Quién lo usa | Pros | Contras |
|---|---|---|---|
| **Foto/scan → delight → derive** | Substance Designer, Quixel, fotogrametría | Físicamente correcto | No automatizable desde prompt |
| **Bake desde geometría** | AAA props (Frozenbyte, etc.) | Normales perfectas | Requiere mesh high-poly |
| **Generar albedo → estimar PBR** | Ubisoft CHORD, AI asset packs | Automatizable, coherente entre mapas | Calidad depende del estimador |
| **Generar cada mapa por separado** | Workflows ingenuos (el bug de MatForge) | Ninguno real | ❌ Mapas incoherentes o idénticos |
| **Modelo multi-output (MatFuse)** | Research CVPR 2024 | Un solo paso | Sin ComfyUI; licencia research |

**Práctica estándar en packs AI comerciales:** generar **un** albedo flat-lit seamless → **un** modelo de estimación SVBRDF (CHORD > Marigold/RGBX > heurísticas luminancia).

**Lo que NO hace nadie serio:** `ImageInvert` / `ImageLuminance` del mismo albedo para fabricar normal y roughness. Eso produce mapas correlacionados pero físicamente incorrectos (el roughness no es el invert del albedo).

### 2.2 Pipeline CHORD (referencia AAA)

Ubisoft documenta 3 etapas en su prototipo Generative Base Material:

1. **Texture generation** — seamless, flat-lit, sin perspectiva (prompt: `seamless tiling, orthographic top-down, flat lighting, material surface`)
2. **CHORD estimation** — base color, normal, roughness, metalness en un paso; height vía `ChordNormalToHeight`
3. **Upscale 2×/4×** — por canal, post-estimación

Fuentes:
- Paper SIGGRAPH Asia 2025: https://doi.org/10.1145/3757377.3763848
- Blog Ubisoft: https://www.ubisoft.com/en-us/studio/laforge/news/1i3YOvQX2iArLlScBPqBZs/generative-base-material-an-opensource-prototype-for-pbr-material-estimation-debuting-at-siggraph-asia-2025
- Blog ComfyUI: https://blog.comfy.org/p/ubisoft-open-sources-the-chord-model

### 2.3 MatFuse vs CHORD vs Material Anything

| | MatFuse | CHORD | Material Anything |
|---|---|---|---|
| Output | diffuse, normal, roughness, specular | base, normal, rough, metal, height | full PBR multi-view |
| Input | text, image, sketch, palette | imagen textura | mesh 3D + renders |
| Tileable | ✅ | Input debe serlo | UV-space |
| ComfyUI | ❌ (Diffusers) | ✅ oficial | ❌ (pipeline 3D) |
| Target MatForge | ❌ No encaja | ✅ Ideal | ❌ Es para meshes, no packs 2D |

### 2.4 Cadena de fallback recomendada (mapas)

```
CHORD (primario)
  └─ fallo → RGBX rgb2x (albedo, normal, roughness, metallic por pasadas)
       └─ fallo → Marigold normals + TextureAlchemy rough/AO
            └─ fallo → BAE normal + MiDaS height (actual, solo emergencia)
```

---

## 3. Integración n8n + ComfyUI API

### 3.1 Patrón probado (HTTP)

ComfyUI expone API REST en `:8188`:

| Endpoint | Método | Uso |
|---|---|---|
| `/prompt` | POST | Enviar workflow API-format `{"prompt": {...}}` → `{prompt_id}` |
| `/history/{prompt_id}` | GET | Estado + filenames de salida |
| `/view?filename=X&subfolder=Y&type=output` | GET | Descargar imagen |
| `/queue` | GET | Cola pendiente |
| `/system_stats` | GET | Health check GPU |

Documentación oficial: https://docs.comfy.org/development/comfyui-server/api-examples

**Requisito:** ComfyUI arrancado con `--listen 127.0.0.1` (vía túnel SSH, no exponer públicamente).

### 3.2 Arquitectura n8n recomendada para MatForge

```
[Trigger: Cron / Manual]
    → Read cerebro.csv (pending)
    → Claude Opus: expandir prompt material PBR
    → lambda_gpu_manager: launch A10 --wait
    → SSH: provision (skip si NFS cache OK)
    → SSH: comfyui_tunnel.sh (18188→8188)
    → comfyui_connector.py (o HTTP Request n8n)
    → QA script (hash + tileability)
    → [si fail: retry con seed++ / abort]
    → Blender preview (VPS, CPU)
    → packager.py → ZIP
    → Telegram notify + Filebrowser
    → lambda_gpu_manager: terminate
```

### 3.3 Nodos community n8n

| Paquete | Ventaja | URL |
|---|---|---|
| `n8n-nodes-comfyui-toolkit` | **No bloqueante** — submit/poll/download separados; mejor para batches | https://github.com/federal1789/n8n-nodes-comfyui-toolkit |
| `n8n-nodes-comfyui-all` | Un nodo universal con override de parámetros | https://github.com/ksxh0524/n8n-nodes-comfyui-all |
| `n8n-nodes-comfyui` | Básico, bloquea hasta completar | https://communitynodes.com/n8n-nodes-comfyui/ |

**Recomendación:** mantener `comfyui_connector.py` en VPS (ya tiene guardarraíles) + n8n orquesta alrededor. Si se migra a nodos nativos, usar **toolkit** (no bloqueante).

### 3.4 Errores comunes y mitigaciones

| Error | Causa | Fix |
|---|---|---|
| 4 mapas idénticos | SaveImage todos del mismo nodo | Workflow con ramas separadas + QA MD5 |
| "Calle con gente" | Prompt en nodo negativo / vacío | Centinela `__PROMPT__` sin fallback (ya implementado) |
| `CLIPTextEncode` en SDXL | Encoding incorrecto | Solo `CLIPTextEncodeSDXL` (text_g + text_l) |
| Timeout polling | Generación >10 min | Timeout dinámico: 120s base + 30s por upscale |
| JSON API inválido | Export UI format en vez de API | Siempre "Save (API Format)" |
| Seed como string | API rechaza o ignora | `{"seed": 12345}` entero en nodo |
| Túnel SSH colgado | Pipes heredados en subprocess | `</dev/null >/dev/null 2>&1` (ya parcheado) |
| CRLF en scripts | Túnel no arranca | LF Unix obligatorio en deploy |
| GPU huérfana | launch falló pero instancia creada | `status` post-launch + `terminate-all` |
| Carreras batch | Múltiples batch_pack paralelos | Mutex: 1 batch, 1 GPU, `nohup` |
| Cloudflare 1010 Lambda API | User-Agent bot | User-Agent navegador (ya en lambda_gpu_manager) |

---

## 4. Lambda Labs GPU on-demand — best practices

### 4.1 Persistent filesystem (NFS)

- Montaje: `/lambda/nfs/<FILESYSTEM_NAME>` (ej. `/lambda/nfs/Juegos`)
- **Solo se adjunta al crear la instancia** — no se puede añadir después
- Misma región que la instancia
- Docs: https://docs.lambda.ai/public-cloud/filesystems/

**Qué cachear en NFS (ya iniciado por MatForge):**

```
/lambda/nfs/Juegos/
├── models/
│   ├── checkpoints/sd_xl_base_1.0.safetensors
│   ├── checkpoints/chord_v1.safetensors
│   ├── loras/
│   └── upscale_models/4x-UltraSharp.pth
├── ComfyUI/custom_nodes/  (opcional, acelera provision)
└── comfyui_workflow.json
```

### 4.2 Provision once, reuse always

`provision_lambda.sh` debe:
1. Instalar ComfyUI + custom nodes solo si no existen en NFS/local
2. `SKIP_SDXL_DOWNLOAD=1` cuando modelo ya en NFS
3. Symlink modelos: `ln -s /lambda/nfs/Juegos/models/* ComfyUI/models/`
4. systemd `comfyui.service` con `--listen 127.0.0.1 --port 8188`

**Tiempo:** ~5.5 min primera vez con NFS cache vs ~20 min sin cache.

### 4.3 SSH tunnel (no abrir 8188)

```bash
# En VPS — túnel local
ssh -N -L 127.0.0.1:18188:127.0.0.1:8188 ubuntu@<LAMBDA_IP> </dev/null >/dev/null 2>&1 &
# Conector apunta a 127.0.0.1:18188
```

Ventajas: cero superficie de ataque, sin tocar firewall Lambda.

### 4.4 Evitar instancias huérfanas

Protocolo obligatorio:
1. `lambda_gpu_manager.py status` **antes** de launch
2. Launch → anotar `instance_id`
3. Si `failed to spawn` → `status` de nuevo → terminate huérfanas
4. Trabajo completado → `terminate <id>` (no confiar en auto-shutdown)
5. Cron diario: script que lista instancias activas y alerta Telegram

### 4.5 Coste GPU A10

| Fuente | Precio/hora |
|---|---|
| MatForge prueba real (22 jun) | $1.29/h |
| Lambda oficial (mar 2026) | $0.86/h |
| Agregadores (jun 2026) | $0.75–$1.29/h |

**Usar $1.00/h como estimación conservadora.**

---

## 5. QA automático de texturas

### 5.1 Checks obligatorios (gate antes de ZIP)

| Check | Método | Umbral sugerido | Implementación |
|---|---|---|---|
| **PBR no duplicado** | MD5 de los 4 PNG | Todos distintos | ✅ `comfyui_connector.py` |
| **Tileability** | TexTile metric (CVPR 2024) | score > 0.7 | `pip install textile-metric` |
| **Seam visual** | Grid 2×2 + diferencia borde | mean diff < 15% | Pillow/numpy |
| **Semántica material** | CLIP cosine vs prompt | > 0.25 (calibrar) | `open_clip` o `transformers` |
| **Resolución mínima** | Dimensiones | ≥ 1024² (o 2048 si upscale) | Pillow |
| **Rango PBR** | Normal z-channel, roughness variance | std > 0.05 | numpy |
| **No personas/objetos** | CLIP negativo "people, street, buildings" | < 0.20 | open_clip |
| **Aesthetic** | CLIP + aesthetic predictor | > 5.0 (AVA scale) | opcional |

### 5.2 TexTile — métrica de tileability

- Paper: https://arxiv.org/abs/2403.12961
- Repo: https://github.com/crp94/textile
- PyPI: `textile-metric`
- Detecta discontinuidades en bordes y patrones repetitivos — precisamente lo que un ojo humano ve en Fab/Itch.io

```python
import textile
from textile.utils.image_utils import read_and_process_image
score = textile.Textile()(read_and_process_image("albedo.png"))
# Gate: score > 0.7 → pass
```

### 5.3 Seam check algorítmico (complemento)

```python
# Pseudocódigo — diferencia borde izquierdo vs derecho
left  = albedo[:, 0, :]
right = albedo[:, -1, :]
seam_error = np.mean(np.abs(left.astype(float) - right.astype(float)))
# Gate: seam_error < 20 (0-255 scale)
```

### 5.4 MC Tile Checker (visual QA)

Nodo `MC: Tile Checker` de mc-pbr-master renderiza 3×3 con marcadores de seam — útil para debug manual y para generar preview en Blender.

### 5.5 Política de reintento

```
generación → QA
  ├─ fail semántica → regenerar con seed+1 (max 3)
  ├─ fail tileability → regenerar con seed+1 + reforzar prompt "seamless"
  ├─ fail PBR hash → abort workflow (error config, no reintentar)
  └─ 3 fails → marcar cerebro.csv estado=failed, Telegram alerta
```

---

## 6. Referencias concretas

### Papers

| Paper | Relevancia | URL |
|---|---|---|
| CHORD (SIGGRAPH Asia 2025) | Estimación SVBRDF AAA | https://doi.org/10.1145/3757377.3763848 |
| MatFuse (CVPR 2024) | Generación multi-mapa | https://arxiv.org/abs/2403.12961 (verificar ID MatFuse) |
| TexTile (CVPR 2024) | QA tileability | https://arxiv.org/abs/2403.12961 |
| MaterialMVP (ICCV 2025) | PBR multi-view meshes | https://arxiv.org/abs/2503.10289 |
| Material Anything (CVPR 2025) | PBR para 3D | https://xhuangcv.github.io/MaterialAnything/ |
| RGBX | Descomposición intrínseca | https://github.com/zheng95z/rgbx |

### Repos GitHub clave

- https://github.com/ubisoft/ComfyUI-Chord
- https://github.com/amtarr/ComfyUI-TextureAlchemy
- https://github.com/soojungkn/mc-pbr-master
- https://github.com/leob03/ComfyUI-rgbx
- https://github.com/GeekatplayStudio/ComfyUI_Blender_toolbox
- https://github.com/crp94/textile
- https://github.com/gvecchio/MatFuse (HuggingFace: gvecchio/MatFuse)
- https://github.com/federal1789/n8n-nodes-comfyui-toolkit

### Tutoriales / guías

| Recurso | Tipo | URL |
|---|---|---|
| ComfyUI Ep16 Seamless Textures | Video/curso | https://completeaitraining.com/course/comfyui-course-ep16-how-to-create-seamless-patterns-tileable-textures/ |
| Blender Artists — PBR ComfyUI+Blender | Foro tutorial | https://blenderartists.org/t/generate-pbr-seamless-texture-with-comfyui-and-blender/1552277 |
| Seamless PBR Civitai article | Workflow + LoRAs | https://civitai.com/articles/11045/seamless-pbr-texture-generator-with-all-maps |
| n8n + ComfyUI automation | Blog técnico | https://sebsvisual.com/2024/07/21/automating-ai-image-generation-with-n8n-and-comfyui/ |
| ComfyUI + n8n 2026 guide | HTTP patterns | https://use-apify.com/blog/comfyui-n8n-image-generation |
| AITextured — photo to PBR | Industria packs | https://aitextured.com/articles/create_seamless_pbr_textures_from_photos_and_when_to_use_ai.html |
| SDXL tiling guide | Fundamentos | https://www.aiarty.com/stable-diffusion-guide/stable-diffusion-tiling.htm |
| Lambda filesystem docs | Infra | https://docs.lambda.ai/public-cloud/filesystems/ |

---

## 7. Recomendación final — stack concreto MatForge

### 7.1 Stack definitivo

```
┌─────────────────────────────────────────────────────────────┐
│  CEREBRO (n8n VPS)                                          │
│  cerebro.csv → Claude Opus (prompt engineer material)       │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GPU LAMBDA A10 (on-demand, NFS cache)                      │
│  ┌─ Stage 1: ALBEDO ─────────────────────────────────────┐  │
│  │ Checkpoint: Juggernaut XL v9 (o SDXL base 1.0)         │  │
│  │ Encoding:  CLIPTextEncodeSDXL (__PROMPT__ centinela)   │  │
│  │ Tiling:    Asymmetric_Tiling_KSampler (tileX+tileY)    │  │
│  │ Decode:    Circular VAEDecode                          │  │
│  │ Upscale:   4x-UltraSharp (opcional, pre-CHORD)         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌─ Stage 2: PBR MAPS ───────────────────────────────────┐  │
│  │ CHORD: ChordMaterialEstimation                         │  │
│  │ Height: ChordNormalToHeight                            │  │
│  │ Fallback: RGBX rgb2x (si CHORD falla)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌─ Stage 3: QA ───────────────────────────────────────────┐  │
│  │ MD5 guard + TexTile + CLIP semantic + seam diff        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼ SSH tunnel :18188
┌─────────────────────────────────────────────────────────────┐
│  VPS POST-PROCESO (CPU)                                     │
│  Blender preview → packager.py → ZIP → Filebrowser          │
│  Telegram notify                                            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Workflow JSON — estructura nodos

```json
{
  "grupos": {
    "1_prompt": ["CLIPTextEncodeSDXL (pos=__PROMPT__, neg=fijo)"],
    "2_generate": [
      "CheckpointLoaderSimple → Juggernaut_XL",
      "Asymmetric_Tiling_KSampler (1024x1024, dpmpp_2m, 30 steps, cfg 5)",
      "CircularVAEDecode"
    ],
    "3_upscale": ["ImageUpscaleWithModel → 4x-UltraSharp (opcional)"],
    "4_chord": [
      "ResizeAndPadImage (1024)",
      "ChordLoadModel",
      "ChordMaterialEstimation",
      "ChordNormalToHeight"
    ],
    "5_export": [
      "SaveImage → albedo",
      "SaveImage → normal",
      "SaveImage → roughness",
      "SaveImage → height",
      "SaveImage → metallic (si aplica)"
    ]
  },
  "api_variables": {
    "prompt": {"node_id": "2", "field": "text_g", "sentinel": "__PROMPT__"},
    "seed": {"node_id": "7", "field": "seed"}
  }
}
```

**Negativo fijo recomendado:**
```
people, characters, street, road, buildings, perspective, horizon, sky, 
cartoon, illustration, text, watermark, blurry, low quality, 
scene, landscape, objects, furniture
```

**Positivo — template Claude Opus:**
```
seamless tileable texture, orthographic top-down view, flat lighting, 
macro surface detail, {material_keywords}, game-ready PBR material, 
8k detail, photorealistic surface, no shadows, no perspective
```

### 7.3 Pipeline n8n — agentes

| Agente / Nodo | Rol |
|---|---|
| **Agente Prompt** (Claude Opus 4.8) | CSV → prompt material especializado + negativo |
| **Agente GPU** (`lambda_gpu_manager.py`) | Ciclo vida A10: launch/wait/terminate |
| **Agente Tunnel** (`comfyui_tunnel.sh`) | SSH tunnel seguro |
| **Agente Generate** (`comfyui_connector.py`) | API ComfyUI + download + QA MD5 |
| **Agente QA** (nuevo script propuesto) | TexTile + CLIP + seam |
| **Agente Preview** (Blender headless VPS) | Esfera PBR Cycles |
| **Agente Pack** (`packager.py`) | ZIP + thumbnail itch.io |
| **Agente Notify** (Telegram) | Entrega + errores |

### 7.4 Coste estimado por pack (A10)

| Fase | Tiempo | Coste @ $1.00/h |
|---|---|---|
| Provision (NFS cache hit) | ~2 min | $0.033 |
| Generación 1 pack (SDXL+CHORD) | ~45 s | $0.013 |
| QA + download | ~10 s | $0.003 |
| Blender preview (VPS CPU) | ~30 s | $0 (VPS) |
| Packager (VPS CPU) | ~5 s | $0 |
| **Total marginal por pack** (GPU caliente) | **~60 s** | **~$0.017** |
| **Batch 4 packs** (GPU caliente) | ~4 min | **~$0.07** |
| **Batch 4 packs** (cold start) | ~7 min | **~$0.12** |
| Terminate overhead | ~10 s | $0.003 |

**Coste mensual estimado (20 packs/día, 600/mes):** ~$10–15 GPU + VPS fijo.

### 7.5 Por qué los resultados ridículos NO volverán

| Problema histórico | Causa | Solución arquitectónica |
|---|---|---|
| 4 mapas idénticos | SaveImage ×4 del mismo tensor | CHORD genera 4 salidas distintas + guardarraíl MD5 |
| Calle con gente | Prompt vacío/mal nodo | Centinela `__PROMPT__` + negativo anti-escena + CLIP QA |
| Sin seamless | SDXL base sin tiling | `Asymmetric_Tiling_KSampler` + `CircularVAEDecode` |
| PBR falso (filtros) | ImageInvert/Luminance | CHORD SVBRDF real |
| batch_pack colgado | Túnel SSH + carreras | Mutex 1 GPU + healthcheck pre-flight |
| GPU huérfana | launch sin cleanup | Protocolo status/terminate |

### 7.6 Roadmap de validación (antes de producción)

- [ ] **V1:** Probar CHORD en A10 con 1 prompt "medieval stone wall" vía túnel
- [ ] **V2:** Comparar CHORD vs BAE/MiDaS actual (blind test visual)
- [ ] **V3:** Integrar TexTile QA en connector
- [ ] **V4:** 1 batch_pack completo (4 packs) sin intervención manual
- [ ] **V5:** Validar licencia CHORD para venta comercial Fab/Itch.io
- [ ] **V6:** A/B Juggernaut XL vs SDXL base para albedo

---

## Apéndice A — Prompt engineering para materiales

Claude Opus debe generar prompts con esta estructura:

```
POSITIVO: seamless tileable {material} texture, orthographic top-down, 
flat diffuse lighting, macro detail, {surface_features}, game asset, 
physically based, 1024x1024, sharp focus

NEGATIVO: people, characters, animals, street, road, city, buildings, 
horizon, sky, perspective, depth of field, scene, objects, props, 
cartoon, anime, illustration, painting, text, watermark, logo, 
blurry, low quality, jpeg artifacts
```

Materiales por estilo (desde cerebro.csv):

| estilo | checkpoint | LoRA opcional |
|---|---|---|
| fotoreal | Juggernaut XL | — |
| stylized | SDXL base | SXZ Texture Bringer |
| hand-painted | Flux Dev | Flux Hand-Painted Textures |
| sci-fi metal | Juggernaut XL | — + CHORD metallic |
| organic | SDXL base | — |

---

## Apéndice B — custom_nodes a instalar en provision_lambda.sh

```bash
# Obligatorios — pipeline COMERCIAL (Fab/Itch)
ComfyUI-seamless-tiling      # SeamlessTile + MakeCircularVAE
ComfyUI-Marigold             # kijai — normals, IID, depth (diffusers≥0.28)
ComfyUI-TextureAlchemy       # PBRExtractor + SeamlessTiling post
asymmetric-tiling-comfyui    # fallback tiling (ya probado MatForge)
ComfyUI_essentials           # ImageResize, etc.

# R&D calidad (NO vender output)
ComfyUI-Chord                # benchmark vs Marigold

# Fallback / emergencia
comfyui_controlnet_aux       # BAE/MiDaS (actual)
comfy_mtb                    # Deep Bump height alternativo

# Recomendados QA
# VPS: pip install textile-metric pillow numpy
```

---

## Apéndice C — lo que NO está 100% validado

| Item | Estado | Acción requerida |
|---|---|---|
| CHORD en A10 MatForge | ⚠️ No probado | Run manual 1 pack (solo R&D) |
| Licencia comercial CHORD | ❌ Research-only | No vender; usar Marigold en prod |
| Licencia comercial RGBX | ❌ Adobe Research | Descartado para venta |
| Pipeline comercial Marigold | ⚠️ No integrado | TextureAlchemy / nodos Marigold |
| TexTile umbral 0.7 | ⚠️ Teórico | Calibrar con 20 texturas buenas/malas |
| Juggernaut XL > SDXL base | ⚠️ Comunidad dice sí | A/B test |
| Flux como motor principal | ❌ Descartado | Seamless nativo insuficiente |
| batch_pack end-to-end | ⚠️ Bloqueado 22 jun | Retry con mutex + no paralelo |
| MiDaS height degradado | ⚠️ Conocido | CHORD NormalToHeight lo reemplaza |

---

## Apéndice D — Log loop investigación (3 días, cada 30 min)

**Inicio:** 25 jun 2026 ~17:00. **Fin programado:** 28 jun 2026.  
**Reglas:** solo investigación local + GitHub MCP; sin `batch_pack`, sin GPUs Lambda sin OK explícito de Max.

### Iteración 1 (25 jun 2026)

**Licencia CHORD — hallazgo crítico**

Texto oficial `ubisoft/ComfyUI-Chord` LICENSE (*Ubisoft Machine Learning License Research-Only*):

- **Permitted Purpose:** solo investigación/académica.
- **§5:** *"Commercial use is strictly prohibited"* — incluye actividad con ventaja comercial o compensación monetaria.
- **§3:** Ubisoft no reclama derechos sobre *Outputs* **solo** cuando el uso del modelo cumple el Permitted Purpose (research).

**Implicación para MatForge:** vender packs en Fab/Itch.io generados con CHORD **no encaja** en la licencia actual. Opciones:

1. **Prototipo interno / calidad** con CHORD; **venta comercial** con pipeline alternativo (RGBX, Marigold+TextureAlchemy, BAE/MiDaS).
2. Contactar Ubisoft La Forge para licencia comercial (poco probable a corto plazo).
3. Priorizar **RGBX** (`toyxyz/ComfyUI_rgbx_Wrapper` o `leob03/ComfyUI-rgbx`) para packs de pago.

**Workflow oficial SDXL+CHORD**

Ubisoft publica `example_workflows/chord_sdxl_t2i_image_to_material.json`:

| Etapa | Nodos clave |
|---|---|
| Albedo seamless | `SeamlessTile` + `MakeCircularVAE` + KSampler (no `Asymmetric_Tiling` en el oficial) |
| PBR | `ChordLoadModel` → `ChordMaterialEstimation` → 4 salidas + `ChordNormalToHeight` |
| Checkpoint ejemplo | `Raymnants.6.2.safetensors` (SDXL); MatForge puede usar `sd_xl_base_1.0` o Juggernaut |
| Prompt ejemplo | *"texture of large old broken rocks with moss, top down view, seamless tileable"* |

**Gap local:** carpeta `research/` solo tiene `README.md` — clones shallow pendientes (siguiente iteración).

**Agenda rotativa próximas iteraciones:** RGBX licencia, TexTile QA, n8n-comfyui-toolkit, Geekatplay Blender toolbox, comparativa SeamlessTile vs Asymmetric_Tiling.

### Iteración 2 (25 jun 2026)

**RGBX — también NO comercial**

El modelo base `zheng95z/rgbx` usa **Adobe Research License**:

- Solo *noncommercial research purposes*.
- Prohibido *commercial licensing, development of commercial products, or any activity which results in commercial gain*.

El wrapper `toyxyz/ComfyUI_rgbx_Wrapper` expone nodo `rgb2x` que llama a `zheng95z/rgb-to-x` en HuggingFace — **5 pasadas** (albedo, normal, roughness, metallic, irradiance) a ~50 steps cada una → **lento** (~5× inferencia vs CHORD) y **misma traba legal**.

**Conclusión licencias (tabla definitiva para Fab/Itch):**

| Estimador PBR | Calidad estimada | Comercial Fab/Itch | Notas |
|---|---|---|---|
| **CHORD** | ⭐⭐⭐⭐⭐ | ❌ Research-only Ubisoft | OK benchmark interno / R&D |
| **RGBX** | ⭐⭐⭐ | ❌ Adobe Research | Descartado para venta |
| **Marigold** (normals + IID appearance) | ⭐⭐⭐⭐ | ✅ OpenRAIL++-M, sin reclamo sobre Output | **Pipeline comercial #1** |
| **BAE + MiDaS** (actual) | ⭐⭐ | ✅ Open weights | Emergencia / ya probado |
| **DeepBump** height | ⭐⭐⭐ | ✅ GPLv3 | Height desde normal post-Marigold |

**Arquitectura dual recomendada (nuevo estándar MatForge):**

```
┌─ R&D / calidad referencia (NO vender output) ─────────────────┐
│ SDXL seamless → CHORD → QA → comparar con pipeline comercial   │
└────────────────────────────────────────────────────────────────┘

┌─ PRODUCCIÓN COMERCIAL (Fab / Itch.io) ────────────────────────┐
│ 1. SDXL + SeamlessTile + MakeCircularVAE (o Asymmetric_Tiling) │
│ 2. Marigold Normals v1.1 (desde albedo generado)               │
│ 3. Marigold IID Appearance v1.1 (albedo refine + roughness)    │
│ 4. DeepBump normal→height (seamless)                           │
│ 5. QA: MD5 + TexTile + seam diff + CLIP                        │
│ 6. Blender preview + packager ZIP                             │
└────────────────────────────────────────────────────────────────┘
```

**SeamlessTile vs Asymmetric_Tiling_KSampler**

`ComfyUI-seamless-tiling` documenta que el tiling X/Y viene del mismo algoritmo que `asymmetric-tiling-sd-webui`. El workflow **oficial Ubisoft** usa `SeamlessTile` + `MakeCircularVAE`; MatForge actual usa `Asymmetric_Tiling_KSampler`. Ambos son válidos — **priorizar alinear con Ubisoft** en próximo workflow JSON para reducir variables al integrar CHORD en R&D.

**n8n — mejor patrón async**

`n8n-nodes-comfyui-toolkit` (MIT): submit → `prompt_id` inmediato → `Wait Until Result` → `Get Results`. Evita bloquear ejecuciones n8n (problema del batch colgado). Instalar en VPS: `npm install n8n-nodes-comfyui-toolkit` en community nodes.

**QA TexTile**

- Paquete: `pip install textile-metric` (MIT).
- Corre en **VPS CPU** post-descarga, no en GPU.
- Umbral 0.7 sigue siendo hipótesis — calibrar con textura buena del muro 22 jun vs calle fallida.

**Repos `research/`:** CHORD, seamless-tiling, rgbx, DeepBump, Blender_toolbox, n8n-toolkit presentes. TextureAlchemy carpeta vacía — re-clonar en iter. 3.

**Próxima iteración:** nodos Marigold en ComfyUI (TextureAlchemy o Marigold nativo), draft `qa_texture.py`, comparar Geekatplay PBR Studio workflow.

### Iteración 3–5 — Recuperación batch (26 jun 2026)

Consolidado de ~15 ticks del loop que **no despertaron agente** (Cursor cerrado). Investigación ejecutada manualmente al recuperar.

#### Pipeline comercial definitivo (implementable)

```
[GPU Lambda A10 — ComfyUI]

A) ALBEDO (seamless)
   CheckpointLoaderSimple (sd_xl_base_1.0 o Juggernaut XL)
   → SeamlessTile + MakeCircularVAE          # spinagon/ComfyUI-seamless-tiling
   → CLIPTextEncodeSDXL (__PROMPT__ / negativo anti-escena)
   → KSampler 1024² → VAEDecode → albedo_raw

B) PBR — 3 pasadas Marigold v2 (kijai/ComfyUI-Marigold, diffusers≥0.28)
   Modelos HF (OpenRAIL++-M, comercial OK en outputs):
   • prs-eth/marigold-normals-v1-1        → normal
   • prs-eth/marigold-iid-appearance-v1-1 ┐
   • prs-eth/marigold-iid-lighting-v1-1   ┘→ TextureAlchemy PBRExtractor → albedo, roughness, metallic, AO
   • prs-eth/marigold-depth-v1-1          → height (invert en nodo v2)

   Ajustes recomendados A10:
   - LCMScheduler, denoise_steps=4, ensemble_size=3, processing_resolution=768
   - keep_model_loaded=False entre pasadas (libera VRAM)
   - Tiempo estimado PBR: ~45–90 s tras albedo

C) POST (opcional TextureAlchemy)
   → SeamlessTiling post si seam QA falla
   → HeightAmplifier si height plano

[CPU VPS]
   qa_texture.py → pass/fail → packager ZIP
```

**Custom nodes a añadir en `provision_lambda.sh` (comercial):**

| Pack | Repo | Licencia |
|---|---|---|
| ComfyUI-seamless-tiling | spinagon | MIT |
| ComfyUI-Marigold | kijai | Apache 2.0 (modelos RAIL++) |
| ComfyUI-TextureAlchemy | amtarr | Apache 2.0 |
| asymmetric-tiling-comfyui | alsritter | Mantener como fallback |

**CHORD:** solo nodo R&D en instancia separada o flag `--research` (no mezclar outputs comerciales).

#### Geekatplay PBR Studio

Workflow `Geekatplay_PBR_Texture_Studio_workflow.json` usa nodos propios `GapPBRExtractor` / `GapChannelPacker` — **requiere su custom node**, no es drop-in. Útil como referencia de empaquetado ORM, no como motor principal.

#### n8n — workflow async concreto (VPS)

```
[Cron / Webhook cerebro.csv]
  → HTTP: lambda_gpu_manager launch + wait
  → SSH: comfyui_tunnel.sh start
  → ComfyUI Submit Workflow (toolkit) → prompt_id
  → Wait Until Result (timeout 300s, poll 5s)
  → Get Results → base64 PNGs
  → Execute Command: python qa_texture.py ...
  → IF pass → packager.py / Telegram
  → IF fail → seed+1 retry (max 3) / terminate GPU
```

URL ComfyUI desde n8n Docker: `http://host.docker.internal:18188` (túnel SSH en host).

**Instalar:** Settings → Community Nodes → `n8n-nodes-comfyui-toolkit`

#### QA — `scripts/matforge/qa_texture.py` (nuevo)

- MD5 distintos entre mapas (detecta PBR falso).
- Seam diff borde L/R + T/B (umbral 20/255, calibrar).
- TexTile opcional (`pip install textile-metric` en VPS).
- Uso: `python qa_texture.py --albedo a.png --normal n.png --roughness r.png --height h.png`

#### Coste revisado pipeline comercial

| Fase | Tiempo A10 |
|---|---|
| Albedo SDXL seamless | ~30 s |
| Marigold ×4 pasadas | ~60–90 s |
| **Total GPU/pack** | **~1.5–2 min** |
| QA + ZIP (VPS) | ~30 s CPU |

Marginal ~$0.03–0.04/pack (GPU caliente @ $1/h).

#### Loop — limitación real

El timer PowerShell **sí dispara ticks**, pero el agente **solo investiga si Cursor está abierto** con sesión activa que reciba la notificación `notify_on_output`. No es un daemon 24/7 autónomo. Solución: mantener Cursor abierto en este proyecto, o ejecutar investigación en bloques al volver (como esta recuperación).

**Loop reiniciado** 26 jun con `notify_on_output` para ticks futuros mientras Cursor esté activo.

### Iteración 6 (26 jun 2026 — tick loop)

**VRAM A10 (24 GB) — orden de ejecución secuencial**

| Paso | VRAM aprox. | Notas |
|---|---|---|
| SDXL albedo + SeamlessTile | ~8–10 GB | Liberar antes de Marigold |
| Marigold normals-v1-1 | ~6–8 GB | `keep_model_loaded=False` |
| Marigold IID appearance | ~6–8 GB | Mismo loader, otro checkpoint |
| Marigold IID lighting | ~6–8 GB | Input a PBRExtractor |
| Marigold depth-v1-1 | ~6–8 GB | Height final |
| **Pico si todo cargado** | ❌ >24 GB | **Nunca paralelizar** — siempre secuencial |

**Pendiente iter. 7:** exportar `matforge_commercial_workflow.json` en API format (siguiente tick).

### Iteración 7 (26 jun 2026 — pivot ecosistema StableMaterials)

**Nuevo candidato principal: StableMaterials** (`gvecchio/StableMaterials`, OpenRAIL ✅)

- Un prompt → basecolor + normal + height + roughness + metallic, `tileable=True` nativo.
- LCM **4 steps** (rápido) o **50 steps** (calidad); resolución base **512²**; refiner HF anunciado.
- Misma línea que **MatFuse** (MIT) pero más maduro en HuggingFace.

**ComfyUI hoy:** `research/ComfyUI_PBR_Maker` (MIT)
- `Load_MatForger` + `MatForger_Sampler`; default `gvecchio/MatForger` — probar `gvecchio/StableMaterials`.
- Salida empaquetada en tensores → **connector debe separar 5 PNG** (cambio vs workflow actual).

**Propuestas de cambio al ecosistema (pendiente A/B GPU):**

| Componente | Cambio | Prioridad |
|---|---|---|
| `provision_lambda.sh` | + PBR_Maker, diffusers≥0.28; cache StableMaterials en NFS | P0 |
| `comfyui_connector.py` | `engine=stablematerials\|marigold\|chord_rd` | P0 |
| Workflow API JSON | MatForger_Sampler + `__PROMPT__` | P0 |
| `batch_pack.py` | Mutex; flag A/B; qa_texture pre-ZIP | P1 |
| n8n VPS | `n8n-nodes-comfyui-toolkit` async | P1 |
| `cerebro.csv` | Columna `engine` opcional | P2 |
| CHORD | Solo benchmark interno | R&D |

**Agenda loop (7 temas rotativos / 30 min):** StableMaterials API · MatFuse vs OpenRAIL · Lotus-2 · n8n · upscale 512→1024 · QA umbrales · provision_lambda delta.

**Loop reiniciado** 26 jun modo `ecosystem` con `notify_on_output`.

### Iteración 8 (26 jun 2026 — tick: StableMaterials API + connector)

**Hallazgos técnicos `ComfyUI_PBR_Maker`:**

| Tema | Detalle |
|---|---|
| Repo HF | Probar `gvecchio/StableMaterials` (no solo `MatForger`) en `Load_MatForger` |
| Salida nodo | `MatForger_Sampler` devuelve **2 tensores**, no 5 PNG: `image` = stack [basecolor, normal]; `image_l` = stack [height, roughness, metallic] |
| Connector | Hay que **desempaquetar** batch dim 0 → 5 archivos antes de QA/ZIP; o añadir 5× `SaveImage` en workflow API |
| Modo rápido LCM | HF usa `unet_lcm` + 4 steps — **el nodo no lo expone**; propuesta: fork nodo o cargar LCM en `provision_lambda` |
| img2img | Input `image` opcional convierte prompt en PIL → compatible con albedo SDXL previo si híbrido |
| VRAM | `enable_vae_tiling` + FreeU ya activos — OK A10 |
| Bug menor | `Save_with_prefix` guarda mal path (sin `/` en filename) — no usar; guardar vía connector |

**Workflow API mínimo propuesto:**

```
Load_MatForger(repo=gvecchio/StableMaterials)
→ MatForger_Sampler(prompt=__PROMPT__, tileable=true, 512², steps=4 con LCM o 25 estándar)
→ [split custom o 5 SaveImage]
→ /history download
```

**Cambio connector:** función `unpack_matforger_tensors(rgb_batch, l_batch) -> dict[str, Path]`.

### Iteración 9 (26 jun 2026 — tick: MatFuse MIT vs StableMaterials OpenRAIL)

| | **MatFuse** | **StableMaterials** |
|---|---|---|
| Licencia código | **MIT** ✅ (máxima libertad) | Pipeline custom HF (`trust_remote_code`) |
| Licencia pesos HF | Verificar card — familia Vecchio, suele ser permisiva | **OpenRAIL** ✅ (vender outputs OK) |
| Mapas | diffuse, normal, roughness, **specular** | basecolor, normal, height, roughness, **metallic** |
| Tileable | ✅ nativo | ✅ feature rolling |
| ComfyUI | ❌ solo Diffusers/Gradio | ✅ `ComfyUI_PBR_Maker` |
| VRAM | ≥12 GB | ~10–14 GB (estimado, VAE tiling ayuda) |
| Autor | Giuseppe Vecchio (mismo) | Evolución semi-supervised de MatFuse |

**Veredicto MatForge:** priorizar **StableMaterials** (más mapas, height, nodo ComfyUI, LCM 4-step). **MatFuse** queda como plan B si OpenRAIL de StableMaterials molesta legalmente — MIT del código MatFuse permite fork del wrapper sin atar a PBR_Maker.

**No competir con CHORD en licencia** — ambos vendibles están por debajo en coherencia SVBRDF; CHORD solo benchmark.

### Iteración 10 (26 jun 2026 — Lotus-2 / ComfyUI-Lotus)

**Lotus-2** (Apache 2.0 ✅) — normals/depth SOTA; no da roughness/metallic.

**ComfyUI:** `kijai/ComfyUI-Lotus` — nodos `LotusSampler`, modelos en `Kijai/lotus-comfyui`.

**Rol en MatForge:** upgrade **híbrido** si StableMaterials falla en geometría:
- Motor principal: StableMaterials (5 mapas).
- Refinar solo normal+height con Lotus-2 si QA detecta normal plana.

**provision_lambda:** añadir `ComfyUI-Lotus` como opcional P2 (no bloqueante para A/B).

**Loop reiniciado** 26 jun (proceso anterior muerto sin ticks nuevos).

### Iteración 11 (26 jun 2026 — tick: StableMaterials params producción)

Parámetros recomendados `MatForger_Sampler` para cerebro.csv (pendiente A/B):

| Parámetro | Valor | Nota |
|---|---|---|
| `repo_id` | `gvecchio/StableMaterials` | No MatForger legacy |
| `tileable` | `true` | Obligatorio Fab |
| `width/height` | 512 | Base; upscale post si refiner no disponible |
| `step` | 4 (LCM) / 25–50 (calidad) | LCM tras cargar `unet_lcm` en provision |
| `cfg` | 10.0 | HF readme usa `guidance_scale=10` (nodo default 6 → subir) |
| Prompt | `__PROMPT__` + sufijo `, seamless tileable texture, top down, flat lighting` | Anti-escena |

**Coste estimado LCM:** ~15–30 s/pack en A10 (1 pasada vs 4 Marigold).

### Iteración 12 (26 jun 2026 — tick: n8n toolkit async)

Workflow n8n propuesto para MatForge (VPS Docker):

```
[Cron 6h / Webhook manual]
→ SSH: lambda_gpu_manager.py status (0 GPUs)
→ launch --wait → tunnel 18188
→ ComfyUI Submit (toolkit, workflow JSON MatForger)
→ Wait Until Result (timeout 300s, poll 5s)
→ Get Results → Execute Command: qa_texture.py
→ IF ok: packager + Telegram
→ terminate GPU
```

**Instalar:** Community Nodes → `n8n-nodes-comfyui-toolkit`  
**URL ComfyUI:** `http://host.docker.internal:18188`  
**Nota:** matar loop duplicado PID 13940 — solo queda loop 580226.

### Iteración 13 (26 jun 2026 — tick: upscale 512→1024)

StableMaterials base = **512²**. Para packs Fab/Itch a **1024+**:

| Opción | Pros | Contras |
|---|---|---|
| **Refiner HF** (anunciado, no publicado) | Calidad nativa | Esperar release |
| **4x-UltraSharp por canal** (ya en NFS) | Probado MatForge | 5× inferencia upscale (~+60s) |
| **Real-ESRGAN tile** | Rápido | Riesgo romper seamless — QA TexTile obligatorio |
| **Vender 512** | Cero coste | Flojo para AAA |

**Propuesta:** upscale **solo albedo** 4x pre-estimación si híbrido SDXL→StableMaterials; si motor único StableMaterials, upscale **los 5 mapas** con mismo factor + seam QA.

**Loop activo:** PID 483256, armado 26 jun.

### Iteración 14 (26 jun 2026 — tick: QA umbrales calibración)

Propuesta calibración `qa_texture.py` con muestras conocidas:

| Muestra | Origen | TexTile esperado | seam diff |
|---|---|---|---|
| **Buena** | Muro piedra 22 jun (4 MD5 distintos) | >0.75 (medir) | <15 |
| **Mala** | Calle gris 22 jun (4 MD5 iguales) | fail MD5 antes TexTile | — |
| **Synthetic bad seam** | offset 50% albedo | cualquiera | >30 |

**Acción A/B GPU:** guardar scores al generar → CSV `qa_calibration.csv` → ajustar umbrales.

**MatFuse specular vs metallic:** en packs Itch usar metallic; specular de MatFuse = legacy, renombrar en packager.

### Iteración 15 (26 jun 2026 — tick: provision_lambda delta)

**Custom nodes a instalar en Lambda (orden):**

```bash
# P0 — motor comercial candidato
git clone ComfyUI_PBR_Maker          # StableMaterials/MatForger
pip install diffusers>=0.28 transformers accelerate

# P0 — tiling (si híbrido SDXL+SM)
git clone ComfyUI-seamless-tiling
git clone asymmetric-tiling-comfyui

# P1 — fallback Marigold
git clone ComfyUI-Marigold
git clone ComfyUI-TextureAlchemy

# P2 — opcional
git clone ComfyUI-Chord              # solo R&D benchmark
git clone ComfyUI-Lotus

# NFS cache
# gvecchio/StableMaterials (~2-4 GB)
# sd_xl_base_1.0 (ya cacheado)
```

**Cambio vs provision actual:** quitar prioridad `comfyui_controlnet_aux` como motor principal; mantener solo emergencia.

**Loop activo:** PID 35640 (594757).

### Iteración 16 (26 jun 2026 — tick: MatFuse vs StableMaterials decisión)

**Decisión provisional MatForge (pre-A/B):**

| Criterio | Ganador |
|---|---|
| Automatización cerebro.csv (texto→pack) | **StableMaterials** (1 nodo ComfyUI) |
| Licencia más simple | **MatFuse** (MIT pesos+código) |
| Mapas completos (height+metallic) | **StableMaterials** |
| Calidad paper | Empate familia Vecchio |
| Integración ya hecha | **StableMaterials** via PBR_Maker |

**Regla:** producción = StableMaterials; si legal duda → MatFuse MIT con wrapper propio en `batch_pack`.

### Iteración 17 (26 jun 2026 — tick: StableMaterials integración batch)

**Flujo `batch_pack.py` propuesto (motor StableMaterials):**

```
cerebro.csv (prompt, engine=stablematerials)
→ launch A10 + provision
→ tunnel 18188
→ POST /prompt workflow MatForger_Sampler
→ unpack 5 mapas (rgb_batch + l_batch)
→ qa_texture.py
→ blender preview (VPS)
→ packager ZIP
→ terminate GPU
```

**Ventaja vs pipeline actual:** 1 inferencia GPU vs SDXL+4×Marigold (~2 min → ~30 s).

**Loop activo:** PID 26892 (323534).

### Iteración 18 (26 jun 2026 — tick: Lotus-2 upgrade path)

**Cuándo activar Lotus sobre StableMaterials:**
- QA detecta `normal` con baja varianza (std < 0.05)
- Preview Blender muestra specular "plano"
- Materiales orgánicos (musgo, tela) donde depth importa

**Pipeline híbrido:**
```
StableMaterials (5 mapas) → si fail QA normal → Lotus-2 normal only → re-QA → pack
```

**Coste extra:** +20–40 s GPU solo en retry (~10% packs estimado).

### Iteración 19 (26 jun 2026 — tick: StableMaterials LCM + workflow API)

**Modo rápido LCM (4 steps)** — cargar en provision:

```python
unet = UNet2DConditionModel.from_pretrained(
    "gvecchio/StableMaterials", subfolder="unet_lcm", torch_dtype=float16)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
```

**Workflow API mínimo (nodos):**
1. `Load_MatForger` → repo `gvecchio/StableMaterials`
2. `MatForger_Sampler` → prompt `__PROMPT__`, tileable=true, 512², step=4, cfg=10
3. Post-proceso en connector: split tensor[0]=basecolor, [1]=normal; tensor_l[0..2]=height,rough,metal

**Pendiente:** exportar JSON API y probar `/prompt` en A10 (requiere OK Max).

### Iteración 20 (26 jun 2026 — tick: MatFuse plan B implementación)

**Si StableMaterials/OpenRAIL no convence legalmente, plan B MatFuse (MIT):**

```python
# batch_pack.py — modo matfuse (Diffusers, sin ComfyUI)
pipe = DiffusionPipeline.from_pretrained("gvecchio/MatFuse", trust_remote_code=True, torch_dtype=float16)
result = pipe(text=prompt_from_cerebro, num_inference_steps=50, guidance_scale=4.0, tileable=True)
# outputs: diffuse, normal, roughness, specular → renombrar diffuse→albedo, specular→metallic si metallic=0
```

**Pros:** licencia MIT cristalina; tileable nativo.  
**Contras:** sin height map (usar Marigold depth o Lotus); sin nodo ComfyUI; integración custom en batch_pack.

**Loop estable:** 2 ticks reales en 323534 (PID 26892) ✅

### Iteración 21 (26 jun 2026 — tick: Lotus-2 upgrade modelos + post-proceso)

**Modelos HF a cachear en Lambda** (`ComfyUI/models/lotus/` vía `Kijai/lotus-comfyui`):

| Uso | Archivo | Notas |
|-----|---------|-------|
| Depth/height retry | `lotus-depth-g-v2-1-disparity-fp16.safetensors` | Lotus-G: más detalle en escenas complejas |
| Normal retry | `lotus-normal-d-v1-0.safetensors` | Lotus-D: más rápido, regresión directa |
| VAE compartido | `vae-ft-mse-840000-ema-pruned.safetensors` | Mismo que ejemplo TextureAlchemy |

**Nodos workflow retry** (solo si `qa_texture.py --check-normal` falla):
1. `LoadImage` ← albedo StableMaterials
2. `LoadLotusModel` + `LotusSampler` (normal-d-v1-0)
3. Opcional height: segundo `LotusSampler` (depth-g-v2-1) → `LotusHeightProcessor` (TextureAlchemy, 16-bit EXR)

**Post-proceso crítico** (`map_utils.py`): Lotus emite en convención OGL — flip canal Y en normal antes de empaquetar; height normalizar 0–1 tras `LotusHeightProcessor`.

**Reemplazo pipeline viejo:** BAE normal + MiDaS height → Lotus-2 solo en retry; no cargar BAE/MiDaS en provision nueva.

**VRAM retry:** ~+4 GB peak (1 LotusSampler); secuencial tras unload MatForger.

**Loop estable:** 3 ticks reales en 323534 (PID 26892) ✅

### Iteración 22 (26 jun 2026 — tick: n8n toolkit instalación VPS)

**Paquete:** `n8n-nodes-comfyui-toolkit` (MIT, v1.x) — submit no bloqueante + `Wait Until Result` + `Get Results`.

**Instalar en VPS** (contenedor `matforge-n8n`, no `n8n` genérico):

```bash
docker exec -it matforge-n8n sh -c "cd /home/node/.n8n/nodes && npm install n8n-nodes-comfyui-toolkit"
docker restart matforge-n8n
# Si EACCES:
docker exec -it --user root matforge-n8n chown -R node:node /home/node/.n8n/
```

**Linux Docker — obligatorio** en `docker-compose.yml` del stack n8n:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Sin esto, `host.docker.internal` no resuelve en Ubuntu y el nodo da `ECONNREFUSED`.

**URL ComfyUI desde n8n:** `http://host.docker.internal:18188` (túnel SSH host→Lambda:8188, **no** 8188 directo).

**Nodo para MatForger:** `ComfyUI Text to Image` → pegar `matforge_commercial_workflow.json` (API format) en **Workflow JSON**; prompt vía expresión n8n `{{ $json.prompt }}` sustituyendo centinela `__PROMPT__`.

**Parámetros Wait Until Result (StableMaterials LCM):** timeout **300 s**, poll **5 s**, `prompt_id` = `{{ $json.prompt_id }}`.

**Gotcha dedup ComfyUI:** seed fijo → job 0.00 s → nodo lanza error; usar `seed` aleatorio por fila `cerebro.csv`.

**Alternativa conservadora:** mantener `comfyui_connector.py` en host (fuera Docker) y n8n solo orquesta SSH/túnel/Telegram — toolkit como plan B cuando el conector esté migrado a MatForger.

**Loop estable:** 4 ticks reales en 323534 (PID 26892) ✅

### Iteración 23 (26 jun 2026 — tick: upscale 512→1024 implementación)

**Objetivo venta:** 1024² (Fab/Itch mínimo cómodo). StableMaterials base = 512² → factor **2×**, no 4×.

| Mapa | Método recomendado | Motivo |
|------|-------------------|--------|
| **Albedo** | `UpscaleModel` + `4x-UltraSharp`, **scale 0.5** (salida 1024) | Detalle visual; ya en NFS MatForge |
| **Normal** | `ImageScale` Lanczos **2×** | UltraSharp distorsiona tangentes → specular roto |
| **Height** | Lanczos **2×** + re-normalizar 0–1 | Preserva relieve relativo |
| **Roughness / Metallic** | Lanczos **2×** | Mapas escalar, sin IA |

**Fórmula TextureAlchemy** (`CalculateUpscale`): con upscaler 4× y 1 paso, `scale_per_pass = 2/4 = 0.5` → 512×4×0.5 = **1024**.

**Workflow post-MatForger** (5 ramas paralelas tras split connector):
```
tensor split → [albedo: UltraSharp scale=0.5] | [normal/height/rough/metal: ImageScale 2.0 lanczos]
→ qa_texture.py --seam + TexTile por mapa
```

**Coste GPU extra:** ~8–12 s (solo albedo IA); resto CPU en VPS (~1 s/mapa).

**Anti-patrón:** 4× completo en los 5 mapas (+60 s) o vender 512 sin avisar.

**Pendiente A/B:** comparar albedo UltraSharp 0.5 vs esperar refiner HF StableMaterials.

**Loop estable:** 5 ticks reales en 323534 (PID 26892) ✅

### Iteración 24 (26 jun 2026 — tick: QA umbrales + gate batch)

**Estado `qa_texture.py` (defaults en repo):**

| Check | Umbral default | Cuándo falla |
|-------|----------------|--------------|
| MD5 únicos | todos distintos | PBR falso (calle 22 jun) |
| Seam (albedo) | mean diff ≤ **20**/255 | Borde L/R ≠ T/B |
| TexTile (albedo) | ≥ **0.7** | Opcional si `pip install textile-metric` |
| Resolución | ≥ **1024** lado | Post-upscale iter. 23 |

**QA en dos fases** (nuevo flag `--min-side`):

```bash
# Fase 1 — tras MatForger 512² (antes upscale)
python qa_texture.py --albedo a.png --normal n.png ... --min-side 512 --seam-max 18

# Fase 2 — tras upscale 1024²
python qa_texture.py ... --min-side 1024 --textile-min 0.72 --seam-max 22
```

**Árbol de retry `batch_pack.py`:**

```
fail MD5 → abort (no retry, bug workflow)
fail seam ≤2 retries → seed+1
fail TexTile → retry seed+1; si 3× fail → descartar pack
fail resolución → no retry (bug upscale)
normal plana (pendiente: std < 0.05) → Lotus-2 retry (iter. 21)
```

**Calibración pendiente GPU:** medir seam real del muro piedra (22 jun) → ajustar `--seam-max` de 20 a valor medido ±2.

**Gap código:** sin check automático de varianza en normal — añadir en próxima iteración o en A/B.

**Loop estable:** 6 ticks reales en 323534 (PID 26892) ✅

### Iteración 25 (26 jun 2026 — tick: provision_lambda v2 consolidado)

**Delta vs provision actual (22 jun, SDXL+BAE/MiDaS):**

| Antes | Después (comercial) |
|-------|---------------------|
| Motor SDXL + controlnet_aux | **ComfyUI_PBR_Maker** + `gvecchio/StableMaterials` |
| BAE normal, MiDaS height | Lotus-2 **solo retry** (P2) |
| SDXL 6.9 GB obligatorio | SDXL opcional (`SKIP_SDXL=1` si motor único SM) |
| workflow `comfyui_pbr_workflow.json` | `matforge_commercial_workflow.json` en NFS |

**NFS objetivo** (`/lambda/nfs/Juegos/`):

```
models/
  checkpoints/sd_xl_base_1.0.safetensors     # legacy híbrido
  upscale_models/4x-UltraSharp.pth           # ya existe
  lotus/lotus-depth-g-v2-1-disparity-fp16.safetensors
  lotus/lotus-normal-d-v1-0.safetensors
  lotus/vae-ft-mse-840000-ema-pruned.safetensors
  diffusers/gvecchio--StableMaterials/       # ~2–4 GB (unet + unet_lcm + vae)
custom_nodes/                                 # symlinks → ComfyUI/custom_nodes
matforge_commercial_workflow.json
comfyui_workflow.json                         # symlink al anterior
```

**Orden install (idempotente, ~3 min con NFS hit):**

```bash
NFS=/lambda/nfs/Juegos
COMFY=~/ComfyUI

# 1. ComfyUI base (skip si $NFS/custom_nodes existe)
# 2. Nodes P0
for r in ComfyUI_PBR_Maker ComfyUI_essentials ComfyUI-TextureAlchemy; do
  [ -d "$COMFY/custom_nodes/$r" ] || git clone --depth 1 ... "$COMFY/custom_nodes/$r"
done
# 3. Nodes P2 (retry)
for r in ComfyUI-Lotus; do ...; done
# 4. pip: diffusers>=0.28 transformers accelerate textile-metric
# 5. Symlink modelos NFS → ComfyUI/models/
# 6. huggingface-cli download gvecchio/StableMaterials --local-dir $NFS/models/diffusers/gvecchio--StableMaterials
# 7. systemd comfyui --listen 127.0.0.1 --port 8188
```

**Flags entorno:**

| Flag | Efecto |
|------|--------|
| `SKIP_SDXL_DOWNLOAD=1` | No bajar SDXL si symlink OK |
| `ENGINE=stablematerials` | No instalar controlnet_aux |
| `ENGINE=marigold_fallback` | + Marigold nodes |
| `ENABLE_CHORD_RD=0` | Default; 1 solo benchmark interno |

**Tiempo estimado:** NFS hit ~2–3 min | cold + StableMaterials HF ~8–12 min | sin NFS ~25 min.

**Fuente repo:** `scripts/matforge/provision_lambda.sh` (pendiente sync desde VPS `/opt/matforge/scripts/`).

**Loop estable:** 7 ticks reales en 323534 (PID 26892) ✅ — **ciclo 7 temas completo**.

### Iteración 26 (26 jun 2026 — tick 2º ciclo: MatForger salidas reales)

**Lectura código `MatForger_node.py`** (no son tensores opacos — salida explícita):

| Output nodo | Contenido | Índices batch |
|-------------|-----------|---------------|
| `image` (RGB) | basecolor + normal | `[0]` albedo, `[1]` normal |
| `image_l` (L) | height + roughness + metallic | `[0]` height, `[1]` rough, `[2]` metal |

Cada mapa es PIL internamente → `phi2narry` → tensor. En workflow API usar **`ImageFromBatch`** (ComfyUI core) ×2 tras el sampler.

**`Load_MatForger`:** cambiar `repo_id` → `gvecchio/StableMaterials` (mismo nodo; default sigue `MatForger`).

**Parámetros producción 512² (LDM calidad):**

```
tileable=true, patched=false, step=50, cfg=6.0, 512×512
```

- `patched=true` activa `tiled_attn` del pipeline (refiner SDEdit, no publicado) — **no usar** en base 512.
- `tileable=true` usa feature rolling del U-Net (seamless nativo).

**LCM (4 steps):** el nodo **no** carga `unet_lcm`. Parche mínimo en `Load_MatForger`:

```python
# si env USE_LCM=1
unet = UNet2DConditionModel.from_pretrained(repo_id, subfolder="unet_lcm", torch_dtype=torch.float16)
pipe = DiffusionPipeline.from_pretrained(repo_id, trust_remote_code=True, unet=unet, torch_dtype=torch.float16)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
# sampler: step=4, cfg=10
```

**Workflow API esqueleto:**

```
Load_MatForger(repo_id=StableMaterials) → MatForger_Sampler(prompt=__PROMPT__)
  → ImageFromBatch(image, 0) → SaveImage albedo
  → ImageFromBatch(image, 1) → SaveImage normal
  → ImageFromBatch(image_l, 0..2) → SaveImage height/rough/metal
```

**Pendiente:** exportar `matforge_commercial_workflow.json` con estos splits (sin GPU).

**Loop estable:** 8 ticks reales en 323534 (PID 26892) ✅

### Iteración 27 (26 jun 2026 — tick 2º ciclo: MatFuse vs StableMaterials matriz)

**Corrección iter. 20:** MatFuse **no tiene** `tileable=True` en `pipeline_matfuse.py` — seamless requiere post-proceso (SeamlessTile / offset + QA).

| | **StableMaterials** | **MatFuse** |
|---|---|---|
| Licencia | OpenRAIL ✅ venta | **MIT** ✅ (más simple legal) |
| Resolución nativa | **512²** | **256²** (×4 upscale para 1024) |
| Mapas | 5: albedo, normal, height, rough, **metallic** | 4: diffuse, normal, rough, **specular** (sin height) |
| Tileable | `tileable=true` nativo (feature rolling) | ❌ post-proceso obligatorio |
| ComfyUI | `ComfyUI_PBR_Maker` | Solo Diffusers (`MatFusePipeline`) |
| Condicionamiento | texto (+ img opcional en SM) | texto + **palette + sketch + imagen** |
| Steps típicos | 50 LDM / 4 LCM | 50, `guidance_scale=4–7.5` |
| VRAM A10 | ~6–8 GB | ~8–10 GB (4 encoders VQ) |

**Cuándo elegir MatFuse (plan B):**
- Abogado/inversor exige MIT explícito sobre OpenRAIL.
- Pack necesita **palette/sketch** de referencia (cerebro.csv con colores).
- Aceptas height vía Lotus/Marigold + specular→metallic en packager.

**Cuándo elegir StableMaterials (default):**
- Automatización texto→pack sin condiciones extra.
- Tileable sin post-proceso.
- 5 mapas en 1 inferencia.

**Decisión MatForge sin cambio:** producción = StableMaterials; MatFuse = plan B legal o condicionamiento rico.

**Loop estable:** 9 ticks reales en 323534 (PID 26892) ✅

### Iteración 28 (26 jun 2026 — tick 2º ciclo: Lotus retry workflow API)

**Sub-workflow retry** (inyectar solo si QA falla normal; input = albedo StableMaterials):

```
LoadImage(albedo) → VAEEncode → LotusSampler(lotus-normal-d-v1-0)
  → VAEDecode → LotusNormalProcessor(invert_green=true, strength=1.0)
  → SaveImage normal_lotus.png
```

**Depth/height retry** (solo si height SM tiene degradado MiDaS-like — raro con SM; útil post-MatFuse):

```
LoadImage(albedo) → VAEEncode → LotusSampler(lotus-depth-g-v2-1-disparity)
  → VAEDecode → LotusHeightProcessor(16-bit) → SaveImage height_lotus.png
```

**Post-proceso TextureAlchemy** (defaults validados en repo):
- `LotusNormalProcessor`: **`invert_green=true`** (Lotus → convención OpenGL/Blender).
- `LotusHeightProcessor`: normalizar 0–1; guardar EXR si 16-bit.

**Parámetros `LotusSampler`** (ejemplo TextureAlchemy): seed fijo por retry, resolución **1024** si albedo ya upscaled; si retry en fase 512, usar **512** para evitar mismatch.

**Connector `engine=stablematerials` + retry:**

```python
def maybe_lotus_retry(albedo_png, qa_result):
    if qa_result.get("normal_std", 1.0) >= 0.05:
        return None  # SM normal OK
    return submit_subworkflow("lotus_normal_retry.json", {"albedo": albedo_png})
```

**No re-ejecutar Lotus en roughness/metallic** — SM ya los genera; Lotus solo normal/depth.

**Dependencia:** `ComfyUI-Lotus` (kijai) + modelos en `models/lotus/` (iter. 21).

**Loop estable:** 10 ticks reales en 323534 (PID 26892) ✅

### Iteración 29 (26 jun 2026 — tick 2º ciclo: n8n orquestación cerebro.csv)

**Dos modos** (mientras falta `matforge_commercial_workflow.json`):

| Modo | Cuándo | Flujo |
|------|--------|-------|
| **A — pragmático (ahora)** | Pre-A/B GPU | n8n orquesta scripts en **host VPS**, no ComfyUI dentro de Docker |
| **B — toolkit (objetivo)** | Post-workflow JSON | nodos ComfyUI toolkit en cadena |

**Workflow n8n modo A** (recomendado hasta OK Max + A/B):

```
[Cron 6h / Webhook "generar"]
→ Read Binary File: /opt/matforge/n8n_data/cerebro.csv
→ Spreadsheet File → filter status=pending
→ IF: Execute Command (host) lambda_gpu_manager.py status → 0 instancias
→ Execute Command: nohup batch_pack.py --max 1 --verbose
→ Wait 5 min → Read packs_finales/ newest ZIP
→ Telegram (TELEGRAM_BOT_TOKEN ya en .env)
→ On Error → Telegram alert + terminate-all
```

**Nota:** `Execute Command` debe correr en el **host** (`docker exec` no ve túnel 18188 del host). Alternativa: montar socket SSH o usar n8n **SSH node** al localhost.

**Workflow n8n modo B** (1 fila cerebro):

```
Set: workflow = readFile(matforge_commercial_workflow.json)
Set: workflow.prompt = replace(__PROMPT__, {{$json.prompt}})
ComfyUI Text to Image (URL :18188, session_id={{$json.id}})
→ Wait Until Result (300s)
→ Get Results → Code: guardar 5 PNG en /tmp/pack_{id}/
→ Execute Command: qa_texture.py --min-side 512
→ IF fail → Lotus retry sub-workflow (iter. 28)
→ upscale branch → qa fase 2 → packager.py
→ terminate GPU
```

**Inyección prompt en JSON** (expresión n8n):

```javascript
={{ $json.workflow.replaceAll('__PROMPT__', $json.prompt.replace(/"/g, '\\"')) }}
```

**Mutex GPU:** nodo IF antes de launch — si `status` > 0 instancias → Wait 60s → reintentar (evita carrera 22 jun).

**Instalación toolkit:** sigue pendiente en VPS (iter. 22); modo A no la requiere.

**Loop estable:** 11 ticks reales en 323534 (PID 26892) ✅

### Iteración 30 (26 jun 2026 — tick 2º ciclo: upscale workflow ComfyUI)

**Rama post-split** (tras iter. 26 `ImageFromBatch`) — ejecutar **después** de QA fase 1 (`--min-side 512`):

```
# Albedo — IA
ImageFromBatch[0] → UpscaleToResolution(target=1024, mult=4, passes=1)
  → scale_per_pass=0.5 → ImageUpscaleWithModel(4x-UltraSharp, scale=0.5)

# Normal / height / rough / metal — Lanczos
ImageFromBatch[*] → ImageScale(upscale_method="lanczos", width=1024, height=1024)
```

`UpscaleToResolution` (TextureAlchemy) calcula `scale_per_pass` automático — evita error manual 512→2048.

**Orden pipeline completo:**

```
MatForger 512 → split 5 mapas → QA fase 1 (512)
→ upscale → QA fase 2 (1024, seam+TexTile en albedo) → ZIP
```

**Seam:** el upscale IA puede empeorar borde — TexTile **obligatorio** post-upscale albedo; si falla → retry solo albedo con otro seed.

**Tiers venta Fab/Itch:**

| SKU | Resolución | Upscale |
|-----|------------|---------|
| Standard | 1024² | 1× UltraSharp 0.5 + Lanczos mapas |
| Pro (futuro) | 2048² | 2 passes (`number_of_passes=2`, target=2048) |

**MatFuse plan B:** base 256² → `target=1024` → `scale_per_pass=1.0` en 4× (4×256=1024); albedo IA, resto Lanczos ×4.

**Loop estable:** 12 ticks reales en 323534 (PID 26892) ✅

### Iteración 31 (26 jun 2026 — tick 2º ciclo: QA normal_std + Lotus hook)

**Implementado en `qa_texture.py`:**
- Check `normal_std` — std RGB del normal; umbral default **0.05**.
- Flag CLI `--normal-min-std`.
- JSON output incluye `"retry": "lotus_normal"` si falla → `batch_pack` puede lanzar sub-workflow iter. 28.

**Umbrales por fase (consolidado):**

| Fase | `--min-side` | `--seam-max` | `--textile-min` | `--normal-min-std` |
|------|--------------|--------------|-----------------|-------------------|
| Post-SM 512 | 512 | 18 | — (skip) | 0.05 |
| Post-upscale 1024 | 1024 | 22 | 0.72 | 0.05 |

**`batch_pack` parseo sugerido:**

```python
qa = json.loads(subprocess.check_output([...]))
if not qa["ok"] and qa["checks"].get("normal_std", {}).get("retry") == "lotus_normal":
    run_lotus_retry(...)
elif not qa["ok"]:
    ...
```

**Pendiente calibración GPU:** medir `normal_std` del muro piedra (22 jun) como baseline buena.

**Loop estable:** 13 ticks reales en 323534 (PID 26892) ✅

### Iteración 32 (26 jun 2026 — tick 2º ciclo: provision_lambda script en repo)

**Nuevo:** `scripts/matforge/provision_lambda.sh` (v2) — sincronizable con VPS `/opt/matforge/scripts/`.

**Variables:**

| Var | Default | Uso |
|-----|---------|-----|
| `NFS` | `/lambda/nfs/Juegos` | Cache modelos + workflow |
| `ENGINE` | `stablematerials` | `marigold_fallback` añade Marigold |
| `SKIP_SDXL_DOWNLOAD` | `1` | SDXL solo si híbrido legacy |
| `ENABLE_LOTUS` | `1` | Clona ComfyUI-Lotus (retry) |

**Post-provision checklist (sin generar pack):**

```bash
curl -s http://127.0.0.1:8188/system_stats | jq .system.os
curl -s http://127.0.0.1:8188/object_info | jq 'keys[]' | grep -E 'MatForger|Lotus|Upscale'
ls -la /lambda/nfs/Juegos/models/diffusers/gvecchio--StableMaterials/model_index.json
```

**Deploy:** `scp provision_lambda.sh ubuntu@<LAMBDA_IP>:/tmp/` → `sudo bash /tmp/provision_lambda.sh`

**Siguiente tras OK Max:** A/B GPU con script v2 + `qa_texture.py` en VPS.

**Loop estable:** 14 ticks reales en 323534 (PID 26892) ✅ — **2º ciclo 7 temas completo**.

### Iteración 33 (27 jun 2026 — tick 3º ciclo: matforge_commercial_workflow.json)

**Exportado:** `scripts/matforge/matforge_commercial_workflow.json` (API format).

**Grafo:** `Load_MatForger(StableMaterials)` → `MatForger_Sampler(__PROMPT__, 512², tileable, step=50)` → `ImageFromBatch` ×5 → `SaveImage` con prefijos:

| Prefijo | Mapa |
|---------|------|
| `matforge_albedo` | basecolor |
| `matforge_normal` | normal |
| `matforge_height` | height |
| `matforge_roughness` | roughness |
| `matforge_metallic` | metallic |

**Inyección prompt:** centinela `__PROMPT__` + `_meta.title: prompt` (compatible `comfyui_connector.py`).

**Limitaciones conocidas (validar en A/B):**
- `MatForger_Sampler` **no expone seed** — riesgo dedup ComfyUI; workaround: variar prompt suffix o parchear nodo.
- `image_l` batch puede ser 1-canal — si `SaveImage` falla, añadir `ImageRepeat` (×3 canales) en iter. futura.
- Upscale 1024 **no incluido** en este JSON (rama post-QA fase 1, iter. 30).

**Deploy NFS:** `cp matforge_commercial_workflow.json /lambda/nfs/Juegos/`

**Loop estable:** 15 ticks reales en 323534 (PID 26892) ✅

### Iteración 34 (27 jun 2026 — tick 3º ciclo: legal OpenRAIL + protocolo A/B)

**Licencia StableMaterials (HF `license: openrail`):**
- ✅ **Venta comercial** de outputs (Fab/Itch) permitida si no violas use restrictions (contenido ilegal, dañino, engañoso).
- ❌ **No es** research-only como CHORD/RGBX.
- Obligación: no redistribuir **pesos** del modelo como producto propio sin cumplir OpenRAIL; vender **texturas generadas** = OK.
- MatFuse **MIT** = menos fricción legal, pero más fricción técnica (iter. 27).

**Conclusión legal MatForge:** OpenRAIL basta para vender packs; MatFuse solo si quieres MIT explícito o palette/sketch.

**Protocolo A/B GPU** (requiere OK Max — 1 sesión ~30 min A10):

| Paso | StableMaterials | MatFuse |
|------|-----------------|---------|
| Prompt | `medieval stone wall with moss` (cerebro.csv) | mismo |
| Motor | `matforge_commercial_workflow.json` | Diffusers `MatFusePipeline` 256² |
| Post | QA fase 1 `--min-side 512` | + SeamlessTile + Lotus height |
| Métricas | `qa_texture.py` JSON, tiempo GPU, $/pack | idem |

**CSV resultados:** `qa_ab_results.csv` — columnas: `engine`, `seam`, `textile`, `normal_std`, `seconds`, `pass`.

**cerebro.csv — columna opcional `engine`:** `stablematerials` (default) | `matfuse` | `chord_rd` (nunca vender).

**Loop estable:** 16 ticks reales en 323534 (PID 26892) ✅

### Iteración 35 (27 jun 2026 — tick 3º ciclo: lotus_normal_retry.json)

**Exportado:** `scripts/matforge/lotus_normal_retry.json` — sub-workflow API para retry tras `normal_std` fail (iter. 31).

**Flujo:** `LoadImage(__ALBEDO_FILENAME__)` → VAEEncode → `LotusSampler(normal-d-v1-0, res=512)` → VAEDecode → `LotusNormalProcessor(invert_green=true)` → `matforge_normal_lotus`.

**Connector:** subir albedo a `ComfyUI/input/`, sustituir `__ALBEDO_FILENAME__`, POST `/prompt`, descargar `matforge_normal_lotus_*.png`, reemplazar normal del pack.

**Resolución:** `512` si retry en fase 1; cambiar widget `resolution` a `1024` si albedo ya upscaled (iter. 28).

**Hook batch_pack:**

```python
if qa["checks"].get("normal_std", {}).get("retry") == "lotus_normal":
    submit("lotus_normal_retry.json", albedo_filename=uploaded_name)
```

**Loop estable:** 17 ticks reales en 323534 (PID 26892) ✅

### Iteración 36 (27 jun 2026 — tick 3º ciclo: n8n modo B desbloqueado)

**Pre-requisitos modo B ahora cumplidos en repo:**
- `matforge_commercial_workflow.json` (iter. 33)
- `lotus_normal_retry.json` (iter. 35)
- `deploy_n8n_toolkit.sh` — instala community nodes en `matforge-n8n`

**Cadena n8n modo B actualizada:**

```
Read cerebro.csv → filter pending
→ SSH: lambda launch + tunnel 18188
→ Read File: /opt/matforge/scripts/matforge_commercial_workflow.json
→ Code: inject __PROMPT__ + random seed suffix (evitar dedup 0.00s)
→ ComfyUI Text to Image (:18188) → Wait 300s → Get Results
→ Save 5 PNGs → qa_texture.py --min-side 512
→ IF normal_std.retry=lotus_normal:
     Upload albedo → lotus_normal_retry.json → Get Results → swap normal
→ upscale (host script o 2º workflow futuro) → qa fase 2
→ packager → Telegram → terminate GPU
```

**docker-compose.yml** (añadir bajo servicio `n8n`):

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

**VPS pendiente:** ejecutar `bash deploy_n8n_toolkit.sh` + copiar los 2 JSON a `/opt/matforge/scripts/`.

**Loop estable:** 18 ticks reales en 323534 (PID 26892) ✅

### Iteración 37 (27 jun 2026 — tick 3º ciclo: matforge_upscale_1024.json)

**Exportado:** `scripts/matforge/matforge_upscale_1024.json` — fase 2 tras QA 512.

**Estrategia (iter. 23/30):**
- **Albedo:** `4x-UltraSharp` (512→2048) → `ImageScale` Lanczos a **1024** (evita depender de `scale=0.5` en upscaler).
- **Normal/height/rough/metal:** `ImageScale` Lanczos directo 512→1024.

**Placeholders:** `__ALBEDO__`, `__NORMAL__`, `__HEIGHT__`, `__ROUGHNESS__`, `__METALLIC__` (archivos en `ComfyUI/input/`).

**Salidas:** prefijos `matforge_*_1024` → entrada a `qa_texture.py --min-side 1024 --textile-min 0.72`.

**Orden batch_pack:**

```
matforge_commercial_workflow.json → QA fase 1
→ matforge_upscale_1024.json → QA fase 2 → packager
```

**Loop estable:** 19 ticks reales en 323534 (PID 26892) ✅

### Iteración 38 (27 jun 2026 — tick 3º ciclo: QA --phase + roughness_std)

**`qa_texture.py` ampliado:**
- `--phase 1` → 512², seam≤18, TexTile omitido (post-MatForger).
- `--phase 2` → 1024², seam≤22, TexTile≥0.72 (post-upscale).
- `--roughness-min-std` (default 0.03) — detecta roughness plano (PBR falso tipo calle 22 jun).

**Uso batch_pack:**

```bash
python qa_texture.py --phase 1 --albedo a.png --normal n.png --roughness r.png --height h.png --metalness m.png
# ... upscale ...
python qa_texture.py --phase 2 --albedo a_1024.png ...
```

**Retry según check:**

| Fail | Acción |
|------|--------|
| `normal_std` | Lotus retry (iter. 35) |
| `roughness_std` / `md5_unique` | seed+1 MatForger (max 3) |
| `seam` / `textile` fase 2 | retry albedo upscale o descartar |

**Loop estable:** 20 ticks reales en 323534 (PID 26892) ✅

### Iteración 39 (27 jun 2026 — tick 3º ciclo: provision_lambda v2.1)

**`provision_lambda.sh` actualizado:**
- Sync automático a NFS: `matforge_commercial_workflow.json`, `lotus_normal_retry.json`, `matforge_upscale_1024.json` (desde mismo dir que el script).
- Descarga Lotus models (`Kijai/lotus-comfyui`) si faltan en NFS.
- Symlink `4x-UltraSharp.pth` + WARN si falta.
- Smoke test nodos: `Load_MatForger`, `LotusSampler`, `LotusNormalProcessor`, `ImageUpscaleWithModel`.

**Stack MatForge en repo (listo para A/B):**

| Archivo | Rol |
|---------|-----|
| `provision_lambda.sh` | GPU setup |
| `matforge_commercial_workflow.json` | Generación SM |
| `lotus_normal_retry.json` | Retry normal |
| `matforge_upscale_1024.json` | Upscale |
| `qa_texture.py` | Gate `--phase 1/2` |
| `comfyui_connector.py` | API ComfyUI + MD5 guard |
| `deploy_n8n_toolkit.sh` | n8n VPS |

**3º ciclo 7 temas completo.** Pendiente: OK Max → 1× A/B GPU con protocolo iter. 34.

**Loop estable:** 21 ticks reales en 323534 (PID 26892) ✅

### Iteración 40 (27 jun 2026 — tick 4º ciclo: comfyui_connector.py SM)

**Nuevo:** `scripts/matforge/comfyui_connector.py` — sincronizable con VPS.

**Funciones:**
- Carga `matforge_commercial_workflow.json` (o `--workflow` custom).
- Inyección `__PROMPT__` sin fallback ciego (exit 2 si falta centinela).
- Sufijo `[seed:N]` por defecto (evita dedup 0.00s ComfyUI / n8n iter. 22).
- Descarga solo `matforge_*` + guard MD5 distintos (exit 1 PBR falso).

**Uso (túnel VPS 18188):**

```bash
python comfyui_connector.py 127.0.0.1:18188 "medieval stone wall with moss" --out ./pack_001
python qa_texture.py --phase 1 --albedo pack_001/matforge_albedo_00001_.png ...
```

**Sub-workflows:** `run_workflow()` reutilizable para `lotus_normal_retry.json` / `matforge_upscale_1024.json` con `replacements={"__ALBEDO__": "albedo.png"}` (batch_pack futuro).

**Stack repo ahora 7 archivos** — falta solo `batch_pack.py` orquestador.

**Loop estable:** 22 ticks reales en 323534 (PID 26892) ✅

### Iteración 41 (27 jun 2026 — tick 4º ciclo: matfuse_generate.py A/B)

**Nuevo:** `scripts/matforge/matfuse_generate.py` — rama MatFuse del protocolo A/B (iter. 34).

**Uso en Lambda (mismo prompt que SM):**

```bash
python matfuse_generate.py "medieval stone wall with moss" --out ./ab_matfuse --size 256
python qa_texture.py --phase 1 --albedo ab_matfuse/matforge_albedo.png \
  --normal ab_matfuse/matforge_normal.png --roughness ab_matfuse/matforge_roughness.png
# height omitido — Lotus depth antes de pack final
```

**Comparar con SM:**

```bash
python comfyui_connector.py 127.0.0.1:18188 "medieval stone wall with moss" --out ./ab_sm
python qa_texture.py --phase 1 --albedo ... # 5 mapas
```

**Registrar en `qa_ab_results.csv`:** `engine,seconds,seam,textile,normal_std,roughness_std,pass`.

**MatFuse en provision:** no requiere ComfyUI node; `pip install diffusers` + HF `gvecchio/MatFuse` (~VRAM 8–10 GB).

**Loop estable:** 23 ticks reales en 323534 (PID 26892) ✅

### Iteración 42 (27 jun 2026 — tick 4º ciclo: Lotus integrado en connector)

**Nuevo:** `lotus_depth_retry.json` — height para rama MatFuse (sin mapa height nativo).

**`comfyui_connector.py` ampliado:**
- `upload_image()` → POST `/upload/image`
- `run_lotus_retry(albedo, mode=normal|depth)`
- CLI: `--lotus-normal albedo.png` | `--lotus-depth albedo.png`
- `apply_tokens()` — sub-workflows sin centinela `__PROMPT__`

**Uso tras QA fail:**

```bash
python comfyui_connector.py 127.0.0.1:18188 --lotus-normal ./pack/matforge_albedo.png
python comfyui_connector.py 127.0.0.1:18188 --lotus-depth ./ab_matfuse/matforge_albedo.png
```

**provision_lambda.sh:** sync `lotus_depth_retry.json` a NFS.

**Loop estable:** 24 ticks reales en 323534 (PID 26892) ✅

### Iteración 43 (27 jun 2026 — tick 4º ciclo: batch_pack.py + n8n modo A)

**Nuevo:** `scripts/matforge/batch_pack.py` — orquestador que n8n invoca (modo A iter. 29).

**Default `--dry-run`:** imprime plan sin GPU. **`--execute`** requiere túnel 18188 + OK Max.

**Flujo execute:** SM/MatFuse → QA fase 1 → Lotus retry → upscale 1024 → QA fase 2.

**n8n Execute Command (host VPS):**

```bash
cd /opt/matforge/scripts/matforge && python3 batch_pack.py --execute --max 1 --comfy-host 127.0.0.1:18188
```

**Compose:** `n8n_extra_hosts.snippet.yaml` → pegar en `docker-compose.yml` para modo B toolkit.

**Stack repo completo (9 scripts/workflows).**

**Loop estable:** 25 ticks reales en 323534 (PID 26892) ✅

### Iteración 44 (27 jun 2026 — tick 4º ciclo: upscale híbrido CPU/GPU)

**Optimización coste:** solo **albedo** necesita GPU (UltraSharp); mapas PBR escalan en **CPU VPS** (~1 s total).

| Mapa | Método | Dónde |
|------|--------|-------|
| Albedo | `matforge_upscale_1024.json` (UltraSharp→1024) | Lambda GPU |
| Normal/height/rough/metal | `upscale_cpu.py` Lanczos 1024 | VPS CPU |

**Nuevo:** `scripts/matforge/upscale_cpu.py`

```bash
python upscale_cpu.py pack/matforge_normal*.png pack/matforge_height*.png ...
```

**Nuevo:** `download_ultrasharp.sh` → NFS `models/upscale_models/4x-UltraSharp.pth`

**batch_pack (futuro):** tras QA fase 1, llamar ComfyUI solo con albedo en workflow reducido + `upscale_cpu.py` para el resto → ahorra ~40% tiempo GPU en fase upscale.

**Loop estable:** 26 ticks reales en 323534 (PID 26892) ✅

### Iteración 45 (27 jun 2026 — tick 4º ciclo: QA CSV A/B logging)

**`qa_texture.py` ampliado:**
- `--append-csv qa_ab_results.csv` — fila con timestamp, engine, phase, métricas.
- `--engine stablematerials|matfuse` — etiqueta para protocolo A/B (iter. 34).

**Ejemplo sesión A/B:**

```bash
python qa_texture.py --phase 1 --engine stablematerials --append-csv qa_ab_results.csv \
  --albedo ab_sm/matforge_albedo.png --normal ... 
python qa_texture.py --phase 1 --engine matfuse --append-csv qa_ab_results.csv \
  --albedo ab_matfuse/matforge_albedo.png --normal ...
```

**Columnas CSV:** `ts, engine, phase, pass, seam, textile, normal_std, roughness_std, errors`

**Calibración pendiente GPU:** rellenar CSV con muro piedra (bueno) vs calle (malo) → ajustar umbrales.

**Loop estable:** 27 ticks reales en 323534 (PID 26892) ✅

### Iteración 46 (27 jun 2026 — tick 4º ciclo: provision + sync VPS)

**`provision_lambda.sh` v2.2:** auto-ejecuta `download_ultrasharp.sh` si falta en NFS.

**Nuevo:** `sync_vps.sh` — sube los 13 archivos `scripts/matforge/` a `/opt/matforge/scripts/matforge/`.

```bash
bash scripts/matforge/sync_vps.sh
```

**Manifiesto stack (13 archivos):**

| Tipo | Archivos |
|------|----------|
| Workflows | `matforge_commercial`, `lotus_normal_retry`, `lotus_depth_retry`, `matforge_upscale_1024` |
| Python | `comfyui_connector`, `batch_pack`, `qa_texture`, `matfuse_generate`, `upscale_cpu` |
| Shell | `provision_lambda`, `deploy_n8n_toolkit`, `download_ultrasharp`, `sync_vps` |
| Config | `n8n_extra_hosts.snippet.yaml` |

**4º ciclo 7 temas completo** (iter. 40–46). **Total loop: 27 ticks reales, iter. 19–46.**

**Siguiente paso único:** OK Max → `sync_vps.sh` + launch A10 + `batch_pack.py --execute --max 1`.

**Loop estable:** 28 ticks reales en 323534 (PID 26892) ✅

### Iteración 47 (27 jun 2026 — tick 5º ciclo: upscale híbrido en batch_pack)

**Integrado iter. 44 en `batch_pack.py`:**
- GPU: `matforge_upscale_albedo_only.json` (solo albedo UltraSharp→1024).
- CPU VPS: `upscale_cpu.py` para normal/height/rough/metal.
- Fix `sys.path` para import `comfyui_connector`.

**Nuevo workflow:** `matforge_upscale_albedo_only.json` — 1 imagen in, `matforge_albedo_1024` out.

**Checklist go-live (OK Max):**

1. `bash scripts/matforge/sync_vps.sh`
2. `lambda_gpu_manager.py launch` + `provision_lambda.sh` en instancia
3. Túnel SSH `18188→8188`
4. `batch_pack.py --dry-run` → revisar plan
5. `batch_pack.py --execute --max 1`
6. `terminate` GPU

**Loop estable:** 29 ticks reales en 323534 (PID 26892) ✅

### Iteración 48 (27 jun 2026 — tick 5º ciclo: run_ab_compare.py)

**Nuevo:** `scripts/matforge/run_ab_compare.py` — un comando A/B sobre el mismo prompt.

```bash
# plan sin GPU
python run_ab_compare.py "medieval stone wall with moss"

# sesión real (OK Max)
python run_ab_compare.py "medieval stone wall with moss" --execute --csv qa_ab_results.csv
```

**Salida:** `ab_sm/` (StableMaterials) vs `ab_matfuse/` (MatFuse+Lotus height); filas en CSV vía `qa_texture --append-csv`.

**Decisión post-A/B:** comparar `pass`, `normal_std`, `textile`, `seconds` en CSV → confirmar SM como prod default.

**Loop estable:** 30 ticks reales en 323534 (PID 26892) ✅

### Iteración 49 (27 jun 2026 — tick 5º ciclo: Lotus wired en batch_pack)

**`batch_pack.py` endurecido:**
- `_find_maps()` prioriza `matforge_normal_lotus*` y `matforge_height_lotus*` sobre mapas SM.
- Retry Lotus solo actualiza `normal` si el archivo existe (no `None`).
- MatFuse: `--lotus-depth` ya alimenta `height` vía mismo helper.

**Flujo Lotus automático:**

```
SM generate → QA1 fail normal_std → --lotus-normal → re-QA1
MatFuse → --lotus-depth (height) → QA1
```

**Coste:** +20–40 s GPU solo en retry (~10% packs estimado, iter. 18).

**Loop estable:** 31 ticks reales en 323534 (PID 26892) ✅

### Iteración 50 (27 jun 2026 — tick 5º ciclo: packager.py + n8n Telegram)

**Nuevo:** `scripts/matforge/packager.py` — ZIP a `/opt/matforge/n8n_data/packs_finales/{name}.zip` + `matforge.json` metadata.

**`batch_pack.py`:** tras QA fase 2 OK → llama `packager.py` → devuelve `zip` en JSON resultado.

**n8n post-pack (modo A):**

```
batch_pack --execute → parse JSON zip path
→ Telegram: "Pack {name} listo: http://158.220.119.17:8080" (Filebrowser)
```

**Filebrowser** ya sirve `packs_finales/` (matforge-vps.md).

**Stack repo: 15 archivos** (añadidos `packager.py`, `run_ab_compare.py`, `matforge_upscale_albedo_only.json` desde iter. 46–48).

**Loop estable:** 32 ticks reales en 323534 (PID 26892) ✅

### Iteración 51 (27 jun 2026 — tick 5º ciclo: upscale map discovery fix)

**Bugfix `batch_pack._find_maps_1024()`:** detecta `matforge_normal_1024.png` (CPU) y `matforge_albedo_1024_00001_.png` (GPU); prioriza Lotus upscaled.

**MatFuse 256→1024:** `upscale_cpu.py` escala 4× en un paso Lanczos (sin GPU en mapas); albedo igual pasa por UltraSharp GPU.

**QA fase 2:** solo corre si `_find_maps_1024` devuelve albedo con `_1024` — evita falso pass a 512².

**Tiers recordatorio:**

| Engine | Base | Upscale |
|--------|------|---------|
| StableMaterials | 512 | albedo GPU + maps CPU → 1024 |
| MatFuse | 256 | albedo GPU 4× + maps CPU 4× → 1024 |

**Loop estable:** 33 ticks reales en 323534 (PID 26892) ✅

### Iteración 52 (27 jun 2026 — tick 5º ciclo: QA umbrales)

**Nuevos archivos:**
- `qa_thresholds.json` — umbrales por fase (hipótesis; targets muro piedra vs calle)
- `calibrate_qa.py` — mide muestras good/bad → sugiere `seam_max`, `textile_min`, `normal_min_std`
- `qa_samples.manifest.example.json` — rutas VPS de referencia 22 jun

**`qa_texture.py`:** `--metrics-only`, `--thresholds-file`; función `measure_metrics()` + `discover_maps_from_dir()`.

**`batch_pack.py`:** pasa `qa_thresholds.json` automáticamente si existe.

**Protocolo calibración GPU (pendiente OK Max):**
```bash
calibrate_qa.py --manifest qa_samples.manifest.json --write
batch_pack.py --dry-run  # verifica umbrales nuevos en plan
```

| Métrica | Buena (hipótesis) | Mala (hipótesis) |
|---------|-------------------|------------------|
| MD5 | 5 únicos | 4 iguales → fail inmediato |
| seam | <15 | >30 (synthetic offset) |
| TexTile fase 2 | >0.75 | <0.65 |
| normal_std | >0.08 | <0.05 → Lotus retry |

**Loop estable:** 34 ticks reales en 323534 (PID 26892) ✅

### Iteración 53 (27 jun 2026 — tick 5º ciclo: provision_lambda v2.3)

**`provision_lambda.sh` v2.3:**
- Sync completo toolkit Python/JSON → `$NFS/matforge_scripts/` (incl. `calibrate_qa.py`, `qa_thresholds.json`, `batch_pack.py`)
- Crea `$NFS/ref/good` y `$NFS/ref/bad` para muestras calibración QA
- Valida JSON de workflows con `python3` antes de arrancar
- Healthcheck ampliado: `MatForger_Sampler`, `ImageFromBatch`, `LotusHeightProcessor`

**Deploy (pendiente OK Max):**
```bash
scp scripts/matforge/provision_lambda.sh ubuntu@<LAMBDA>:/tmp/
ssh ubuntu@<LAMBDA> 'sudo bash /tmp/provision_lambda.sh'
# VPS ref: copiar muro piedra 22 jun → /lambda/nfs/Juegos/ref/good/
```

**Loop estable:** 35 ticks reales en 323534 (PID 26892) ✅ — **fin 5º ciclo completo**

### Iteración 54 (27 jun 2026 — tick 6º ciclo: StableMaterials MatForger)

**`matforge_commercial_workflow.json`:** `cfg` 6→**10** (HF `guidance_scale`).

**Nuevo `matforger_presets.json`:**
| Preset | step | cfg | patched | Uso |
|--------|------|-----|---------|-----|
| `quality` | 50 | 10 | false | default Fab |
| `lcm` | 4 | 2 | true | batch rápido tras `unet_lcm` en Lambda |

**`comfyui_connector.py`:**
- `--matforger-preset quality|lcm`
- sufijo anti-escena en prompt (`PROMPT_SUFFIX`)
- `apply_matforger_preset()` parchea nodo `MatForger_Sampler`

**Salidas workflow (5 mapas):** `ImageFromBatch` sobre output 0 (albedo×2 canales) y output 1 (height/rough/metal).

**Loop estable:** 36 ticks reales en 323534 (PID 26892) ✅

### Iteración 55 (27 jun 2026 — tick 6º ciclo: MatFuse vs StableMaterials)

**Nuevo `engines_compare.json`** — matriz machine-readable (licencia, resolución, mapas, VRAM, runtime).

**`run_ab_compare.py` refactor:**
- Dry-run: plan lado a lado vía `batch_pack.plan_pack()` + meta de `engines_compare.json`
- `--execute`: pipeline completo por motor (`run_pack` → QA1 → Lotus → upscale → QA2 → ZIP)
- `verdict_template` para decidir ganador post-GPU

**`packager.py`:** detecta `specular` como metalness (MatFuse legacy).

**Decisión sin cambio:** default = **StableMaterials**; MatFuse si MIT explícito o palette/sketch en cerebro.csv.

**Comando A/B (pendiente OK Max):**
```bash
python run_ab_compare.py "medieval stone wall with moss" --execute
```

**Loop estable:** 37 ticks reales en 323534 (PID 26892) ✅

### Iteración 56 (27 jun 2026 — tick 6º ciclo: Lotus-2 / v1.1 upgrade)

**Nuevo `lotus_models.json`** — perfiles intercambiables:

| Modo | Perfil default | Modelo Kijai |
|------|----------------|--------------|
| normal retry | `quality` | `lotus-normal-g-v1-1-fp16` (aligned normals) |
| normal fast | `fast` | `lotus-normal-d-v1-0-fp16` |
| depth MatFuse | `default` | `lotus-depth-g-v2-1-disparity-fp16` |
| depth alt | `regression` | `lotus-depth-d-v-1-1-fp16` |

**Workflows:** tokens `__LOTUS_*_MODEL__` en `lotus_*_retry.json`.

**`comfyui_connector`:** `--lotus-variant`, seed aleatorio en `LotusSampler`.

**`provision_lambda.sh`:** descarga modelos v1.1 a NFS.

**Loop estable:** 38 ticks reales en 323534 (PID 26892) ✅

### Iteración 57 (27 jun 2026 — tick 6º ciclo: n8n toolkit)

**Nuevos archivos:**
- `n8n_matforge_blueprint.json` — modo A (batch_pack host) vs modo B (toolkit Docker), URLs, comandos
- `n8n_workflow_modo_a.json` — plantilla importable n8n (dry-run → IF ok)
- `verify_n8n_toolkit.sh` — comprueba toolkit + `extra_hosts` + túnel 18188

**`deploy_n8n_toolkit.sh`:** sin `-it` (CI-friendly), enlaza blueprint + verify.

**Decisión:** **modo A** default hasta A/B GPU; modo B para generación SM pura en nodos ComfyUI.

**VPS pendiente OK Max:**
```bash
bash deploy_n8n_toolkit.sh && bash verify_n8n_toolkit.sh
# Import n8n_workflow_modo_a.json en UI n8n
```

**Loop estable:** 39 ticks reales en 323534 (PID 26892) ✅

### Iteración 58 (27 jun 2026 — tick 6º ciclo: upscale 512→1024 presets)

**Nuevo `upscale_presets.json`** — target 1024 por motor:

| Engine | Base | Albedo | Mapas |
|--------|------|--------|-------|
| StableMaterials | 512 | GPU UltraSharp → Lanczos 1024 | CPU Lanczos 2× |
| MatFuse | 256 | GPU UltraSharp 4× (=1024) | CPU Lanczos 4× |

**`batch_pack._run_upscale()`:** lee preset, parchea `ImageScale` width/height dinámico en workflow albedo.

**`upscale_cpu.py`:** flag `--engine` alinea `--size` con preset.

**Loop estable:** 40 ticks reales en 323534 (PID 26892) ✅

### Iteración 59 (27 jun 2026 — tick 6º ciclo: QA height ramp + CSV batch)

**Nuevo check `height_detail`:** ratio Laplacian/varianza — detecta gradiente bajo frecuencia (bug MiDaS/SM height). Umbral `0.015` en `qa_thresholds.json`.

**Retry automático:** si falla → `lotus_depth` en `batch_pack` (igual que `lotus_normal`).

**CSV:** `batch_pack` appendea cada fase QA a `qa_ab_results.csv` con columna `height_detail_ratio`.

**Loop estable:** 41 ticks reales en 323534 (PID 26892) ✅

### Iteración 60 (27 jun 2026 — tick 6º ciclo: provision_lambda v2.4)

**`provision_lambda.sh` v2.4:**
- `pillow` en venv ComfyUI
- `ENABLE_MATFUSE=1` → cache `gvecchio/MatFuse` en NFS (plan B VPS)
- Post-arranque: `provision_stack_check.sh` (configs JSON + modelos Lotus + nodos ComfyUI)

**Nuevo `provision_stack_check.sh`** — validación reproducible Lambda/VPS.

**Stack repo: 28 archivos** (6º ciclo completo: iter. 54–60).

**Deploy pendiente OK Max:**
```bash
sync_vps.sh && scp provision_lambda.sh ubuntu@<LAMBDA>:/tmp/
sudo ENABLE_MATFUSE=1 bash /tmp/provision_lambda.sh
```

**Loop estable:** 42 ticks reales en 323534 (PID 26892) ✅ — **fin 6º ciclo**

### Iteración 61 (27 jun 2026 — tick 7º ciclo: StableMaterials MatForger)

**Nuevo `verify_matforger_workflow.py`** — valida grafo estático (5 SaveImage, tileable, ImageFromBatch 2+3).

**`batch_pack`:** columna cerebro.csv `preset` → `--matforger-preset quality|lcm`.

**`matforger_presets.json`:** `sm_subfolder: unet_lcm` documentado para preset LCM.

**`provision_lambda`:** `ENABLE_LCM=1` descarga subfolder `unet_lcm` a NFS.

**Loop estable:** 43 ticks reales en 323534 (PID 26892) ✅

### Iteración 62 (27 jun 2026 — tick 7º ciclo: MatFuse vs StableMaterials scoring)

**Nuevos scripts:**
- `pick_engine.py` — elige motor por fila cerebro (`license_requirement`, palette/sketch)
- `summarize_ab_results.py` — resume `qa_ab_results.csv` con score compuesto

**`run_ab_compare.py`:** `--summarize`; tras `--execute` calcula `winner` por score QA2 (textile + seam + normal_std).

**`engines_compare.json`:** reglas `selection_rules` documentadas.

**Loop estable:** 44 ticks reales en 323534 (PID 26892) ✅

### Iteración 63 (27 jun 2026 — tick 7º ciclo: Lotus cascade)

**`batch_pack`:** retries Lotus usan `--lotus-variant` + resolución auto (`--lotus-resolution 0`).

**Depth fallback:** si `height_detail` falla → `default` (g-v2-1) luego `regression` (d-v1-1).

**`comfyui_connector`:** resolución Lotus inferida del tamaño del albedo.

**`lotus_models.json`:** `depth_fallback` + columnas cerebro `lotus_normal` / `lotus_depth`.

**Loop estable:** 45 ticks reales en 323534 (PID 26892) ✅

### Iteración 64 (27 jun 2026 — tick 7º ciclo: n8n toolkit v2)

**Nuevos:**
- `n8n_run_batch.sh` — wrapper host: `dry-run|execute|pick-engine|summarize-ab|verify`
- `n8n_workflow_modo_a_v2.json` — parse JSON + rama execute + summarize A/B
- `n8n_code_inject_prompt.js` — snippet Code node modo B (PROMPT_SUFFIX + seed)

**`n8n_matforge_blueprint.json` v1.1:** columnas cerebro (`preset`, `lotus_*`), helper scripts.

**Loop estable:** 46 ticks reales en 323534 (PID 26892) ✅

### Iteración 65 (27 jun 2026 — tick 7º ciclo: upscale verify + hybrid CLI)

**Nuevos:**
- `verify_upscale_maps.py` — gate pre-QA2: todos los mapas ≥ 1024
- `upscale_hybrid.py` — CLI standalone (`--dry-run` / execute)

**`batch_pack._run_upscale`:** MatFuse 256×4=1024 salta `ImageScale` redundante en albedo.

**`batch_pack`:** `verify_upscale_maps` antes de QA fase 2.

**Loop estable:** 47 ticks reales en 323534 (PID 26892) ✅

### Iteración 66 (27 jun 2026 — tick 7º ciclo: QA calibración sintética)

**Nuevo `qa_synthetic_seam.py`** — albedo con offset 50% → seam alto para calibrar `seam_max`.

**`calibrate_qa.py`:** métrica `height_detail_ratio` + escritura en `qa_thresholds.json`.

**`qa_thresholds.json`:** target height bueno/malo + comando calibración sintética.

**Loop estable:** 48 ticks reales en 323534 (PID 26892) ✅

### Iteración 67 (27 jun 2026 — tick 7º ciclo: provision_lambda v2.5)

**`provision_lambda.sh` v2.5:** sync incluye `.js` (n8n snippets); log cuenta archivos toolkit.

**Nuevo `provision_vps_deps.sh`** — `pip install pillow numpy textile-metric` en host VPS.

**`provision_stack_check.sh`:** valida blueprint n8n + helpers iter. 61–66.

**Stack repo: 38 archivos** — **fin 7º ciclo** (iter. 61–67).

**Deploy pendiente OK Max:**
```bash
./sync_vps.sh && ssh VPS 'bash /opt/matforge/scripts/matforge/provision_vps_deps.sh'
# Lambda: ENABLE_LCM=1 ENABLE_MATFUSE=1 sudo bash provision_lambda.sh
```

**Loop estable:** 49 ticks reales en 323534 (PID 26892) ✅ — **7º ciclo completo**

---

*Documento generado: 25 jun 2026. Fuentes: web search, docs ComfyUI/Ubisoft/Lambda, contexto matforge-vps.md, prueba GPU 22 jun 2026.*
