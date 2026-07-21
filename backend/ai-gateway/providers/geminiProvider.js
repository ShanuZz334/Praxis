import { providerCache } from '../cache/providerCache.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode }) {
    const p = await providerCache.getProvider('gemini');
    if (!p || !p.apiKey) throw new Error('Gemini provider is not configured.');

    const url = p.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai';
    const endpoint = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

    const payload = { model, messages, temperature: temperature ?? 0.2, max_tokens: maxTokens ?? 1024 };
    if (jsonMode) payload.response_format = { type: "json_object" };

    const startTime = Date.now();
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.apiKey}` },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) throw new Error(`[429] Gemini Rate Limit: ${errorText}`);
        throw new Error(`[${response.status}] Gemini Error: ${errorText}`);
    }

    const data = await response.json();
    return {
        text: data.choices[0]?.message?.content || '',
        tokensIn: data.usage?.prompt_tokens || 0,
        tokensOut: data.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startTime
    };
}
