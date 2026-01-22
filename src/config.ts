/**
 * Centralized agent configuration
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
    role: Role;
    content: string;
    name?: string;
}

export const CONFIG = {
    // Ollama connection
    API_BASE: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1',
    MODEL_NAME: process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b',

    // Limits
    MAX_FILE_SIZE: 8000,
    MAX_CONTEXT_TOKENS: 2000,
    MAX_REVIEW_LOOPS: 7,
    REQUEST_TIMEOUT: 30000,
    TEMPERATURE: 0.3,  // Low for consistency with small models

    // System messages (optimized for small models)
    SYSTEM_PROMPT: `You are a technical assistant. Respond in English, clear and concise. No emojis.

AVAILABLE TOOLS:
- "read_file": read file content
- "list_dir": list files in a directory
- "search_in_file": search patterns in a file
- "run_command": execute a command and summarize output

Only use tools if the user asks for them. For conceptual questions, respond directly.

WHEN USING A TOOL, respond ONLY with JSON:
{ "tool": "name", "args": {...} }

If you do NOT need a tool, respond in normal text.`,

    REVIEWER_PROMPT: `Strict reviewer. Is the answer correct and useful?
If missing info, made something up, or went off topic → RETRY.

Respond ONLY with JSON:
{ "verdict": "OK" | "RETRY", "feedback": "brief" }`,

    // Prompt for detecting when to use skills
    SKILL_DETECTOR_PROMPT: `Analyze the user's question. Does it need a skill (complex analysis) or a simple tool?

If the question requires:
- Analyzing the entire project → skill: analyze_project
- Debugging an error → skill: debug_error
- Resolving dependencies → skill: resolve_dependencies
- Something else → respond: NONE

Respond ONLY with: "skill_name" or "NONE"`,
};

