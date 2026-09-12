import { providerCache } from '../cache/providerCache.js';
import { aiQuotaTracker } from '../aiQuotaTracker.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode, providerId = 'groq' , timeoutMs }) {
    const p = await providerCache.getProvider(providerId);
    if (!p || !p.apiKey) throw new Error(`${providerId} provider is not configured.`);

    const url = p.baseUrl || 'https://api.groq.com/openai/v1';
    const endpoint = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

    const payload = { model, messages, temperature: temperature ?? 0.7, max_tokens: maxTokens ?? 1024 };
    // Removed response_format: { type: "json_object" } to prevent 400 errors with OSS models
    // Our outputGuard regex will extract the JSON block.

    const startTime = Date.now();
    const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs || 45000),
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.apiKey}` },
        body: JSON.stringify(payload)
    });
    
    // Capture live Groq rate-limit headers directly from LPU cluster response (supports groq and groq_2)
    aiQuotaTracker.recordGroqHeaders(response.headers, providerId);

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) throw new Error(`[429] Groq Rate Limit: ${errorText}`);
        throw new Error(`[${response.status}] Groq Error: ${errorText}`);
    }

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error(`[Groq] Malformed response from ${model}:`, JSON.stringify(data).substring(0, 200));
        throw new Error(`Invalid response structure from Groq for model ${model}`);
    }

    return {
        text: data.choices[0].message.content || '',
        tokensIn: data.usage?.prompt_tokens || 0,
        tokensOut: data.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startTime
    };
}

export async function transcribeAudio(fileBuffer, originalName, mimeType) {
    const p = await providerCache.getProvider('groq');
    if (!p || !p.apiKey) throw new Error('Groq provider is not configured.');

    const url = 'https://api.groq.com/openai/v1/audio/transcriptions';
    
    // We use standard FormData since Node 18+ has native fetch/FormData
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    
    formData.append('file', blob, originalName || 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${p.apiKey}`
            // DO NOT set Content-Type header. fetch will automatically set it to multipart/form-data with the correct boundary
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[${response.status}] Groq Transcription Error: ${errorText}`);
    }

    const data = await response.json();
    return data.text;
}

