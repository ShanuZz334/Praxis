import { providerCache } from '../cache/providerCache.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode }) {
    const p = await providerCache.getProvider('ollama');
    if (!p) throw new Error('Ollama provider is not configured.');

    const url = p.baseUrl || 'http://localhost:11434';
    
    let prompt = "";
    for (const msg of messages) {
        prompt += `${msg.role.toUpperCase()}:\n${msg.content}\n\n`;
    }

    const payload = {
        model,
        prompt: prompt.trim(),
        stream: false,
        keep_alive: model.includes('3b') ? -1 : undefined,
        options: {
            temperature: temperature ?? 0.2,
            num_predict: maxTokens ?? 1024
        }
    };

    if (jsonMode) payload.format = "json";

    const startTime = Date.now();
    const response = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Ollama Error: ${await response.text()}`);
    }

    const data = await response.json();
    return {
        text: data.response,
        tokensIn: data.prompt_eval_count || 0,
        tokensOut: data.eval_count || 0,
        latencyMs: Date.now() - startTime
    };
}
