import NodeCache from 'node-cache';
import { AI_CONFIG } from '../config.js';
import crypto from 'crypto';

// Bug 17 Fix: MaxKeys set to 1000 to prevent event loop blocking on huge O(N) array scans
const vectorCache = new NodeCache({ stdTTL: 86400, maxKeys: 1000 });

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper for stable hashing
export function getStableHash(data) {
    if (!data) return 'no_data';
    const stableStringify = (obj) => {
        if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
        if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
        return `{${Object.keys(obj).sort().map(k => `"${k}":${stableStringify(obj[k])}`).join(',')}}`;
    };
    try {
        const sortedData = stableStringify(data);
        return crypto.createHash('sha256').update(String(sortedData)).digest('hex');
    } catch(e) {
        return crypto.createHash('sha256').update(String(data)).digest('hex');
    }
}

export const semanticCache = {
    async getEmbedding(text) {
        try {
            const url = `${AI_CONFIG.OLLAMA_BASE_URL}/api/embeddings`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: AI_CONFIG.EMBEDDING_MODEL || 'nomic-embed-text',
                    prompt: text
                }),
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.embedding;
        } catch (e) {
            return null;
        }
    },

    async check(request, threshold = 0.92) {
        if (request.taskType !== 'chart_qa') return null;

        const embedding = await this.getEmbedding(request.prompt);
        if (!embedding) return null;

        const dataHash = getStableHash(request.data);

        const keys = vectorCache.keys();
        let bestMatch = null;
        let highestSim = -1;

        for (const key of keys) {
            const stored = vectorCache.get(key);
            if (!stored) continue;

            // Bug 16 Fix: Ensure semantic cache only matches identical chart grounding data!
            if (stored.dataHash !== dataHash) continue;

            const sim = cosineSimilarity(embedding, stored.embedding);
            if (sim > threshold && sim > highestSim) {
                highestSim = sim;
                bestMatch = stored.response;
            }
        }

        if (bestMatch) {
            console.log(`[AI Gateway] Semantic Cache Hit! Similarity: ${highestSim.toFixed(3)}`);
            return {
                ...bestMatch,
                cached: true,
                cacheType: 'semantic'
            };
        }

        return null;
    },

    async set(request, response) {
        if (request.taskType !== 'chart_qa') return;

        const embedding = await this.getEmbedding(request.prompt);
        if (!embedding) return;

        const dataHash = getStableHash(request.data);

        // Manual maxKeys enforcement if node-cache doesn't natively support it perfectly
        const keys = vectorCache.keys();
        if (keys.length > 1000) vectorCache.del(keys[0]);

        const key = `semantic_${Date.now()}_${Math.random()}`;
        vectorCache.set(key, { embedding, response, dataHash });
    }
};
