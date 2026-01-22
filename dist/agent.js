#!/usr/bin/env node
import readline from 'node:readline';
import path from 'node:path';
import { CONFIG } from './config.js';
import { readFileTool, extractPackageJsonDeps, parseToolCall, listDirTool, searchInFileTool, runCommandTool, } from './tools.js';
import { ralphLoop } from './reviewer.js';
import { executeSkill, AVAILABLE_SKILLS } from './skills.js';
let lastUserQuestion = null;
/**
 * Detectar si una pregunta necesita una skill
 */
async function detectSkill(question) {
    const messages = [
        {
            role: 'system',
            content: CONFIG.SKILL_DETECTOR_PROMPT,
        },
        {
            role: 'user',
            content: question,
        },
    ];
    try {
        const response = await callModel(messages);
        const skillName = response.trim().toLowerCase();
        // Verificar que sea una skill válida
        if (skillName !== 'none' && AVAILABLE_SKILLS[skillName]) {
            return skillName;
        }
    }
    catch {
        // Si falla detección, continuar normalmente
    }
    return null;
}
async function callModel(messages) {
    const res = await fetch(`${CONFIG.API_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: CONFIG.MODEL_NAME,
            messages,
            temperature: CONFIG.TEMPERATURE,
        }),
        signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const data = (await res.json());
    const reply = data.choices?.[0]?.message?.content ??
        data.choices?.[0]?.message?.delta?.content ??
        '';
    if (!reply) {
        throw new Error('Respuesta vacía del modelo');
    }
    return reply;
}
// ---- Bucle principal con soporte de tools + Ralph -------------------------
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log('Agente Vercel+Ollama (escribe "exit" para salir)\n');
    const messages = [
        {
            role: 'system',
            content: CONFIG.SYSTEM_PROMPT,
        },
    ];
    const ask = () => {
        rl.question('> ', async (input) => {
            if (input.trim().toLowerCase() === 'exit') {
                rl.close();
                return;
            }
            lastUserQuestion = input;
            messages.push({ role: 'user', content: input });
            try {
                // Primero: ¿Detectar si necesita una skill?
                const detectedSkill = await detectSkill(input);
                if (detectedSkill) {
                    console.log(`\n[SKILL DETECTADO: ${detectedSkill}]\n`);
                    const skillResult = await executeSkill(detectedSkill, messages, {
                        question: input,
                    });
                    console.log('\n' + skillResult + '\n');
                    messages.push({ role: 'assistant', content: skillResult });
                }
                else {
                    // Si no es skill, proceder con tools normales
                    const firstReply = await callModel(messages);
                    // ¿Ha devuelto una tool-call?
                    const toolCall = parseToolCall(firstReply);
                    if (toolCall) {
                        // Enrutar a la herramienta correcta
                        switch (toolCall.tool) {
                            case 'read_file':
                                await handleReadFileTool(toolCall, messages);
                                break;
                            case 'list_dir':
                                await handleListDirTool(toolCall, messages);
                                break;
                            case 'search_in_file':
                                await handleSearchInFileTool(toolCall, messages);
                                break;
                            case 'run_command':
                                await handleRunCommandTool(toolCall, messages);
                                break;
                            default:
                                console.log(`\n[ERROR]\nHerramienta desconocida: "${toolCall.tool}"\n`);
                                const refined = await ralphLoop(messages, lastUserQuestion ?? '', `Herramienta desconocida: ${toolCall.tool}`);
                                console.log('\n' + refined + '\n');
                                messages.push({ role: 'assistant', content: refined });
                        }
                    }
                    else {
                        // --------- Flujo sin tool: Ralph sobre la respuesta directa ---------
                        const refined = await ralphLoop([...messages], lastUserQuestion ?? '', undefined);
                        console.log('\n' + refined + '\n');
                        messages.push({ role: 'assistant', content: refined });
                    }
                }
            }
            catch (err) {
                console.error('Error llamando al modelo:', err?.message ?? err);
            }
            ask();
        });
    };
    ask();
}
async function handleReadFileTool(toolCall, messages) {
    let filePath = (toolCall.args &&
        typeof toolCall.args.path === 'string' &&
        toolCall.args.path.trim()) ||
        '';
    if (filePath.includes('ruta/relativa/o/absoluta')) {
        filePath = '';
    }
    // Heurística: si menciona package.json y no tiene ruta, lo intentamos
    if (!filePath && lastUserQuestion?.toLowerCase().includes('package.json')) {
        filePath = './package.json';
    }
    if (!filePath) {
        console.log('\n[read_file]\nNo se proporcionó una ruta válida. ' +
            'Por favor, especifica la ruta del archivo.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'No se pudo determinar una ruta de archivo válida.');
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    // Caso especial: package.json -> resolvemos nosotros, sin modelo
    if (path.basename(filePath) === 'package.json') {
        try {
            const answer = await extractPackageJsonDeps(filePath);
            console.log('\n[read_file package.json]\n');
            console.log('\n' + answer + '\n');
            messages.push({ role: 'assistant', content: answer });
            return;
        }
        catch (err) {
            console.log('\n[read_file ERROR]\n' + err.message + '\n');
            const refined = await ralphLoop(messages, lastUserQuestion ?? '', err.message);
            console.log('\n' + refined + '\n');
            messages.push({ role: 'assistant', content: refined });
            return;
        }
    }
    // ---- Flujo normal con otros archivos ----
    const toolResult = await readFileTool({ path: filePath });
    console.log('\n[read_file]\n' + toolResult + '\n');
    if (toolResult.startsWith('Error al leer el archivo')) {
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', toolResult);
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    messages.push({
        role: 'tool',
        name: 'read_file',
        content: toolResult,
    });
    const question = lastUserQuestion ?? 'Resume el contenido del archivo para el usuario.';
    messages.push({
        role: 'user',
        content: 'A partir ÚNICAMENTE del contenido proporcionado por la herramienta anterior, ' +
            'responde EXACTAMENTE a la siguiente petición, en español técnico y conciso. ' +
            'No expliques cómo escribir código ni cómo hacerlo paso a paso. ' +
            'No des instrucciones sobre otras herramientas. ' +
            'Limítate a extraer la información pedida del archivo y responder de forma directa en texto plano. ' +
            'NO vuelvas a devolver JSON ni a pedir herramientas.\n\n' +
            'Petición: ' +
            question,
    });
    const refined = await ralphLoop(messages, question, toolResult);
    console.log('\n' + refined + '\n');
    messages.push({ role: 'assistant', content: refined });
}
async function handleListDirTool(toolCall, messages) {
    const dirPath = (toolCall.args && typeof toolCall.args.path === 'string' && toolCall.args.path.trim()) || '';
    if (!dirPath) {
        console.log('\n[list_dir]\nNo se proporcionó una ruta válida.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'No se pudo determinar una ruta de directorio válida.');
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    const toolResult = await listDirTool({ path: dirPath });
    console.log('\n[list_dir]\n' + toolResult + '\n');
    messages.push({
        role: 'tool',
        name: 'list_dir',
        content: toolResult,
    });
    messages.push({
        role: 'user',
        content: 'Basándote en el listado anterior, responde a la pregunta: ' + (lastUserQuestion ?? ''),
    });
    const refined = await ralphLoop(messages, lastUserQuestion ?? '', toolResult);
    console.log('\n' + refined + '\n');
    messages.push({ role: 'assistant', content: refined });
}
async function handleSearchInFileTool(toolCall, messages) {
    const filePath = (toolCall.args && typeof toolCall.args.path === 'string' && toolCall.args.path.trim()) || '';
    const pattern = (toolCall.args && typeof toolCall.args.pattern === 'string' && toolCall.args.pattern.trim()) ||
        '';
    if (!filePath || !pattern) {
        console.log('\n[search_in_file]\nFaltan parámetros (path, pattern).\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'Parámetros insuficientes para search_in_file.');
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    const toolResult = await searchInFileTool({ path: filePath, pattern });
    console.log('\n[search_in_file]\n' + toolResult + '\n');
    messages.push({
        role: 'tool',
        name: 'search_in_file',
        content: toolResult,
    });
    messages.push({
        role: 'user',
        content: 'Basándote en los resultados de búsqueda anteriores, responde: ' +
            (lastUserQuestion ?? ''),
    });
    const refined = await ralphLoop(messages, lastUserQuestion ?? '', toolResult);
    console.log('\n' + refined + '\n');
    messages.push({ role: 'assistant', content: refined });
}
async function handleRunCommandTool(toolCall, messages) {
    const command = (toolCall.args && typeof toolCall.args.command === 'string' && toolCall.args.command.trim()) ||
        '';
    if (!command) {
        console.log('\n[run_command]\nNo se proporcionó un comando válido.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'No se pudo determinar un comando válido.');
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    const toolResult = await runCommandTool({ command });
    console.log('\n[run_command]\n' + toolResult + '\n');
    messages.push({
        role: 'tool',
        name: 'run_command',
        content: toolResult,
    });
    messages.push({
        role: 'user',
        content: 'Basándote en la salida anterior del comando, responde: ' + (lastUserQuestion ?? ''),
    });
    const refined = await ralphLoop(messages, lastUserQuestion ?? '', toolResult);
    console.log('\n' + refined + '\n');
    messages.push({ role: 'assistant', content: refined });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=agent.js.map