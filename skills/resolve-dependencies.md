# Skill: resolve-dependencies

Resuelve problemas de dependencias e imports automáticamente.

## Descripción

Analiza el estado de dependencias:

- Lee package.json para ver dependencias declaradas
- Ejecuta `npm list` para estado actual
- Busca imports en código fuente
- Intenta compilar para detectar issues
- Sugiere soluciones

Usa análisis determinístico + modelo para diagnóstico preciso.

## Ejemplos de uso

```text
> Resuelve problemas de dependencias
> Tengo errores de módulos no encontrados
> Necesito revisar qué dependencias faltan
> npm list mostraba warnings, ¿qué hago?
```

## Parámetros

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ---- | --------- | ----------- |
| `question` | string | Sí | Pregunta sobre dependencias |

## Flujo de ejecución

1. **Declaradas** - `read_file('package.json')` obtiene deps oficiales
2. **Estado actual** - `run_command('npm list')` detecta problemas
3. **Imports usados** - `search_in_file('src', imports pattern)` encuentra qué se importa
4. **Errores** - `run_command('npm run build')` detecta missing modules
5. **Ralph** - Revisa que solución sea correcta

## Casos de uso

- Dependencias duplicadas o conflictivas
- Módulos no encontrados
- Versiones incompatibles
- Dependencias sin usar
- Fixes automáticos (npm install/update)

## Salida esperada

- Dependencias declaradas en package.json
- Estado actual de npm list
- Imports encontrados en código
- Errores de build relacionados
- Recomendaciones del modelo

## Notas

- Diferencia entre dependencies y devDependencies
- Ralph marca REINTENTAR si solución no es práctica
- Máximo 7 iteraciones
- Considera versiones semánticas

## Versión

- **Autor**: vercel-ollama-agent
- **Versión**: 1.0.0
- **Última actualización**: 2026-01-22

