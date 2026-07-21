import NodeCache from 'node-cache';
import crypto from 'crypto';

const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

function generateHash(request) {
    const hashData = JSON.stringify({
        taskType: request.taskType,
        prompt: request.prompt,
        data: request.data
    });
    return crypto.createHash('sha256').update(hashData).digest('hex');
}

function getTTL(taskType) {
    if (taskType === 'event_classification') return 0; // effectively infinite
    if (taskType === 'chat_conversation') return -1; // do not cache exact match
    if (taskType === 'chart_qa') return -1; // handle via semantic instead
    return 900; // 15 mins default
}

export const responseCache = {
    get(request) {
        if (getTTL(request.taskType) === -1) return null;
        const key = generateHash(request);
        const hit = cache.get(key);
        if (hit) {
            console.log(`[AI Gateway] Exact Match Cache Hit for ${request.taskType}`);
            return { ...hit, cached: true, cacheType: 'exact' };
        }
        return null;
    },
    
    set(request, response) {
        const ttl = getTTL(request.taskType);
        if (ttl === -1) return;
        const key = generateHash(request);
        cache.set(key, response, ttl);
    }
};
