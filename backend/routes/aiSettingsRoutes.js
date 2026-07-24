import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import AiProvider from '../models/AiProvider.js';
import AiRouting from '../models/AiRouting.js';
import { encrypt, decrypt } from '../ai-gateway/utils/encryption.js';
import { providerCache } from '../ai-gateway/cache/providerCache.js';

const router = express.Router();

router.use(protect);

router.get('/providers', async (req, res) => {
    try {
        const providers = await AiProvider.find().sort({ priority: 1 }).lean();
        const masked = providers.map(p => {
            let maskedKey = '';
            if (p.apiKey) {
                try {
                    const dec = decrypt(p.apiKey);
                    if (dec.length > 8) maskedKey = `${dec.substring(0, 4)}...${dec.substring(dec.length - 4)}`;
                    else maskedKey = '********';
                } catch(e) {
                    maskedKey = 'INVALID_KEY';
                }
            }
            return { ...p, apiKey: maskedKey };
        });
        res.json(masked);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/providers/templates', (req, res) => {
    res.json([
        {
            providerId: 'groq', displayName: 'Groq', purpose: 'Fast Tasks - Cloud', baseUrl: 'https://api.groq.com/openai/v1',
            models: { tier1_simple: 'llama-3.1-8b-instant', tier2_medium: 'llama-3.3-70b-versatile' }
        },
        {
            providerId: 'gemini', displayName: 'Google Gemini', purpose: 'Vision / General', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            models: { tier1_simple: 'gemini-3.1-flash-lite', tier2_medium: 'gemini-3.5-flash', tier3_complex: 'gemini-3.5-flash', tier4_vision: 'gemini-3.5-flash' }
        },
        {
            providerId: 'openrouter', displayName: 'OpenRouter', purpose: 'Deep Reasoning - Fallback', baseUrl: 'https://openrouter.ai/api/v1',
            models: { tier2_medium: 'meta-llama/llama-3.3-70b-instruct', tier3_complex: 'deepseek/deepseek-r1-distill-llama-70b' }
        },
        {
            providerId: 'deepseek', displayName: 'DeepSeek (Native)', purpose: 'Deep Reasoning - Fallback', baseUrl: 'https://api.deepseek.com',
            models: { tier2_medium: 'deepseek-chat', tier3_complex: 'deepseek-reasoner' }
        },
        {
            providerId: 'ollama', displayName: 'Local Ollama', purpose: 'Fast Tasks / Personal', baseUrl: 'http://localhost:11434',
            models: { tier1_simple: 'qwen2.5:3b', tier3_complex: 'qwen2.5:7b' }
        }
    ]);
});

router.post('/providers', async (req, res) => {
    try {
        const body = req.body;
        if (body.apiKey) body.apiKey = encrypt(body.apiKey);
        
        const newProvider = new AiProvider(body);
        await newProvider.save();
        providerCache.invalidate();
        res.status(201).json(newProvider);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/providers/:providerId', async (req, res) => {
    try {
        const body = req.body;
        if (body.apiKey && !body.apiKey.includes('...')) {
            body.apiKey = encrypt(body.apiKey);
        } else {
            delete body.apiKey; 
        }
        
        const updated = await AiProvider.findOneAndUpdate(
            { providerId: req.params.providerId },
            { $set: body },
            { new: true }
        );
        providerCache.invalidate();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/providers/:providerId', async (req, res) => {
    try {
        await AiProvider.findOneAndDelete({ providerId: req.params.providerId });
        providerCache.invalidate();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/providers/:providerId/toggle', async (req, res) => {
    try {
        const provider = await AiProvider.findOne({ providerId: req.params.providerId });
        if (!provider) return res.status(404).json({ error: "Not found" });
        provider.isActive = !provider.isActive;
        await provider.save();
        providerCache.invalidate();
        res.json({ isActive: provider.isActive });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/providers/reorder', async (req, res) => {
    try {
        const order = req.body.order || req.body; 
        if (!Array.isArray(order)) return res.status(400).json({ error: "Invalid payload" });
        for (const item of order) {
            await AiProvider.findOneAndUpdate(
                { providerId: item.providerId },
                { $set: { priority: item.priority } }
            );
        }
        providerCache.invalidate();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/providers/:providerId/test', async (req, res) => {
    try {
        const provider = await AiProvider.findOne({ providerId: req.params.providerId }).lean();
        if (!provider) return res.status(404).json({ error: "Provider not found" });
        
        let apiKey = provider.apiKey ? decrypt(provider.apiKey) : '';
        const url = provider.baseUrl || '';

        const startTime = Date.now();
        const modelToTest = provider.models.tier1_simple || provider.models.tier2_medium || provider.models.tier3_complex || 'qwen2.5:3b';
        
        const payload = {
            model: modelToTest,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
        };

        const fetchUrl = provider.providerId === 'ollama' ? `${url}/api/generate` : (url.endsWith('/chat/completions') ? url : `${url}/chat/completions`);
        const fetchPayload = provider.providerId === 'ollama' ? { model: modelToTest, prompt: 'Hi', stream: false } : payload;
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(fetchPayload)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        res.json({ success: true, latencyMs: Date.now() - startTime });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.get('/routing', async (req, res) => {
    try {
        let routing = await AiRouting.findOne({ isSingleton: true }).lean();
        if (!routing) {
            routing = await AiRouting.create({ isSingleton: true });
        }
        res.json(routing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/routing', async (req, res) => {
    try {
        const body = req.body;
        // Strip out immutable fields if any
        delete body._id;
        delete body.isSingleton;
        
        const routing = await AiRouting.findOneAndUpdate(
            { isSingleton: true },
            { $set: body },
            { new: true, upsert: true }
        );
        res.json(routing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/providers/ollama/models', async (req, res) => {
    try {
        const ollama = await AiProvider.findOne({ providerId: 'ollama' }).lean();
        if (!ollama || !ollama.baseUrl) return res.json([]);
        
        // Fetch from Ollama tags API
        const response = await fetch(`${ollama.baseUrl}/api/tags`);
        if (!response.ok) return res.json([]);
        
        const data = await response.json();
        if (!data.models) return res.json([]);
        
        // Format to [{ modelId: "...", displayName: "..." }]
        const models = data.models.map(m => ({
            modelId: m.name,
            displayName: m.name
        }));
        res.json(models);
    } catch (error) {
        res.json([]); // Fail silently, return empty models if ollama is down
    }
});

export default router;
