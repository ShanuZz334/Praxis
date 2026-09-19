import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import AiProvider from '../models/AiProvider.js';
import AiRouting from '../models/AiRouting.js';
import { encrypt, decrypt } from '../ai-gateway/utils/encryption.js';
import { providerCache } from '../ai-gateway/cache/providerCache.js';
import { aiQuotaTracker } from '../ai-gateway/aiQuotaTracker.js';
import { clearCircuitBreakerState, getCircuitBreakerStatus, recordProviderFailure, recordProviderSuccess } from '../ai-gateway/modelRouter.js';
import { ensureEnsembleRunning, getEnsembleReadiness, callEnsembleService } from '../services/ensembleService.js';
import { generateNaiveBaseline } from '../engine/predictionEngine.js';
import aiGateway from '../ai-gateway/index.js';

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

// --- Public Telemetry & Status Routes (No auth required) ---
router.get('/status', async (req, res) => {
    try {
        const providers = await AiProvider.find().lean();
        const status = await aiQuotaTracker.getGatewayStatus(providers);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gateway/status', async (req, res) => {
    try {
        const providers = await AiProvider.find().lean();
        const status = await aiQuotaTracker.getGatewayStatus(providers);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/quotas', async (req, res) => {
    try {
        const providers = await AiProvider.find().lean();
        const quotas = await aiQuotaTracker.computeQuotas(providers);
        res.json(quotas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/providers/templates', (req, res) => {
    res.json([
        {
            providerId: 'gemini', displayName: 'Google Gemini', purpose: 'Vision / General / High Quota', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            models: { level1_fast: 'gemini-3.5-flash-lite', level2_standard: 'gemini-3.5-flash', level3_advanced: 'gemini-3.8-flash', level4_expert: 'gemini-3.8-flash', level5_reasoner: 'gemini-3.8-flash', level6_vision: 'gemini-3.8-flash' }
        },
        {
            providerId: 'groq', displayName: 'Groq', purpose: 'Ultra-Low Latency - Cloud', baseUrl: 'https://api.groq.com/openai/v1',
            models: { level1_fast: 'groq/compound-mini', level2_standard: 'groq/compound', level3_advanced: 'openai/gpt-oss-20b', level4_expert: 'qwen/qwen3.8-27b', level5_reasoner: 'openai/gpt-oss-120b', level7_audio: 'whisper-large-v3-turbo' }
        },
        {
            providerId: 'ollama', displayName: 'Local Ollama', purpose: 'Fast Tasks / Personal', baseUrl: 'http://localhost:11434',
            models: { level1_fast: 'qwen2.5:3b', level2_standard: 'qwen2.5:7b' }
        },
        {
            providerId: 'openrouter', displayName: 'OpenRouter', purpose: 'Deep Reasoning - Fallback', baseUrl: 'https://openrouter.ai/api/v1',
            models: { level1_fast: 'nvidia/nemotron-3.5-lightning:free', level2_standard: 'meta-llama/llama-3.3-70b-instruct:free', level3_advanced: 'inclusionai/ling-3.0-flash-fin:free', level4_expert: 'poolside/laguna-s-2.1:free', level5_reasoner: 'nvidia/nemotron-3-ultra-550b-a55b:free' }
        },
        {
            providerId: 'openrouter_2', displayName: 'OpenRouter (Secondary)', purpose: 'Deep Reasoning - Backup', baseUrl: 'https://openrouter.ai/api/v1',
            models: { level1_fast: 'nex-agi/nex-n2.5-mini:free', level2_standard: 'microsoft/phi-3-medium-128k-instruct:free', level3_advanced: 'inclusionai/ling-3.0-flash-fin:free', level4_expert: 'nex-agi/nex-n2.5-pro:free', level5_reasoner: 'nvidia/nemotron-3-super-120b-a12b:free' }
        },
        {
            providerId: 'zai', displayName: 'Z.AI (Zhipu)', purpose: 'High concurrency and cost-effective multi-modal models', baseUrl: 'https://api.z.ai/api/paas/v4',
            models: { level1_fast: 'glm-4.5-flash', level2_standard: 'glm-5.3-flash', level3_advanced: 'glm-5.1', level4_expert: 'glm-5.2', level5_reasoner: 'glm-4-plus', level6_vision: 'glm-4.6v' }
        },
        {
            providerId: 'deepseek', displayName: 'DeepSeek', purpose: 'Deep Reasoning & Frontier Economics', baseUrl: 'https://api.deepseek.com/v1',
            models: { level1_fast: 'deepseek-chat', level2_standard: 'deepseek-chat', level3_advanced: 'deepseek-chat', level4_expert: 'deepseek-reasoner', level5_reasoner: 'deepseek-reasoner' }
        },
        {
            providerId: 'anthropic', displayName: 'Anthropic Claude', purpose: 'Nuanced Financial Market Analysis', baseUrl: 'https://api.anthropic.com/v1',
            models: { level1_fast: 'claude-3-5-haiku-20241022', level2_standard: 'claude-3-5-sonnet-20241022', level3_advanced: 'claude-3-5-sonnet-20241022', level4_expert: 'claude-3-opus-20240229', level5_reasoner: 'claude-3-5-sonnet-20241022' }
        }
    ]);
});

router.use(protect);

router.get('/providers', async (req, res) => {
    try {
        const providers = await AiProvider.find().sort({ priority: 1 }).lean();
        const gatewayStatus = await aiQuotaTracker.getGatewayStatus(providers);

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
            const cbStatus = getCircuitBreakerStatus(p.providerId);
            const quotaHealth = aiQuotaTracker.computeProviderHealth(p, gatewayStatus, cbStatus);

            return {
                ...p,
                apiKey: maskedKey,
                limitStatus: quotaHealth.status,
                quotaHealth
            };
        });
        res.json(masked);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/providers/health-check', async (req, res) => {
    try {
        const providers = await AiProvider.find().sort({ priority: 1 }).lean();
        const pingResults = {};
        for (const p of providers) {
            if (p.isActive) {
                pingResults[p.providerId] = await aiQuotaTracker.pingProviderHealth(p, true);
            }
        }
        const gatewayStatus = await aiQuotaTracker.getGatewayStatus(providers);
        const enriched = providers.map(p => {
            const cbStatus = getCircuitBreakerStatus(p.providerId);
            const quotaHealth = aiQuotaTracker.computeProviderHealth(p, gatewayStatus, cbStatus);
            return {
                ...p,
                limitStatus: quotaHealth.status,
                quotaHealth
            };
        });
        res.json({ success: true, timestamp: new Date().toISOString(), providers: enriched, pingResults });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/providers/circuit-breakers/reset', (req, res) => {
    try {
        clearCircuitBreakerState();
        res.json({ success: true, message: "Circuit breaker state reset successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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

        const latency = Date.now() - startTime;
        
        // Capture live response headers if available from test call
        if (provider.providerId.startsWith('openrouter')) {
            aiQuotaTracker.recordOpenRouterHeaders(response.headers, provider.providerId);
            delete aiQuotaTracker.openrouterKeyCache[provider.providerId];
        } else if (provider.providerId.startsWith('groq')) {
            aiQuotaTracker.recordGroqHeaders(response.headers, provider.providerId);
        } else if (provider.providerId === 'gemini') {
            aiQuotaTracker.recordGeminiHeaders(response.headers);
        }

        recordProviderSuccess(provider.providerId, modelToTest);
        aiQuotaTracker.recordSuccess(provider.providerId, latency);
        await aiQuotaTracker.pingProviderHealth(provider, true).catch(() => {});

        res.json({ success: true, latencyMs: latency });
    } catch (error) {
        const modelToTest = 'test';
        recordProviderFailure(req.params.providerId, modelToTest, error);
        if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
            aiQuotaTracker.recordRateLimitHit(req.params.providerId, error.message);
        } else if (error.message.includes('401') || error.message.includes('403') || error.message.toLowerCase().includes('invalid api key')) {
            aiQuotaTracker.recordAuthFailure(req.params.providerId, error.message);
        }
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

// --- Future Vision Predictive Models & Ensemble Configuration ---

router.get('/prediction-models', async (req, res) => {
    try {
        let readiness = await getEnsembleReadiness().catch(() => ({ online: false, members: [] }));
        if (!readiness.online) {
            readiness = await ensureEnsembleRunning().catch(() => ({ online: false, members: [] }));
        }
        const memberMap = new Map((readiness.members || []).map(m => [m.model_id, m]));

        const models = [
            {
                modelId: 'master_llm',
                name: 'Master LLM Multi-Timeframe Oracle',
                category: 'Qualitative LLM Synthesis',
                provider: 'Dynamic Gateway (Gemini / Claude / DeepSeek / Groq)',
                architecture: 'Multi-Perspective Contextual Order Flow & Macro Pattern Synthesis',
                description: 'Synthesizes order flow, market structure, news sentiment, and multi-timeframe candle geometry into probabilistic price targets.',
                defaultWeight: 45,
                isReady: true,
                status: 'online',
                latencyBenchmark: '~400-850ms',
                capabilities: ['Multimodal OHLCV Patterning', 'Macro & Event Absorption', 'Directional Regime Categorization']
            },
            {
                modelId: 'kronos',
                name: 'Kronos AAAI-2026',
                category: 'Time-Series Transformer',
                provider: 'FastAPI Microservice (PyTorch)',
                architecture: 'Tokenized Candlestick Autoregression (100M+ Bars Equities/Crypto)',
                description: 'Trained specifically on raw candlestick sequences for direct sub-interval generative distribution forecasting.',
                defaultWeight: 25,
                isReady: memberMap.get('kronos')?.is_ready || false,
                status: readiness.online ? (memberMap.get('kronos')?.is_ready ? 'online' : 'standby') : 'offline',
                latencyBenchmark: '~250-600ms',
                capabilities: ['Sub-candle Microstructure', 'Discrete Quantile Distribution', 'Tokenized Attention Mechanism']
            },
            {
                modelId: 'chronos_bolt',
                name: 'Amazon Chronos-Bolt Base',
                category: 'Zero-Shot Time-Series Foundation',
                provider: 'FastAPI Microservice (Amazon Science)',
                architecture: 'Quantized T5 Univariate Forecaster (Probabilistic Quantiles)',
                description: 'Pre-trained foundation model delivering high-precision zero-shot probabilistic trajectory projections.',
                defaultWeight: 20,
                isReady: memberMap.get('chronos_bolt')?.is_ready || false,
                status: readiness.online ? (memberMap.get('chronos_bolt')?.is_ready ? 'online' : 'standby') : 'offline',
                latencyBenchmark: '~180-450ms',
                capabilities: ['Zero-Shot Generalization', 'Quantile Interval Bounds (Q10-Q90)', 'Ultra-Low Variance Mean Reversion']
            },
            {
                modelId: 'lag_llama',
                name: 'Lag-Llama Foundation Forecaster',
                category: 'Probabilistic Transformer',
                provider: 'FastAPI Microservice (Morgan Stanley / Mila)',
                architecture: 'Decoder-Only Transformer with Smoothed Lag Operations',
                description: 'Specialized for distribution-based probabilistic time-series forecasting with continuous lag attention.',
                defaultWeight: 15,
                isReady: memberMap.get('lag_llama')?.is_ready || false,
                status: readiness.online ? (memberMap.get('lag_llama')?.is_ready ? 'online' : 'standby') : 'offline',
                latencyBenchmark: '~300-750ms',
                capabilities: ['Dynamic Lag Covariates', 'Student-t Distribution Modeling', 'Long-Tail Volatility Forecasting']
            },
            {
                modelId: 'naive_baseline',
                name: 'Geometric Volatility Drift',
                category: 'Mathematical Safeguard Engine',
                provider: 'Praxis Pure JS Engine (Embedded)',
                architecture: 'Dynamic ATR Mean-Drift & Statistical Variance Anchor',
                description: 'Ultra-fast statistical benchmark providing invariant ATR volatility bounds and cold-start fallback calibration.',
                defaultWeight: 10,
                isReady: true,
                status: 'online',
                latencyBenchmark: '< 1ms',
                capabilities: ['Zero-Latency Math Fallback', 'Geometric Variance Containment', 'Vincentization Conformal Anchor']
            }
        ];

        res.json({
            ensembleServiceOnline: readiness.online,
            ensembleStatus: readiness.status,
            models
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/prediction-models/config', async (req, res) => {
    try {
        const routing = await AiRouting.findOne({ isSingleton: true }).lean();
        const fv = routing?.futureVision || {};

        const defaultModels = ['master_llm', 'kronos', 'chronos_bolt', 'lag_llama', 'naive_baseline'];
        const defaultWeights = {
            master_llm: 45,
            kronos: 25,
            chronos_bolt: 20,
            lag_llama: 15,
            naive_baseline: 10
        };

        res.json({
            ensembleModels: Array.isArray(fv.ensembleModels) && fv.ensembleModels.length > 0 ? fv.ensembleModels : defaultModels,
            ensembleWeights: fv.ensembleWeights && Object.keys(fv.ensembleWeights).length > 0 ? fv.ensembleWeights : defaultWeights,
            autoWeighting: fv.autoWeighting !== undefined ? fv.autoWeighting : true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/prediction-models/config', async (req, res) => {
    try {
        const { ensembleModels, ensembleWeights, autoWeighting } = req.body;

        if (!Array.isArray(ensembleModels) || ensembleModels.length === 0) {
            return res.status(400).json({ error: 'At least one prediction model must be selected.' });
        }

        const routing = await AiRouting.findOneAndUpdate(
            { isSingleton: true },
            {
                $set: {
                    'futureVision.ensembleModels': ensembleModels,
                    'futureVision.ensembleWeights': ensembleWeights,
                    'futureVision.autoWeighting': autoWeighting !== undefined ? autoWeighting : true
                }
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            futureVision: routing.futureVision
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/prediction-models/:modelId/test', async (req, res) => {
    const { modelId } = req.params;
    const startTime = Date.now();

    try {
        if (modelId === 'master_llm') {
            const testResult = await aiGateway.process({
                taskType: 'future_vision_prediction',
                systemInstruction: 'You are Praxis Oracle benchmark test. Respond with valid JSON only.',
                prompt: 'Return a JSON test verification: {"benchmark": "ok", "status": "active"}',
                jsonMode: true,
                maxTokens: 50,
                temperature: 0.1
            });

            const latency = Date.now() - startTime;
            if (testResult.error) {
                return res.json({
                    success: false,
                    modelId,
                    latencyMs: latency,
                    error: testResult.message || 'LLM Gateway error'
                });
            }

            return res.json({
                success: true,
                modelId,
                latencyMs: latency,
                provider: testResult.provider || 'ai-gateway',
                modelUsed: testResult.model || 'gateway-active',
                message: 'Master LLM gateway operational and responding'
            });
        }

        if (modelId === 'naive_baseline') {
            const sampleCandle = { open: 24500, high: 24580, low: 24450, close: 24550, volume: 100000 };
            const quantiles = generateNaiveBaseline(sampleCandle, 130);
            const latency = Math.max(1, Date.now() - startTime);

            return res.json({
                success: true,
                modelId,
                latencyMs: latency,
                message: 'Pure JS geometric drift & ATR baseline engine computed quantiles in < 1ms',
                sampleOutput: { q50: quantiles.q50_c, q10: quantiles.q10_c, q90: quantiles.q90_c }
            });
        }

        if (['kronos', 'chronos_bolt', 'lag_llama'].includes(modelId)) {
            // Test connection to Python ensemble service for this specific member
            let readiness = await getEnsembleReadiness();
            if (!readiness.online) {
                readiness = await ensureEnsembleRunning();
            }
            const member = readiness.members?.find(m => m.model_id === modelId);

            if (!readiness.online) {
                return res.json({
                    success: false,
                    modelId,
                    latencyMs: Date.now() - startTime,
                    error: `Python ensemble microservice on port 7174 is offline. Auto-start timed out.`
                });
            }

            const latency = Date.now() - startTime;
            return res.json({
                success: true,
                modelId,
                latencyMs: latency,
                isReady: member ? member.is_ready : false,
                status: member?.is_ready ? 'Model weights loaded in memory' : 'Standby / Ready for inference',
                message: `${modelId} microservice adapter online.`
            });
        }

        return res.status(404).json({ error: `Unknown prediction model: ${modelId}` });
    } catch (error) {
        res.json({
            success: false,
            modelId,
            latencyMs: Date.now() - startTime,
            error: error.message
        });
    }
});

router.get('/providers/ollama/models', async (req, res) => {
    try {
        const ollama = await AiProvider.findOne({ providerId: 'ollama' }).lean();
        if (!ollama || !ollama.baseUrl) return res.json([]);
        
        // Fast 600ms timeout for local daemon check to prevent UI stall
        const response = await fetch(`${ollama.baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(600)
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
