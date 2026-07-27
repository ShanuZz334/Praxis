import { providerCache } from '../cache/providerCache.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode }) {
    const p = await providerCache.getProvider('groq');
    if (!p || !p.apiKey) throw new Error('Groq provider is not configured.');

    const url = p.baseUrl || 'https://api.groq.com/openai/v1';
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
        if (response.status === 429) throw new Error(`[429] Groq Rate Limit: ${errorText}`);
        throw new Error(`[${response.status}] Groq Error: ${errorText}`);
    }

    const data = await response.json();
    return {
        text: data.choices[0]?.message?.content || '',
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
