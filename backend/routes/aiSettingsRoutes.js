import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import AiProvider from '../models/AiProvider.js';
import AiRouting from '../models/AiRouting.js';
import { encrypt, decrypt } from '../ai-gateway/utils/encryption.js';
import { providerCache } from '../ai-gateway/cache/providerCache.js';

const router = express.Router();

async function verifyProviderKey(providerId, baseUrl, apiKey) {
    if (providerId === 'ollama' || !apiKey) return true;
    const url = baseUrl || (providerId === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1');
    const endpoint = url.endsWith('/models') ? url : url.replace('/chat/completions', '') + '/models';
    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(5000)
        });
        if (res.status === 401 || res.status === 403) throw new Error(`Invalid API Key for ${providerId}`);
        return true;
    } catch(e) {
        if (e.message.includes('Invalid API Key')) throw e;
        return true;
    }
}

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
            models: { level1_fast: 'llama-3.1-8b-instant', level2_standard: 'llama-3.3-70b-versatile', level3_advanced: 'llama-3.1-70b-versatile', level7_audio: 'whisper-large-v3-turbo' }
        },
        {
            providerId: 'gemini', displayName: 'Google Gemini', purpose: 'Vision / General', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            models: { level1_fast: 'gemini-2.5-flash-lite', level2_standard: 'gemini-2.5-flash', level6_vision: 'gemini-2.5-flash' }
        },
        {
            providerId: 'openrouter', displayName: 'OpenRouter', purpose: 'Deep Reasoning - Fallback', baseUrl: 'https://openrouter.ai/api/v1',
            models: { level2_standard: 'google/gemini-2.5-flash:free', level3_advanced: 'deepseek/deepseek-r1-distill-llama-70b:free', level4_expert: 'deepseek/deepseek-r1:free' }
        },
        {
            providerId: 'openrouter_2', displayName: 'OpenRouter (Secondary)', purpose: 'Deep Reasoning - Backup', baseUrl: 'https://openrouter.ai/api/v1',
            models: { level2_standard: 'minimax/minimax-m2.7:free', level3_advanced: 'meta-llama/llama-3.3-70b-instruct:free', level5_reasoner: 'deepseek/deepseek-r1:free' }
        },
        {
            providerId: 'ollama', displayName: 'Local Ollama', purpose: 'Fast Tasks / Personal', baseUrl: 'http://localhost:11434',
            models: { level1_fast: 'qwen2.5:3b', level2_standard: 'qwen2.5:7b' }
        },
        {
            providerId: 'zai', displayName: 'Z.AI (Zhipu)', purpose: 'High concurrency and cost-effective multi-modal models', baseUrl: 'https://api.z.ai/api/paas/v4',
            models: { level1_fast: 'glm-4.5-flash', level2_standard: 'glm-5.3-flash', level3_advanced: 'glm-5.1', level4_expert: 'glm-5.2', level5_reasoner: 'glm-4-plus', level6_vision: 'glm-4.6v' }
        }
    ]);
});

router.post('/providers', async (req, res) => {
    try {
        const body = req.body;
        if (body.apiKey) {
            await verifyProviderKey(body.providerId, body.baseUrl, body.apiKey);
            body.apiKey = encrypt(body.apiKey);
        }
        
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
        
        if (!body.apiKey || body.apiKey === "" || body.apiKey.includes('...')) {
            // If empty, user left it blank to keep existing.
            // If it has '...', it's the masked string from frontend.
            delete body.apiKey;
        } else {
            // A new, actual key was provided
            await verifyProviderKey(body.providerId, body.baseUrl, body.apiKey);
            body.apiKey = encrypt(body.apiKey);
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
        const modelToTest = provider.models.level1_fast || provider.models.level2_standard || provider.models.level3_advanced || provider.models.level4_expert || provider.models.level5_reasoner || provider.models.level6_vision || provider.models.level7_audio || 'qwen2.5:3b';
        
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
        const response = await fetch(`${ollama.baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
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
