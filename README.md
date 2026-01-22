# mini-agent

Agente de línea de comandos para desarrollo de software que:

- Usa un **modelo local** servido vía API OpenAI‑compatible (por ejemplo, Ollama).
- Orquesta el modelo con **lógica propia de agente** (tools + revisión).
- Implementa una **tool `read_file`** para leer archivos del sistema.
- Tiene un modo de auto‑revisión tipo **"Ralph Wiggum"** que comprueba y refina respuestas.

Este proyecto sirve como base para seguir experimentando con agentes locales y skills estilo Vercel.

---

## 1. Objetivo del proyecto

Construir un **agente CLI** que:

1. Use un modelo local (p.ej. `deepseek-coder:6.7b` en Ollama).
2. Soporte **tool calls** mediante un protocolo JSON sencillo.
3. Tenga una primera tool real:
   - `read_file` → lee archivos del sistema y los pasa al modelo.
4. Añada una capa de **auto‑revisión**:
   - El modelo propone una respuesta.
   - Un "revisor" (otro llamado al modelo) decide si es `OK` o `REINTENTAR`.
   - Se itera hasta un máximo de N veces.
5. En casos delicados (como extraer dependencias de `package.json`), el **agente decide por sí mismo** sin delegar esa tarea al modelo.

---

## 2. Tecnologías utilizadas

- **Node.js** (CLI, orquestación y tools).
- **TypeScript** (tipado y compilación a JS).
- **Modelo local vía API OpenAI‑compatible** (en nuestro caso, un modelo pequeño de Ollama).
- **Fish shell** (no es requisito, solo el entorno en el que se ha probado).

---

## 3. Paquetes y dependencias

### Dependencias (`dependencies`)

Sin dependencias externas innecesarias. El proyecto usa solo las APIs nativas de Node.js.

### Dependencias de desarrollo (`devDependencies`)

- `typescript`: compilador TS → JS.
- `@types/node`: tipos de Node.js para TypeScript.

`package.json` actual:

```json
{
  "name": "vercel-ollama-agent",
  "version": "1.0.0",
  "description": "CLI agente con Vercel AI SDK + Ollama",
  "type": "module",
  "main": "dist/agent.js",
  "bin": {
    "vo-agent": "dist/agent.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/agent.js"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^22.10.7",
    "typescript": "^5.7.2"
  }
}
```

---

## 4. Estructura del proyecto

```bash
src/
├── agent.ts       Bucle REPL principal y orquestación
├── config.ts      Configuración centralizada
├── tools.ts       Definición e implementación de tools (bajo nivel)
├── skills.ts      Definición e implementación de skills (alto nivel)
└── reviewer.ts    Lógica de revisión tipo "Ralph Wiggum"

skills/           📚 Documentación y specs de skills
├── README.md          Guía para crear/usar skills
├── DISCOVERY.md       Cómo el agente detecta skills automáticamente
├── TEMPLATE.md        Template para crear skills nuevas
├── analyze-project.md
├── debug-error.md
└── resolve-dependencies.md

dist/
└── *.js           Código compilado (no editar)

tsconfig.json      Configuración de TypeScript
package.json       Metadatos y dependencias
README.md          Este archivo
```

### Descripción de módulos

- **[config.ts](src/config.ts)**  
  Configuración centralizada: URL de API, modelo, límites, prompts del sistema.

- **[tools.ts](src/tools.ts)** (Bajo nivel)
  - `readFileTool()` → Lee contenido de un archivo.
  - `listDirTool()` → Lista archivos en un directorio.
  - `searchInFileTool()` → Busca patrones en un archivo.
  - `runCommandTool()` → Ejecuta comandos y resume salida.
  - `extractPackageJsonDeps()` → Extrae dependencias sin usar el modelo.
  - `parseToolCall()` → Parsea tool-calls JSON desde respuestas del modelo.

- **[skills.ts](src/skills.ts)** (Alto nivel - Combinan múltiples tools)
  - `skill_analyze_project()` → Analiza estructura, dependencias, archivos, build status.
  - `skill_debug_error()` → Busca ubicación del error, contexto, intenta reproducir.
  - `skill_resolve_dependencies()` → Resuelve problemas de dependencias e imports.
  - `executeSkill()` → Router para ejecutar skills por nombre.
  - `AVAILABLE_SKILLS` → Registro extensible de skills con metadata y referencias markdown.

- **[reviewer.ts](src/reviewer.ts)**  
  - `reviewAnswer()` → Valida si una respuesta es correcta usando el modelo como revisor.
  - `ralphLoop()` → Bucle de reintentos con revisión automática.

- **[agent.ts](src/agent.ts)**  
  - `callModel()` → Llamada base al API OpenAI-compatible.
  - `detectSkill()` → Detecta automáticamente si pregunta necesita una skill.
  - `main()` → Bucle REPL interactivo.
  - `handleReadFileTool()`, `handleListDirTool()`, `handleSearchInFileTool()`, `handleRunCommandTool()` → Orquestación de tools con revisión Ralph.

---

## 5. Mejoras implementadas

### Optimizaciones para modelos pequeños (6.7B-13B)

- ✅ **Temperature 0.3** → Mayor consistencia en respuestas.
- ✅ **MAX_REVIEW_LOOPS: 7** → Más iteraciones para mejorar respuestas.
- ✅ **MAX_CONTEXT_TOKENS: 2000** → Controlar tamaño de contexto.
- ✅ **Prompts concisos** → Lenguaje directo, sin verbosidad innecesaria.

### Nuevas tools para evitar alucinaciones

- ✅ **`list_dir`** → Listar archivos sin que el modelo los invente.
- ✅ **`search_in_file`** → Buscar patrones específicos (regex).
- ✅ **`run_command`** → Ejecutar comandos y obtener salida real.

### Eliminación de dependencias innecesarias

- ✅ Removidas `ai` y `zod` que no se usaban.
- ✅ El proyecto usa solo APIs nativas de Node.js.
- ✅ Ahorra ~100KB en `node_modules`.

### Separación en módulos

- ✅ **config.ts**: Configuración centralizada (fácil de modificar).
- ✅ **tools.ts**: Lógica de herramientas (reutilizable).
- ✅ **reviewer.ts**: Revisión tipo Ralph (independiente).
- ✅ **agent.ts**: Orquestación limpia (~160 líneas vs 363).

### Mejoras de manejo de errores

- ✅ Timeouts en peticiones HTTP.
- ✅ Validación más robusta de rutas.
- ✅ Mejor feedback ante errores.

### Mejor UX

- ✅ Prompts del sistema más concisos.
- ✅ Separación clara entre salidas (labels `[read_file]`, `[ERROR]`).
- ✅ Reutilización consistente de funciones.

---

## 6. Cómo usar

### Instalación

```bash
npm install
npm run build
```

### Ejecutar

```bash
npm start
# o
node dist/agent.js
```

### Ejemplos de comandos

```bash
¿Qué versión de TypeScript usamos?
Lee el archivo tsconfig.json
Qué dependencias tiene package.json
Explícame cómo funcionan las herramientas
```

---

## 7. Variables de entorno

```bash
# URL base del API OpenAI-compatible (default: http://localhost:11434/v1)
OLLAMA_API_BASE=http://localhost:11434/v1

# Nombre del modelo a usar (default: deepseek-coder:6.7b)
OLLAMA_MODEL=deepseek-coder:6.7b
```

---

## 8. Arquitectura del flujo

```text
Usuario escribe pregunta
  ↓
[agent.ts] detectSkill() - ¿Necesita análisis complejo?
  ├─ Sí: executeSkill()
  │  ├─ Ejecuta múltiples tools automáticamente
  │  ├─ Agrega contexto enriquecido
  │  └─ Ralph revisa resultado final
  │
  └─ No: callModel()
     ↓
     ¿Devuelve tool-call?
     ├─ Sí → handleTool() + Ralph
     └─ No → Ralph sobre respuesta directa
     ↓
     Mostrar respuesta final al usuario
```

---

## 8b. Flujo de Skills (Detalle)

Skills combinan múltiples tools y Ralph para análisis profundos:

```text
skill_analyze_project
├─ list_dir('.')           → Estructura del proyecto
├─ read_file('package.json') → Dependencias
├─ search_in_file('src')     → Archivos fuente
└─ run_command('npm run build') → Status de build
   ↓
   [Agregar todo al contexto del modelo]
   ↓
   Ralph: ¿Respuesta correcta?

skill_debug_error
├─ search_in_file(pattern)    → ¿Dónde ocurre?
├─ read_file(matched files)    → Contexto
└─ run_command('npm test')     → Reproducir error
   ↓
   Ralph: ¿Sugerencia útil?

skill_resolve_dependencies
├─ read_file('package.json')    → Dependencias declaradas
├─ run_command('npm list')      → Estado actual
├─ search_in_file('src', imports) → Imports usados
└─ run_command('npm run build')  → Errores de build
   ↓
   Ralph: ¿Solución correcta?
```

---

## 9. Notas sobre la revisión (Ralph Loop)

- El revisor usa el mismo modelo para verificar si una respuesta es correcta.
- Es **estricto**: marca `REINTENTAR` si falta información o se sale del tema.
- Máximo 7 iteraciones (configurable en `config.ts`).
- Hace un extra call al modelo por cada revisión.

---

## 9b. Documentación de Skills en Markdown

Cada skill tiene un archivo markdown correspondiente en [skills/](./skills/):

### Formato estándar

Cada `.md` incluye:

- ✅ **Descripción** - Qué hace la skill
- ✅ **Ejemplos** - Cómo el usuario la invoca
- ✅ **Parámetros** - Qué argumentos acepta
- ✅ **Flujo** - Qué tools ejecuta en qué orden
- ✅ **Casos de uso** - Cuándo es útil
- ✅ **Salida** - Qué devuelve
- ✅ **Metadata** - Autor, versión, última actualización

**Ejemplo:** Ver [skills/analyze-project.md](./skills/analyze-project.md)

### Ventajas

- 📚 **Autodocumentadas** - Cada skill explica su propósito
- 🔍 **Descubribles** - Usuarios ven todas las skills disponibles
- 🚀 **Extensibles** - Modelo puede leer docs para mejorar detección automática
- 📦 **Portables** - Skills con documentación lista para publicar en npm/GitHub

### Crear skills nuevas

1. **Crear `.md`** en `skills/` con documentación
2. **Implementar en `src/skills.ts`**
3. **Registrar en `AVAILABLE_SKILLS`** con referencia a markdown
4. **Listo** - Modelo las detectará automáticamente

Ver [skills/README.md](./skills/README.md) para guía completa.

---

## 10. Próximos pasos sugeridos

**Corto plazo:**

- Añadir flags CLI:
  - `--model <nombre_modelo>` para elegir modelo.
  - `--no-ralph` para un modo rápido sin revisión.
  - `--skill <nombre>` para ejecutar skill específico.
- Crear sistema de carga de skills dinámicas (desde archivos externos).

**Mediano plazo:**

- Publicar skills en un repositorio público (npm registry o GitHub).
- Sistema de verificación/firma de skills (seguridad).
- Caching de resultados de skills para performance.

**Largo plazo:**

- Marketplace de skills (descubrir, evaluar, instalar).
- Composición automática de skills (encadenar varias).
- Persistencia de historial (guardar sesiones).

---

## 11. Licencia

Proyecto experimental para aprendizaje y exploración de agentes locales con Ollama.
