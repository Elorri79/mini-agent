# Descubrimiento de Skills

Cómo el agente detecta y usa skills automáticamente.

## Cómo funciona la detección

```text
1. Usuario pregunta algo
   |
2. detectSkill() pregunta al modelo: "¿Qué skill necesita?"
   |
3. Modelo lee descripciones y markdowns de skills
   |
4. Modelo devuelve nombre de skill (ej: "analyze_project")
   |
5. executeSkill() ejecuta la skill automáticamente
   |
6. Respuesta final con contexto enriquecido
```

## Palabras clave por skill

El modelo usa estas palabras clave para detectar skills:

### analyze_project

- "analiza", "estructura", "arquitectura"
- "dependencias", "package.json"
- "archivos", "proyecto completo"
- "cómo está hecho", "explicar proyecto"

### debug_error

- "error", "falla", "bug"
- "no funciona", "crash", "exception"
- "por qué falla", "encontrar problema"

### resolve_dependencies

- "dependencias", "módulo no encontrado"
- "imports", "require", "missing"
- "package.json", "versión incompatible"
- "npm", "resolver"

## Ejemplos de preguntas que activan skills

```text
[ANALYZE_PROJECT] "¿Cuál es la estructura del proyecto?"
[ANALYZE_PROJECT] "Analiza el proyecto"
[ANALYZE_PROJECT] "¿Qué dependencias tiene?"
[ANALYZE_PROJECT] "Explícame la arquitectura"

[DEBUG_ERROR] "Error: Cannot find module 'express'"
[DEBUG_ERROR] "TypeError: undefined is not a function"
[DEBUG_ERROR] "ReferenceError: x is not defined"
[DEBUG_ERROR] "¿Por qué falla el build?"

[RESOLVE_DEPENDENCIES] "Tengo conflictos de dependencias"
[RESOLVE_DEPENDENCIES] "Module not found: /src/utils"
[RESOLVE_DEPENDENCIES] "¿Qué dependencias faltan?"
```

## Preguntas que NO activan skills

```text
[NONE] "¿Qué versión de TypeScript?"
[NONE] "¿Cómo se usa npm?"
[NONE] "Explícame callbacks en JavaScript"
[NONE] "¿Qué es un closure?"
```

## Mejorar detección

Para que tu skill sea detectada mejor:

1. **Nombre descriptivo**: `skill_analyze_performance` en lugar de `skill_a`
2. **Descripción clara**: Usar palabras clave de tu dominio
3. **Documentación markdown**: Incluir ejemplos y casos de uso
4. **Parámetros explícitos**: Dejar claro qué necesita

## Customizar detección

Si quieres controlar mejor la detección, puedes:

### Opción 1: Editar SKILL_DETECTOR_PROMPT en config.ts

```typescript
SKILL_DETECTOR_PROMPT: `Analiza la pregunta. ¿Qué skill necesita?
Si menciona estructura/arquitectura/dependencias -> "analyze_project"
Si menciona error/falla/bug -> "debug_error"
Si menciona módulos/versiones -> "resolve_dependencies"
Si nada aplica -> "NONE"

Responde SOLO: "skill_name" o "NONE"`
```

### Opción 2: Pre-registrar mappings

```typescript
const SKILL_KEYWORDS: Record<string, string[]> = {
  analyze_project: ['estructura', 'arquitectura', 'dependencias', 'proyecto'],
  debug_error: ['error', 'falla', 'crash', 'bug'],
  resolve_dependencies: ['módulo', 'import', 'versión'],
};
```

## Versión

- **Última actualización**: 2026-01-22

