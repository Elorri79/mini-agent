/**
 * Configuración centralizada del agente
 */
export const CONFIG = {
    // Conexión a Ollama
    API_BASE: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1',
    MODEL_NAME: process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b',
    // Límites
    MAX_FILE_SIZE: 8000,
    MAX_CONTEXT_TOKENS: 2000,
    MAX_REVIEW_LOOPS: 7,
    REQUEST_TIMEOUT: 30000,
    TEMPERATURE: 0.3, // Baja para consistencia en modelos pequeños
    // Mensajes del sistema (optimizado para modelos pequeños)
    SYSTEM_PROMPT: `Eres un asistente técnico. Responde en español, claro y conciso. Sin emojis.

HERRAMIENTAS disponibles:
- "read_file": lee contenido de un archivo
- "list_dir": lista archivos de un directorio
- "search_in_file": busca patrones en un archivo
- "run_command": ejecuta un comando y resume salida

Solo usa herramientas si el usuario lo pide. Para preguntas conceptuales, responde directamente.

CUANDO USES UNA HERRAMIENTA, responde SOLO con JSON:
{ "tool": "nombre", "args": {...} }

Si NO necesitas herramienta, responde en texto normal.`,
    REVIEWER_PROMPT: `Revisor estricto. ¿Es correcta y útil la respuesta?
Si falta info, inventa algo o se sale del tema → REINTENTAR.

Responde SOLO con JSON:
{ "verdict": "OK" | "REINTENTAR", "feedback": "breve" }`,
    // Prompt para detectar cuándo usar skills
    SKILL_DETECTOR_PROMPT: `Analiza la pregunta del usuario. ¿Necesita una skill (análisis complejo) o una tool simple?

Si la pregunta requiere:
- Analizar todo el proyecto → skill: analyze_project
- Debuggear un error → skill: debug_error
- Resolver dependencias → skill: resolve_dependencies
- Otra cosa → responde: NONE

Responde SOLO con: "skill_name" o "NONE"`,
};
//# sourceMappingURL=config.js.map