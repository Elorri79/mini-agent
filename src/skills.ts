/**
 * Skills: Flujos de alto nivel que combinan múltiples tools
 * Pueden ser publicados por Vercel, usuarios o comunidad
 */

import { readFileTool, listDirTool, searchInFileTool, runCommandTool } from './tools.js';
import { ralphLoop } from './reviewer.js';
import type { ChatMessage } from './config.js';

export interface SkillDefinition {
    name: string;
    description: string;
    author?: string;
    version?: string;
    markdown?: string;  // Ruta al archivo markdown de documentación
}

export interface SkillCall {
    skill: string;
    args: Record<string, unknown>;
}

/**
 * Skill: Analizar estructura del proyecto
 * Combina: list_dir + read_file + search_in_file + run_command
 */
export async function skill_analyze_project(
    messages: ChatMessage[],
    question: string,
): Promise<string> {
    const results: string[] = [];

    // 1. Estructura de directorios
    const dirContent = await listDirTool({ path: '.' });
    results.push(`[PASO 1 - Estructura]\n${dirContent}\n`);

    // 2. Leer package.json
    const pkgContent = await readFileTool({ path: './package.json' });
    results.push(`[PASO 2 - Dependencias]\n${pkgContent}\n`);

    // 3. Buscar archivos TypeScript principales
    const tsFiles = await searchInFileTool({ path: './src', pattern: '\\.(ts|js)$' });
    results.push(`[PASO 3 - Archivos fuente]\n${tsFiles}\n`);

    // 4. Intentar ejecutar build (sin fallar si no existe)
    try {
        const buildOutput = await runCommandTool({ command: 'npm run build 2>&1 | head -20' });
        results.push(`[PASO 4 - Build status]\n${buildOutput}\n`);
    } catch {
        results.push(`[PASO 4 - Build status]\nNo se pudo ejecutar build\n`);
    }

    const context = results.join('\n');

    // Agregar contexto a mensajes
    const messagesWithContext: ChatMessage[] = [
        ...messages,
        {
            role: 'tool',
            name: 'skill_analyze_project',
            content: context,
        },
        {
            role: 'user',
            content: `Basándote en el análisis del proyecto anterior, responde: ${question}`,
        },
    ];

    // Ralph revisa la respuesta
    return await ralphLoop(messagesWithContext, question, context);
}

/**
 * Skill: Debuggear un error
 * Combina: search_in_file + read_file + run_command
 */
export async function skill_debug_error(
    messages: ChatMessage[],
    errorMessage: string,
    question?: string,
): Promise<string> {
    const results: string[] = [];
    const searchTerm = errorMessage.split('\n')[0].slice(0, 50); // Primeros 50 chars del error

    // 1. Buscar donde ocurre el error
    const fileMatches = await searchInFileTool({ path: './src', pattern: searchTerm });
    results.push(`[PASO 1 - Ubicación del error]\n${fileMatches}\n`);

    // 2. Leer los archivos relacionados
    try {
        const srcFiles = await listDirTool({ path: './src' });
        results.push(`[PASO 2 - Archivos fuente]\n${srcFiles}\n`);
    } catch {
        results.push(`[PASO 2 - Archivos fuente]\nNo accesible\n`);
    }

    // 3. Intentar ejecutar tests o build para reproducir
    try {
        const testOutput = await runCommandTool({ command: 'npm test 2>&1 | head -20' });
        results.push(`[PASO 3 - Tests]\n${testOutput}\n`);
    } catch {
        try {
            const buildOutput = await runCommandTool({ command: 'npm run build 2>&1 | head -20' });
            results.push(`[PASO 3 - Build]\n${buildOutput}\n`);
        } catch {
            results.push(`[PASO 3 - Tests/Build]\nNo disponibles\n`);
        }
    }

    const context = results.join('\n');

    const messagesWithContext: ChatMessage[] = [
        ...messages,
        {
            role: 'tool',
            name: 'skill_debug_error',
            content: context,
        },
        {
            role: 'user',
            content:
                `El error reportado es:\n${errorMessage}\n\n` +
                `Basándote en el análisis anterior, ` +
                (question ? `responde: ${question}` : `sugiere una solución`),
        },
    ];

    return await ralphLoop(messagesWithContext, question || errorMessage, context);
}

/**
 * Skill: Resolver problemas de dependencias
 * Combina: read_file + run_command + search_in_file
 */
export async function skill_resolve_dependencies(
    messages: ChatMessage[],
    question: string,
): Promise<string> {
    const results: string[] = [];

    // 1. Leer package.json
    const pkgContent = await readFileTool({ path: './package.json' });
    results.push(`[PASO 1 - package.json]\n${pkgContent}\n`);

    // 2. Ejecutar npm list
    try {
        const npmList = await runCommandTool({ command: 'npm list --depth=0 2>&1' });
        results.push(`[PASO 2 - npm list]\n${npmList}\n`);
    } catch {
        results.push(`[PASO 2 - npm list]\nNo disponible\n`);
    }

    // 3. Buscar imports sin resolver
    try {
        const imports = await searchInFileTool({ path: './src', pattern: "^import|^require" });
        results.push(`[PASO 3 - Imports]\n${imports}\n`);
    } catch {
        results.push(`[PASO 3 - Imports]\nNo encontrados\n`);
    }

    // 4. Intentar build para detectar missing deps
    try {
        const buildOutput = await runCommandTool({ command: 'npm run build 2>&1 | head -30' });
        results.push(`[PASO 4 - Build errors]\n${buildOutput}\n`);
    } catch {
        results.push(`[PASO 4 - Build errors]\nNo disponible\n`);
    }

    const context = results.join('\n');

    const messagesWithContext: ChatMessage[] = [
        ...messages,
        {
            role: 'tool',
            name: 'skill_resolve_dependencies',
            content: context,
        },
        {
            role: 'user',
            content: `Basándote en el análisis de dependencias anterior, responde: ${question}`,
        },
    ];

    return await ralphLoop(messagesWithContext, question, context);
}

/**
 * Registro de skills disponibles
 * Los usuarios pueden añadir más skills aquí
 */
export const AVAILABLE_SKILLS: Record<string, SkillDefinition> = {
    analyze_project: {
        name: 'analyze_project',
        description: 'Analiza la estructura completa del proyecto',
        author: 'vercel-ollama-agent',
        version: '1.0.0',
        markdown: 'skills/analyze-project.md',
    },
    debug_error: {
        name: 'debug_error',
        description: 'Debuggea un error específico buscando ubicación y contexto',
        author: 'vercel-ollama-agent',
        version: '1.0.0',
        markdown: 'skills/debug-error.md',
    },
    resolve_dependencies: {
        name: 'resolve_dependencies',
        description: 'Resuelve problemas de dependencias y imports',
        author: 'vercel-ollama-agent',
        version: '1.0.0',
        markdown: 'skills/resolve-dependencies.md',
    },
};

/**
 * Ejecutar un skill por nombre
 */
export async function executeSkill(
    skillName: string,
    messages: ChatMessage[],
    args: Record<string, unknown>,
): Promise<string> {
    const question = (args.question as string) || 'Analiza esto';
    const errorMessage = (args.error as string) || '';

    switch (skillName) {
        case 'analyze_project':
            return await skill_analyze_project(messages, question);
        case 'debug_error':
            return await skill_debug_error(messages, errorMessage, question);
        case 'resolve_dependencies':
            return await skill_resolve_dependencies(messages, question);
        default:
            throw new Error(`Skill desconocido: ${skillName}`);
    }
}
