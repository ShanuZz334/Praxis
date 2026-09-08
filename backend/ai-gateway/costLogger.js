export const costLogger = {
    log(request, response) {
        // Bug 28 Fix: Mask request details to prevent PII or API Keys bleeding into server logs
        const logEntry = {
            timestamp: new Date().toISOString(),
            taskType: request.taskType,
            level: request.level, // Fixed legacy 'tier' reference
            provider: response.provider,
            model: response.model,
            cached: response.cached,
            cacheType: response.cacheType || null,
            tokensIn: response.tokensIn || 0,
            tokensOut: response.tokensOut || 0,
            latencyMs: response.latencyMs || 0,
            success: !response.error,
            fallbackTriggered: response.fallbackTriggered || false,
            // Sanitize reason to avoid printing out full API responses
            fallbackReason: response.fallbackReason ? String(response.fallbackReason).substring(0, 100) : null
        };
        
        console.log(JSON.stringify({ type: "AI_GATEWAY_LOG", ...logEntry }));
    }
};
