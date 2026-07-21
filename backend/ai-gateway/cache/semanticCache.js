import NodeCache from 'node-cache';
import { AI_CONFIG } from '../config.js';

// Abstracted Cache Layer (Swap to Redis Client Later)
const vectorCache = new NodeCache({ stdTTL: 86400 });

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

export const semanticCache = {
    async getEmbedding(text) {
        try {
            const url = `${AI_CONFIG.OLLAMA_BASE_URL}/api/embeddings`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: AI_CONFIG.MODELS.OLLAMA.EMBEDDING,
                    prompt: text
                })
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.embedding;
        } catch (e) {
            console.warn("[AI Gateway] Semantic cache embedding failed:", e.message);
            return null;
        }
    },

    async check(request, threshold = 0.92) {
        if (request.taskType !== 'chart_qa' && request.taskType !== 'chat_conversation') return null;

        const embedding = await this.getEmbedding(request.prompt);
        if (!embedding) return null;

        const keys = vectorCache.keys();
        let bestMatch = null;
        let highestSim = -1;

        for (const key of keys) {
            const stored = vectorCache.get(key);
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
        if (request.taskType !== 'chart_qa' && request.taskType !== 'chat_conversation') return;

        const embedding = await this.getEmbedding(request.prompt);
        if (!embedding) return;

        const key = `semantic_${Date.now()}_${Math.random()}`;
        vectorCache.set(key, { embedding, response });
    }
};
