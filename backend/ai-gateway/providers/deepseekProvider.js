import { providerCache } from '../cache/providerCache.js';
import { aiQuotaTracker } from '../aiQuotaTracker.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode, providerId = 'deepseek', timeoutMs }) {
    const p = await providerCache.getProvider(providerId);
    if (!p || !p.apiKey) throw new Error(`${providerId} provider is not configured.`);

    const url = p.baseUrl || 'https://api.deepseek.com/v1';
    const endpoint = url.endsWith('/chat/completions') ? url : `${url.replace(/\/+$/, '')}/chat/completions`;

    const payload = {
        model: model || 'deepseek-chat',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2048
    };

    if (jsonMode && !model?.includes('reasoner')) {
        payload.response_format = { type: 'json_object' };
    }

    const startTime = Date.now();
    const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs || 60000),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) throw new Error(`[429] DeepSeek Rate Limit: ${errorText}`);
        throw new Error(`[${response.status}] DeepSeek Error: ${errorText}`);
    }

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`Invalid response structure from DeepSeek for model ${model}`);
    }

    const msg = data.choices[0].message;
    const content = msg.content || msg.reasoning_content || '';

    return {
        text: content,
        reasoning: msg.reasoning_content || null,
        tokensIn: data.usage?.prompt_tokens || 0,
        tokensOut: data.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startTime
    };
}
