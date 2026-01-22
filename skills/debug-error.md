# Skill: debug-error

Debuggea errores encontrando ubicación, contexto y causas raíz.

## Descripción

Ejecuta un análisis automático de errores:

- Busca dónde ocurre el error en el código
- Lee archivos relacionados para contexto
- Intenta reproducir el error (tests, build)
- Sugiere soluciones basadas en contexto

Perfecto para modelos pequeños que necesitan datos concretos para sugerir fixes.

## Ejemplos de uso

```text
> Error: Cannot find module 'axios'
> Module not found: Can't resolve 'config.js'
> TypeError: undefined is not a function
> Debuggea este error: ReferenceError: x is not defined
```

## Parámetros

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ---- | --------- | ----------- |
| `error` | string | Sí | Mensaje de error completo |
| `question` | string | No | Pregunta adicional sobre el error |

## Flujo de ejecución

1. **Ubicación** - `search_in_file('src', pattern)` busca dónde ocurre
2. **Contexto** - `read_file(matching files)` obtiene código relacionado
3. **Reproducción** - `run_command('npm test')` o `npm run build` intenta reproducir
4. **Ralph** - Revisa que la solución sea lógica y aplicable

## Casos de uso

- Resolver errores de build
- Problemas de módulos faltantes
- Errores de importación/require
- Runtime errors
- Test failures

## Salida esperada

- Ubicación del error (línea y archivo)
- Código relacionado para contexto
- Salida de tests/build que reproduce
- Sugerencias de solución del modelo

## Notas

- Si no encuentra el error, continúa de todas formas
- Busca los primeros 50 caracteres del error
- Ralph es estricto: solución debe ser práctica
- Máximo 7 iteraciones

## Versión

- **Autor**: vercel-ollama-agent
- **Versión**: 1.0.0
- **Última actualización**: 2026-01-22

