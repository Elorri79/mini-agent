/**
 * Lógica de revisión tipo "Ralph Wiggum"
 * Usa el modelo para verificar si una respuesta es correcta
 */
import { CONFIG } from './config.js';
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
function parseReviewJson(raw) {
    try {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1)
            return null;
        const slice = raw.slice(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(slice);
        if (parsed &&
            (parsed.verdict === 'OK' || parsed.verdict === 'REINTENTAR') &&
            typeof parsed.feedback === 'string') {
            return { verdict: parsed.verdict, feedback: parsed.feedback };
        }
        return null;
    }
    catch {
        return null;
    }
}
export async function reviewAnswer(question, answer, contextHint) {
    const reviewMessages = [
        {
            role: 'system',
            content: CONFIG.REVIEWER_PROMPT,
        },
        {
            role: 'user',
            content: (contextHint ? `Contexto de datos disponibles:\n${contextHint}\n\n` : '') +
                'Pregunta original del usuario:\n' +
                question +
                '\n\n' +
                'Respuesta propuesta:\n' +
                answer,
        },
    ];
    try {
        const raw = await callModel(reviewMessages);
        const parsed = parseReviewJson(raw);
        if (parsed) {
            return parsed;
        }
        return { verdict: 'REINTENTAR', feedback: 'El revisor no pudo analizar la respuesta.' };
    }
    catch {
        return { verdict: 'REINTENTAR', feedback: 'Error al llamar al revisor.' };
    }
}
export async function ralphLoop(baseMessages, question, contextHint, maxLoops = CONFIG.MAX_REVIEW_LOOPS) {
    let messages = [...baseMessages];
    let lastAnswer = '';
    for (let i = 0; i < maxLoops; i++) {
        lastAnswer = await callModel(messages);
        const review = await reviewAnswer(question, lastAnswer, contextHint);
        if (review.verdict === 'OK') {
            return lastAnswer;
        }
        // Feedback para el siguiente intento
        messages.push({
            role: 'system',
            content: `El revisor indica que tu respuesta NO es correcta. Corrige teniendo en cuenta este feedback:\n${review.feedback}`,
        });
        messages.push({
            role: 'assistant',
            content: lastAnswer,
        });
    }
    return lastAnswer;
}
//# sourceMappingURL=reviewer.js.map