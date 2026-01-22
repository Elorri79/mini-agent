/**
 * Definición e implementación de tools disponibles para el agente
 */
import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { CONFIG } from './config.js';
/**
 * read_file: Lee un archivo del sistema de archivos
 */
export async function readFileTool(args) {
    try {
        const abs = path.resolve(process.cwd(), args.path);
        const data = await fs.readFile(abs, 'utf8');
        const truncated = data.length > CONFIG.MAX_FILE_SIZE
            ? data.slice(0, CONFIG.MAX_FILE_SIZE) + '\n\n...[truncado]...'
            : data;
        return `Contenido de ${abs}:\n\n${truncated}`;
    }
    catch (err) {
        return `Error al leer el archivo "${args.path}": ${err?.message ?? String(err)}`;
    }
}
/**
 * Caso especial: extrae dependencias de package.json sin usar el modelo
 */
export async function extractPackageJsonDeps(filePath) {
    try {
        const abs = path.resolve(process.cwd(), filePath);
        const raw = await fs.readFile(abs, 'utf8');
        const pkg = JSON.parse(raw);
        const deps = Object.keys(pkg.dependencies ?? {});
        const devDeps = Object.keys(pkg.devDependencies ?? {});
        return (`El archivo package.json declara como dependencias: ` +
            `${deps.length ? deps.join(', ') : '(ninguna)'}; ` +
            `y como devDependencies: ` +
            `${devDeps.length ? devDeps.join(', ') : '(ninguna)'}.`);
    }
    catch (err) {
        throw new Error(`Error al procesar package.json: ${err?.message ?? String(err)}`);
    }
}
/**
 * Intenta parsear un tool-call desde la respuesta del modelo
 */
export function parseToolCall(raw) {
    try {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
            return null;
        const slice = raw.slice(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(slice);
        if (parsed && typeof parsed.tool === 'string') {
            return { tool: parsed.tool, args: parsed.args ?? {} };
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * list_dir: Lista archivos en un directorio
 */
export async function listDirTool(args) {
    try {
        const abs = path.resolve(process.cwd(), args.path);
        const entries = await fs.readdir(abs, { withFileTypes: true });
        const items = entries
            .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
            .join('\n');
        return `Contenido de ${abs}:\n${items || '(vacío)'}`;
    }
    catch (err) {
        return `Error al listar "${args.path}": ${err?.message ?? String(err)}`;
    }
}
/**
 * search_in_file: Busca un patrón en un archivo
 */
export async function searchInFileTool(args) {
    try {
        const abs = path.resolve(process.cwd(), args.path);
        const content = await fs.readFile(abs, 'utf8');
        const regex = new RegExp(args.pattern, 'gi');
        const matches = content.match(regex) ?? [];
        if (matches.length === 0) {
            return `No se encontraron coincidencias de "${args.pattern}" en ${abs}`;
        }
        // Mostrar líneas que contienen la coincidencia (máx 10)
        const lines = content
            .split('\n')
            .map((line, i) => ({ line, num: i + 1 }))
            .filter((l) => regex.test(l.line))
            .slice(0, 10);
        return (`Encontradas ${matches.length} coincidencias de "${args.pattern}" en ${abs}:\n` +
            lines.map((l) => `  L${l.num}: ${l.line.trim()}`).join('\n') +
            (matches.length > 10 ? '\n  ...(más resultados)' : ''));
    }
    catch (err) {
        return `Error al buscar en "${args.path}": ${err?.message ?? String(err)}`;
    }
}
/**
 * run_command: Ejecuta un comando y resume salida
 */
export async function runCommandTool(args) {
    try {
        const result = execSync(args.command, {
            encoding: 'utf8',
            maxBuffer: CONFIG.MAX_FILE_SIZE,
            timeout: CONFIG.REQUEST_TIMEOUT,
        });
        const truncated = result.length > CONFIG.MAX_FILE_SIZE
            ? result.slice(0, CONFIG.MAX_FILE_SIZE) + '\n\n...[truncado]...'
            : result;
        return `Salida de "${args.command}":\n${truncated || '(vacío)'}`;
    }
    catch (err) {
        const stderr = err?.stderr?.toString?.() ?? '';
        const stdout = err?.stdout?.toString?.() ?? '';
        const msg = (stderr || stdout || err?.message) ?? String(err);
        return `Error ejecutando "${args.command}": ${msg}`;
    }
}
//# sourceMappingURL=tools.js.map