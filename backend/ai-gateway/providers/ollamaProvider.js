import { providerCache } from '../cache/providerCache.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode, providerId = 'ollama' , timeoutMs }) {
    const p = await providerCache.getProvider(providerId);
    if (!p) throw new Error(`${providerId} provider is not configured.`);

    const url = p.baseUrl || 'http://localhost:11434';
    
    const payload = {
        model,
        messages: messages.map(m => ({
            role: m.role.toLowerCase(),
            content: m.content
        })),
        stream: false,
        keep_alive: model.includes('3b') ? -1 : undefined,
        options: {
            temperature: temperature ?? 0.7,
            num_predict: maxTokens ?? 1024,
            num_ctx: 32768
        }
    };

    if (jsonMode) payload.format = "json";

    const startTime = Date.now();
    const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs || 45000)
    });

    if (!response.ok) {
        throw new Error(`Ollama Error: ${await response.text()}`);
    }

    const data = await response.json();
    return {
        text: data.message?.content || data.response || "",
        tokensIn: data.prompt_eval_count || 0,
        tokensOut: data.eval_count || 0,
        latencyMs: Date.now() - startTime
    };
}
