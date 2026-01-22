# Index de Skills

Navegación rápida a toda la documentación de skills.

## Documentación principal

| Documento | Propósito |
| --------- | --------- |
| [README.md](./README.md) | Guía completa de skills: qué son, cómo crearlas, ejemplos |
| [DISCOVERY.md](./DISCOVERY.md) | Cómo el agente detecta skills automáticamente |
| [TEMPLATE.md](./TEMPLATE.md) | Template para crear nuevas skills |

## Skills de ejemplo

| Skill | Descripción | Documentación |
| ----- | ----------- | ------------- |
| **analyze-project** | Analiza estructura completa | [Ver](./analyze-project.md) |
| **debug-error** | Debuggea errores específicos | [Ver](./debug-error.md) |
| **resolve-dependencies** | Resuelve problemas de deps | [Ver](./resolve-dependencies.md) |

## Acceso rápido

### Para usuarios

1. Ver qué skills existen: [README.md](./README.md)
2. Entender cómo funcionan: [DISCOVERY.md](./DISCOVERY.md)
3. Documentación específica: Links en la tabla arriba

### Para desarrolladores

1. Crear nueva skill: Usar [TEMPLATE.md](./TEMPLATE.md) como base
2. Entender arquitectura: [README.md - Crear tu propia skill](./README.md#crear-tu-propia-skill)
3. Publicar: [README.md - Publicar tu skill](./README.md#publicar-tu-skill)

## Checklist para crear skill

- [ ] Copiar [TEMPLATE.md](./TEMPLATE.md)
- [ ] Completar documentación markdown
- [ ] Implementar en `src/skills.ts`
- [ ] Registrar en `AVAILABLE_SKILLS`
- [ ] Compilar (`npm run build`)
- [ ] Probar con el agente
- [ ] Compartir o publicar

## Flujo completo

```text
1. Usuario: "analiza proyecto"
   |
2. detectSkill(): Lee descripción de skills
   |
3. Encuentra: "analyze_project"
   |
4. executeSkill('analyze_project')
   |- Lee [analyze-project.md] para contexto
   |- Ejecuta múltiples tools
   |- Ralph revisa resultado
   |
5. Respuesta final enriquecida
```

## Estadísticas

- **Skills disponibles**: 3 (analyze_project, debug_error, resolve_dependencies)
- **Documentos**:
  - 3 Skills con markdown
  - 3 Documentos de soporte (README, DISCOVERY, TEMPLATE)
- **Tamaño total**: Aproximadamente 15KB
- **Extensibilidad**: Completa - Crear más skills es trivial

## Publicación

Skills que publiques en GitHub/npm pueden ser:

- Descubiertas por la comunidad
- Importadas fácilmente
- Reutilizadas en otros proyectos

## Notas

- Cada skill tiene documentación markdown autodescriptiva
- El modelo detecta skills automáticamente
- Ralph valida resultados de skills
- Skills pueden ser públicas o privadas
- Compatible con arquitectura Vercel AI SDK

---

_Última actualización: 2026-01-22_

