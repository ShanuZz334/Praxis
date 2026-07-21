export const costLogger = {
    log(request, response) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            taskType: request.taskType,
            tier: request.tier,
            provider: response.provider,
            model: response.model,
            cached: response.cached,
            cacheType: response.cacheType || null,
            tokensIn: response.tokensIn || 0,
            tokensOut: response.tokensOut || 0,
            latencyMs: response.latencyMs || 0,
            success: !response.error,
            fallbackTriggered: response.fallbackTriggered || false,
            fallbackReason: response.fallbackReason || null
        };
        
        console.log(JSON.stringify({ type: "AI_GATEWAY_LOG", ...logEntry }));
    }
};
