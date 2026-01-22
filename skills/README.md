# Skills

Skills son flujos de **alto nivel** que combinan múltiples tools y Ralph para resolver problemas complejos.

Cada skill:

- Ejecuta múltiples tools automáticamente
- Enriquece contexto del modelo
- Ralph revisa resultado final
- Es extensible y reutilizable

## Skills disponibles

### analyze-project

Analiza la estructura completa del proyecto (deps, archivos, build status).

**Cuándo usarla:**

- Entender arquitectura nueva
- Auditoría de dependencias
- Verificar estado de compilación

**Ejemplo:** _"Analiza la estructura del proyecto"_

### debug-error

Debuggea errores específicos encontrando ubicación y causa raíz.

**Cuándo usarla:**

- Resolver errores de build
- Problemas de imports/módulos
- Runtime errors

**Ejemplo:** _"Error: Cannot find module 'axios'"_

### resolve-dependencies

Resuelve problemas de dependencias e imports.

**Cuándo usarla:**

- Conflictos de versiones
- Módulos no encontrados
- Limpiar dependencias sin usar

**Ejemplo:** _"Tengo errores de módulos no encontrados"_

## Descubrimiento automático de skills

¿Cómo el agente detecta qué skill ejecutar?

Ver [DISCOVERY.md](./DISCOVERY.md) para:

- Cómo funciona la detección automática
- Palabras clave por skill
- Ejemplos de preguntas que activan skills
- Cómo customizar detección

## Crear tu propia skill

Las skills son completamente extensibles. Aquí está la estructura:

### 1. Crear archivo markdown en `skills/`

```markdown
# Skill: my-skill-name

Descripción breve.

## Descripción
Explicación detallada.

## Ejemplos de uso
Cómo el usuario la invoca.

## Parámetros
Qué argumentos acepta.

## Flujo de ejecución
Qué tools ejecuta en qué orden.

## Casos de uso
Cuándo es útil.

## Salida esperada
Qué devuelve.
```

**Usa [TEMPLATE.md](./TEMPLATE.md) como referencia.**

### 2. Implementar la skill en `src/skills.ts`

```typescript
export async function skill_my_skill_name(
  messages: ChatMessage[],
  question: string,
): Promise<string> {
  const results: string[] = [];

  // 1. Ejecutar tools necesarias
  const result1 = await readFileTool({ path: './config.json' });
  results.push(`[PASO 1]\n${result1}\n`);

  const result2 = await runCommandTool({ command: 'my-command' });
  results.push(`[PASO 2]\n${result2}\n`);

  // 2. Agregar contexto
  const context = results.join('\n');
  const messagesWithContext: ChatMessage[] = [
    ...messages,
    { role: 'tool', name: 'skill_my_skill_name', content: context },
    { role: 'user', content: question },
  ];

  // 3. Ralph revisa
  return await ralphLoop(messagesWithContext, question, context);
}
```

### 3. Registrar en `AVAILABLE_SKILLS`

```typescript
export const AVAILABLE_SKILLS: Record<string, SkillDefinition> = {
  // ... existing ...
  my_skill_name: {
    name: 'my_skill_name',
    description: 'Mi skill personalizada',
    author: 'mi-usuario',
    version: '1.0.0',
    markdown: 'my-skill-name.md', // Nuevo: referencia a la doc
  },
};
```

### 4. '¡Listo!'

El modelo detectará automáticamente tu skill si el usuario pregunta algo relacionado.

## Estructura recomendada para skills complejas

Si tu skill es muy grande, puedes:

```text
skills/
|- mi-skill/
   |- README.md (documentación)
   |- schema.json (parámetros esperados)
   |- examples.md (ejemplos avanzados)
```

## Notas sobre descubribilidad

Las skills son detectadas automáticamente por:

- Nombre en `AVAILABLE_SKILLS`
- Descripción en `SkillDefinition`
- Contenido del archivo markdown

El modelo detecta qué skill necesita basándose en:

- Palabras clave en la pregunta del usuario
- Descripción de la skill
- Contexto de conversación anterior

## Publicar tu skill

Para compartir skills con la comunidad:

1. **Crear repositorio** en GitHub
2. **Documentar** con markdown (como aquí)
3. **Publicar en npm** (opcional)
4. **Compartir enlace** en issues/discussions

Alguien podrá importarla y registrarla en su `AVAILABLE_SKILLS`.

## Versión

- **Última actualización**: 2026-01-22
- **Compatibilidad**: vercel-ollama-agent 1.0
  