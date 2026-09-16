/**
 * @file aiErrorSanitizer.js
 * @purpose Sanitizes AI Gateway rate limit & error payloads into clean, human-readable
 *          messages, removing raw Google RPC payloads, technical JSON objects, and tooltips clutter.
 */

function formatProviderName(name) {
    if (!name) return 'AI Provider';
    const lower = name.toLowerCase();
    if (lower.includes('openrouter')) return 'OpenRouter';
    if (lower.includes('gemini')) return 'Gemini';
    if (lower.includes('groq')) return 'Groq';
    if (lower.includes('openai')) return 'OpenAI';
    if (lower.includes('anthropic') || lower.includes('claude')) return 'Anthropic';
    if (lower.includes('ollama')) return 'Ollama';
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Parses raw technical API errors (e.g. Gemini RPC, Groq, OpenRouter 429 JSON)
 * into clean, human-readable strings and structured metadata.
 */
export function sanitizeAiErrorMessage(rawMsg, providerHint = '') {
    if (!rawMsg || typeof rawMsg !== 'string') {
        const p = formatProviderName(providerHint);
        return {
            cleanMessage: `${p} rate limit (429) reached. Traffic routed to fallback model.`,
            reason: 'Rate limit (429) exceeded',
            model: null,
            retryAfter: null,
            limit: null,
            isFreeTier: false
        };
    }

    const text = rawMsg.trim();
    let providerName = formatProviderName(providerHint);

    // If already clean, concise text without technical JSON/code artifacts, preserve it
    const hasRawSignatures = text.includes('{') || text.includes('[') || text.includes('RESOURCE_EXHAUSTED') || text.includes('googleapis');
    if (!hasRawSignatures && text.length < 90) {
        return {
            cleanMessage: text,
            reason: text,
            model: null,
            retryAfter: null,
            limit: null,
            isFreeTier: false
        };
    }

    // Check if provider is mentioned in prefix e.g. "[429] Gemini Rate Limit: ..."
    const prefixMatch = text.match(/^\[(\d{3})\]\s*([^:]+):\s*(.+)$/s);
    let candidateJson = text;
    if (prefixMatch) {
        if (!providerHint) {
            providerName = formatProviderName(prefixMatch[2]);
        }
        candidateJson = prefixMatch[3].trim();
    }

    if (providerName === 'AI Provider') {
        providerName = formatProviderName(text);
    }

    let parsed = null;
    try {
        parsed = JSON.parse(candidateJson);
        if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
    } catch (_) {
        const firstBrace = candidateJson.indexOf('{');
        const firstBracket = candidateJson.indexOf('[');
        const start = (firstBrace >= 0 && firstBracket >= 0)
            ? Math.min(firstBrace, firstBracket)
            : (firstBrace >= 0 ? firstBrace : firstBracket);

        if (start >= 0) {
            try {
                let candidate = candidateJson.slice(start);
                let p = JSON.parse(candidate);
                if (Array.isArray(p) && p.length > 0) p = p[0];
                parsed = p;
            } catch (_) {}
        }
    }

    let model = null;
    let retryAfter = null;
    let limit = null;
    let isFreeTier = false;
    let innerMessage = '';

    if (parsed && typeof parsed === 'object') {
        const errObj = parsed.error || parsed;
        innerMessage = typeof errObj.message === 'string' ? errObj.message : '';

        // Check Google RPC details
        if (Array.isArray(errObj.details)) {
            for (const detail of errObj.details) {
                if (detail?.['@type']?.includes('RetryInfo') && detail.retryDelay) {
                    retryAfter = detail.retryDelay;
                }
                if (detail?.['@type']?.includes('QuotaFailure') && Array.isArray(detail.violations)) {
                    for (const v of detail.violations) {
                        if (v.quotaDimensions?.model) model = v.quotaDimensions.model;
                        if (v.quotaValue) limit = v.quotaValue;
                        if (v.quotaMetric?.includes('free_tier') || v.quotaId?.includes('FreeTier')) {
                            isFreeTier = true;
                        }
                    }
                }
            }
        }
    }

    const searchContext = `${text} ${innerMessage}`;

    // Extract retry delay if not found
    if (!retryAfter) {
        const retryMatch = searchContext.match(/retry in\s*([\d\.]+s?)/i) || 
                           searchContext.match(/try again in\s*([\d\.]+s?)/i) ||
                           searchContext.match(/retryDelay["']?\s*:\s*["']?(\d+s?)/i);
        if (retryMatch) {
            retryAfter = retryMatch[1];
        }
    }

    // Format retry delay to clean round number (e.g. 54.637636996s -> 55s)
    if (retryAfter) {
        const num = parseFloat(retryAfter);
        if (!isNaN(num)) {
            retryAfter = `${Math.ceil(num)}s`;
        }
    }

    // Extract model if not found
    if (!model) {
        const modelMatch = searchContext.match(/model[:\s`"]+([a-zA-Z0-9_\-\.]+)/i);
        if (modelMatch && !['the', 'and', 'for', 'is'].includes(modelMatch[1].toLowerCase())) {
            model = modelMatch[1];
        }
    }

    // Extract limit if not found
    if (!limit) {
        const limitMatch = searchContext.match(/limit[:\s`"]+(\d+)/i);
        if (limitMatch) {
            limit = limitMatch[1];
        }
    }

    if (searchContext.toLowerCase().includes('free_tier') || searchContext.toLowerCase().includes('freetier')) {
        isFreeTier = true;
    }

    // Construct human-readable clean message
    let cleanMessage = '';
    if (isFreeTier && model) {
        cleanMessage = `Daily free-tier quota exceeded for ${model}`;
        if (limit) cleanMessage += ` (${limit} req limit)`;
        cleanMessage += '. Traffic routed to fallback model.';
        if (retryAfter) cleanMessage += ` Resets in ~${retryAfter}.`;
    } else if (model) {
        cleanMessage = `${providerName} rate limit reached on ${model}`;
        if (limit) cleanMessage += ` (${limit} limit)`;
        cleanMessage += '. Traffic routed to fallback model.';
        if (retryAfter) cleanMessage += ` Resets in ~${retryAfter}.`;
    } else {
        cleanMessage = `${providerName} rate limit (429) reached. Traffic routed to fallback model.`;
        if (retryAfter) cleanMessage += ` Resets in ~${retryAfter}.`;
    }

    // Construct clean concise reason
    let reason = 'Daily quota limit reached';
    if (isFreeTier && model) {
        reason = `Free-tier quota exceeded for ${model}${limit ? ` (${limit} req)` : ''}${retryAfter ? ` - retry in ~${retryAfter}` : ''}`;
    } else if (model) {
        reason = `Rate limit on ${model}${retryAfter ? ` - retry in ~${retryAfter}` : ''}`;
    } else if (retryAfter) {
        reason = `Rate limit (429) hit - retry in ~${retryAfter}`;
    } else {
        reason = 'Rate limit (429) exceeded';
    }

    return {
        cleanMessage,
        reason,
        model,
        retryAfter,
        limit,
        isFreeTier
    };
}

/**
 * Checks if a string contains raw JSON or raw RPC error dumps.
 */
export function isRawAiError(str) {
    if (!str || typeof str !== 'string') return false;
    return str.includes('{"error":') || 
           str.includes('RESOURCE_EXHAUSTED') || 
           str.includes('type.googleapis.com') ||
           str.includes('[429] Gemini') ||
           str.includes('[429] Groq') ||
           str.includes('[429] OpenRouter') ||
           (str.startsWith('[429]') && str.length > 60);
}

/**
 * Cleans a description or content string, guaranteeing no raw JSON is rendered.
 */
export function cleanAiText(text, providerHint = '') {
    if (!text || typeof text !== 'string') return text || '';
    if (isRawAiError(text)) {
        return sanitizeAiErrorMessage(text, providerHint).cleanMessage;
    }
    return text;
}

/**
 * Cleans metadata values, ensuring no JSON arrays/objects or long stack traces.
 */
export function cleanMetadataValue(value, providerHint = '') {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (isRawAiError(str)) {
        return sanitizeAiErrorMessage(str, providerHint).reason;
    }
    return str;
}

/**
 * Cleans an entire notification object loaded from state or localStorage.
 */
export function sanitizeNotification(n) {
    if (!n) return n;

    const desc = n.description || '';
    const content = n.content || '';
    const metadata = { ...(n.metadata || {}) };
    const provider = metadata.Provider || '';

    let newDesc = desc;
    let newContent = content;

    if (isRawAiError(desc)) {
        const s = sanitizeAiErrorMessage(desc, provider);
        newDesc = s.cleanMessage;
    }

    if (isRawAiError(content)) {
        const s = sanitizeAiErrorMessage(content, provider);
        newContent = s.cleanMessage;
    }

    if (metadata.Reason && isRawAiError(metadata.Reason)) {
        const s = sanitizeAiErrorMessage(metadata.Reason, provider);
        metadata.Reason = s.reason;
        if (s.model && !metadata.Model) metadata.Model = s.model;
        if (s.retryAfter && !metadata.ResetsIn) metadata.ResetsIn = `~${s.retryAfter}`;
    }

    // Clean any other raw metadata fields
    for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'string' && isRawAiError(v)) {
            metadata[k] = cleanMetadataValue(v, provider);
        }
    }

    return {
        ...n,
        description: newDesc,
        content: newContent || newDesc,
        metadata
    };
}
