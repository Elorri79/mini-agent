# Skill: analyze-project

Analiza la estructura completa de un proyecto Node.js/TypeScript.

## Descripción

Ejecuta un análisis comprehensivo del proyecto combinando:

- Estructura de directorios
- Dependencias (package.json)
- Archivos fuente TypeScript/JavaScript
- Status de compilación

Ideal para entender rápidamente arquitectura, dependencias y problemas de build.

## Ejemplos de uso

```text
> Analiza la estructura del proyecto
> ¿Cuál es la arquitectura de este proyecto?
> Explícame qué dependencias tiene
> ¿Compila correctamente?
```

## Parámetros

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ---- | --------- | ----------- |
| `question` | string | Sí | Pregunta sobre el proyecto |

## Flujo de ejecución

1. **Estructura** - `list_dir('.')` lista directorios y archivos raíz
2. **Dependencias** - `read_file('package.json')` obtiene todas las deps
3. **Fuentes** - `search_in_file('src', '\\.(ts|js)$')` encuentra archivos fuente
4. **Build** - `run_command('npm run build')` compila y reporta errores
5. **Ralph** - Revisa que la respuesta sea correcta y útil

## Casos de uso

- Auditoría de nuevos proyectos
- Entender arquitectura desconocida
- Detectar problemas de build
- Reportar estado del proyecto

## Salida esperada

- Listado de directorios/archivos
- Dependencias encontradas
- Archivos fuente detectados
- Errores de compilación (si los hay)
- Respuesta contextualizada del modelo

## Notas

- Si `npm run build` no existe, continúa de todas formas
- Ralph marca REINTENTAR si falta información importante
- Máximo 7 iteraciones de mejora

## Versión

- **Autor**: vercel-ollama-agent
- **Versión**: 1.0.0
- **Última actualización**: 2026-01-22
