# Skill: template-skill

_Descripción breve de qué hace esta skill._

## Descripción

Descripción detallada de la skill. Explica:

- Qué problema resuelve
- Cómo lo resuelve
- Cuándo es útil

**Ejemplo:**

> Esta skill ejecuta un análisis profundo del proyecto combinando múltiples tools para proporcionar insights que un modelo pequeño no podría obtener leyendo un archivo.

## Ejemplos de uso

Cómo el usuario invoca esta skill:

```text
> Analiza [algo]
> ¿Cómo está [estructura]?
> Encuentra el problema en [código]
```

## Parámetros

| Parámetro | Tipo | Requerido | Descripción |
| --------- | ---- | --------- | ----------- |
| `question` | string | Sí | Pregunta del usuario |
| `opcional` | string | No | Parámetro opcional |

## Flujo de ejecución

Qué tools ejecuta en qué orden:

```text
1. [Tool 1] - Lee/lista/busca información
2. [Tool 2] - Procesa/transforma datos
3. [Tool 3] - Ejecuta/valida
4. Ralph - Revisa respuesta final
```

**Ejemplo concreto:**

```text
1. list_dir('src') - Lista archivos
2. search_in_file('src', pattern) - Busca patrón
3. read_file(matched) - Lee contexto
4. Ralph - ¿Respuesta correcta?
```

## Casos de uso

**Cuándo usar esta skill:**

- Caso 1
- Caso 2
- Caso 3

**NO usar cuando:**

- Caso que no aplica
- Otro caso

## Salida esperada

Qué tipo de respuesta devuelve:

- Información extraída
- Análisis realizado
- Problemas identificados
- Sugerencias/soluciones

## Notas técnicas

- Comportamiento en edge cases
- Limitaciones (timeouts, tamaños máximos)
- Configuración requerida
- Ralph iterations (máx 7)

## Extensión

Cómo extender o customizar esta skill:

```typescript
// Si necesitas parámetros adicionales:
export async function skill_template_skill(
  messages: ChatMessage[],
  question: string,
  customParam?: string, // Nuevo parámetro
): Promise<string> {
  // Tu implementación
}
```

## Versión

- **Autor**: tu-usuario
- **Versión**: 1.0.0
- **Última actualización**: YYYY-MM-DD
- **Compatibilidad**: vercel-ollama-agent 1.0+

## Relacionadas

- [skill-a](./skill-a.md) - Problema similar
- [skill-b](./skill-b.md) - Complementaria

