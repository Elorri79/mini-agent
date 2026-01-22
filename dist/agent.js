#!/usr/bin/env node
import readline from 'node:readline';
import path from 'node:path';
import { CONFIG } from './config.js';
import { readFileTool, extractPackageJsonDeps, parseToolCall, listDirTool, searchInFileTool, runCommandTool, } from './tools.js';
import { ralphLoop } from './reviewer.js';
import { executeSkill, AVAILABLE_SKILLS } from './skills.js';
let lastUserQuestion = null;
/**
 * Detect if a question needs a skill
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
        // Verify it's a valid skill
        if (skillName !== 'none' && AVAILABLE_SKILLS[skillName]) {
            return skillName;
        }
    }
    catch {
        // If detection fails, continue normally
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
        throw new Error('Empty response from model');
    }
    return reply;
}
// ---- Main loop with tools + Ralph support -------------------------
function printBanner() {
    const reset = '\x1b[0m';
    const cyan = '\x1b[36m';
    const white = '\x1b[37m';
    console.log('');
    console.log(`${cyan} ███╗   ███╗ ██╗ ███╗   ██╗ ██╗         █████╗   ██████╗  ███████╗ ███╗   ██╗ ████████╗${reset}`);
    console.log(`${cyan} ████╗ ████║ ██║ ████╗  ██║ ██║        ██╔══██╗ ██╔════╝  ██╔════╝ ████╗  ██║ ╚══██╔══╝${reset}`);
    console.log(`${cyan} ██╔████╔██║ ██║ ██╔██╗ ██║ ██║ █████╗ ███████║ ██║  ███╗ █████╗   ██╔██╗ ██║    ██║${reset}`);
    console.log(`${cyan} ██║╚██╔╝██║ ██║ ██║╚██╗██║ ██║ ╚════╝ ██╔══██║ ██║   ██║ ██╔══╝   ██║╚██╗██║    ██║${reset}`);
    console.log(`${cyan} ██║ ╚═╝ ██║ ██║ ██║ ╚████║ ██║        ██║  ██║ ╚██████╔╝ ███████╗ ██║ ╚████║    ██║${reset}`);
    console.log(`${cyan} ╚═╝     ╚═╝ ╚═╝ ╚═╝  ╚═══╝ ╚═╝        ╚═╝  ╚═╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═══╝    ╚═╝${reset}`);
    console.log('');
    console.log(`${white}  MINI-AGENT${reset} by Elorri`);
    console.log(`  CLI for local LLMs with tools + self-review`);
    console.log('');
    console.log(`  Type "exit" to quit`);
    console.log('');
}
async function main() {
    printBanner();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
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
                // First: Detect if it needs a skill?
                const detectedSkill = await detectSkill(input);
                if (detectedSkill) {
                    console.log(`\n[SKILL DETECTED: ${detectedSkill}]\n`);
                    const skillResult = await executeSkill(detectedSkill, messages, {
                        question: input,
                    });
                    console.log('\n' + skillResult + '\n');
                    messages.push({ role: 'assistant', content: skillResult });
                }
                else {
                    // If not a skill, proceed with normal tools
                    const firstReply = await callModel(messages);
                    // Did it return a tool-call?
                    const toolCall = parseToolCall(firstReply);
                    if (toolCall) {
                        // Route to the correct tool
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
                                console.log(`\n[ERROR]\nUnknown tool: "${toolCall.tool}"\n`);
                                const refined = await ralphLoop(messages, lastUserQuestion ?? '', `Unknown tool: ${toolCall.tool}`);
                                console.log('\n' + refined + '\n');
                                messages.push({ role: 'assistant', content: refined });
                        }
                    }
                    else {
                        // --------- Tool-less flow: Ralph on direct response ---------
                        const refined = await ralphLoop([...messages], lastUserQuestion ?? '', undefined);
                        console.log('\n' + refined + '\n');
                        messages.push({ role: 'assistant', content: refined });
                    }
                }
            }
            catch (err) {
                console.error('Error calling model:', err?.message ?? err);
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
    if (filePath.includes('relative/or/absolute/path')) {
        filePath = '';
    }
    // Heuristic: if it mentions package.json and has no path, try it
    if (!filePath && lastUserQuestion?.toLowerCase().includes('package.json')) {
        filePath = './package.json';
    }
    if (!filePath) {
        console.log('\n[read_file]\nNo valid path provided. ' +
            'Please specify the file path.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'Could not determine a valid file path.');
        console.log('\n' + refined + '\n');
        messages.push({ role: 'assistant', content: refined });
        return;
    }
    // Special case: package.json -> resolve ourselves, without model
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
    // ---- Normal flow with other files ----
    const toolResult = await readFileTool({ path: filePath });
    console.log('\n[read_file]\n' + toolResult + '\n');
    if (toolResult.startsWith('Error reading file')) {
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
    const question = lastUserQuestion ?? 'Summarize the file content for the user.';
    messages.push({
        role: 'user',
        content: 'Based ONLY on the content provided by the previous tool, ' +
            'respond EXACTLY to the following request in technical and concise English. ' +
            'Do not explain how to write code or how to do it step by step. ' +
            'Do not give instructions about other tools. ' +
            'Just extract the requested information from the file and respond directly in plain text. ' +
            'Do not return JSON or ask for tools again.\n\n' +
            'Request: ' +
            question,
    });
    const refined = await ralphLoop(messages, question, toolResult);
    console.log('\n' + refined + '\n');
    messages.push({ role: 'assistant', content: refined });
}
async function handleListDirTool(toolCall, messages) {
    const dirPath = (toolCall.args && typeof toolCall.args.path === 'string' && toolCall.args.path.trim()) || '';
    if (!dirPath) {
        console.log('\n[list_dir]\nNo valid path provided.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'Could not determine a valid directory path.');
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
        content: 'Based on the listing above, answer the question: ' + (lastUserQuestion ?? ''),
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
        console.log('\n[search_in_file]\nMissing parameters (path, pattern).\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'Insufficient parameters for search_in_file.');
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
        content: 'Based on the search results above, answer: ' +
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
        console.log('\n[run_command]\nNo valid command provided.\n');
        const refined = await ralphLoop(messages, lastUserQuestion ?? '', 'Could not determine a valid command.');
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
        content: 'Based on the command output above, answer: ' + (lastUserQuestion ?? ''),
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