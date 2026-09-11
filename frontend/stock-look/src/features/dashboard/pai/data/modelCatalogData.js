/**
 * @file modelCatalogData.js
 * @description Comprehensive catalog of AI models across OpenRouter, Groq, Google Gemini, and Z.AI (GLM).
 * Contains parameters, makers, architecture, context windows, token limits, reset schedules, pros/cons, and recommended tasks.
 */

export const MODEL_CATALOG = [
    {
        id: 'nomic-embed-text:latest',
        name: 'Nomic Embed Text (v1.5)',
        provider: 'Local Ollama',
        providerKey: 'ollama',
        maker: 'Nomic AI',
        architecture: 'Local High-Dimensional Text Embedding Model',
        parameters: { total: '137M', active: '137M Dense' },
        contextWindow: '8,192 (8K)',
        maxOutput: '768-dim vector embeddings',
        speed: 'Sub-millisecond Local',
        pricing: 'Free ($0/M) - Local Device',
        refreshSchedule: 'Continuous On-Device',
        resetType: 'continuous',
        limits: {
            rpm: 'Unlimited (Local)',
            rpd: 'Unlimited (Local)',
            tpm: 'Hardware Bound',
            concurrency: 'Multi-threaded'
        },
        pros: [
            'Running 100% locally on device via Ollama engine',
            'Zero cloud API latency, zero quota consumption, infinite throughput',
            'High-dimensional 768-dim embeddings for vector search and RAG'
        ],
        cons: [
            'Specialized embedding model; produces semantic vectors rather than generative chat tokens'
        ],
        bestFor: 'Local semantic search, memory recall, vector retrieval, and fast card caching',
        recommendedTier: 'Local Embed'
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 1. OPENROUTER & ACTIVE CONFIGURED APP MODELS
    // ═════════════════════════════════════════════════════════════════════════
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B Instruct (Free)',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Meta AI',
        architecture: 'Dense 70B Instruction-Tuned Transformer',
        parameters: { total: '70B', active: '70B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '8,192 tokens',
        speed: 'Balanced Fast',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: '100K TPM',
            concurrency: '3 in-flight'
        },
        pros: [
            'Meta flagship 70B open-weights running at zero cost on OpenRouter free tier',
            'Exceptional broad reasoning, factual synthesis, and market understanding',
            'Full 131K context window accommodates lengthy market updates'
        ],
        cons: [
            'Free community endpoints can experience queue delays during peak market hours'
        ],
        bestFor: 'Page synthesis, multi-factor market thesis, Level 2 / 3 standard reasoning',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'microsoft/phi-3-medium-128k-instruct:free',
        name: 'Phi-3 Medium 128K',
        provider: 'OpenRouter2',
        providerKey: 'openrouter',
        maker: 'Microsoft',
        architecture: 'Dense 14B High-Density Small Language Model (SLM)',
        parameters: { total: '14B', active: '14B Dense' },
        contextWindow: '128,000 (128K)',
        maxOutput: '4,096 tokens',
        speed: 'Ultra Fast',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '25 RPM',
            rpd: '250 RPD',
            tpm: '120K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Class-leading reasoning-to-parameter ratio from Microsoft Research',
            'Huge 128K context window despite light 14B footprint',
            'Very low latency inference with high token consistency'
        ],
        cons: [
            'Smaller parameter size lacks extreme non-linear financial derivatives depth'
        ],
        bestFor: 'Header aggregation insights, fast card synthesis, quick summaries',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'fish-audio/s2.1-pro-free:free',
        name: 'Fish Audio S2.1 Pro',
        provider: 'OpenRouter2',
        providerKey: 'openrouter',
        maker: 'Fish Audio',
        architecture: 'Neural Voice & Speech Synthesis Kernel',
        parameters: { total: 'Audio MoE', active: 'Speech Synth' },
        contextWindow: 'Audio Stream',
        maxOutput: 'Audio Stream',
        speed: 'Real-time Streaming',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: 'N/A',
            concurrency: '3 in-flight'
        },
        pros: [
            'Expressive, lifelike voice synthesis with low latency',
            'Zero token cost on OpenRouter free tier'
        ],
        cons: [
            'Speech synthesis only; no text generation'
        ],
        bestFor: 'Voice trading alerts, spoken executive summaries',
        recommendedTier: 'Level 7 (Audio)'
    },
    {
        id: 'whisper-large-v3',
        name: 'Whisper Large V3',
        provider: 'Groq 2 (Load Balancer)',
        providerKey: 'groq',
        maker: 'OpenAI (Hosted on Groq)',
        architecture: 'Transformer Speech Recognition Engine',
        parameters: { total: 'Large V3', active: 'Audio Kernel' },
        contextWindow: 'Real-time Audio Stream',
        maxOutput: 'Verbatim Text',
        speed: 'Real-time LPU Streaming',
        pricing: 'Free Tier ($0.111/hr paid)',
        refreshSchedule: 'Hourly Rolling (7.2K ASH) & Daily (2K RPD)',
        resetType: 'hourly',
        limits: {
            rpm: '20 RPM',
            rpd: '2,000 RPD',
            ash: '7,200 Audio Sec/Hr',
            concurrency: '10 in-flight'
        },
        pros: [
            'Gold standard audio transcription running on Groq LPUs',
            'High accuracy across accents and noisy conference room audio'
        ],
        cons: [
            'Audio transcription only'
        ],
        bestFor: 'Earnings call live transcription, voice input processing',
        recommendedTier: 'Level 7 (Audio)'
    },
    {
        id: 'qwen2.5:3b',
        name: 'Qwen 2.5 3B (Local)',
        provider: 'Local Ollama',
        providerKey: 'ollama',
        maker: 'Alibaba Cloud (Self-Hosted Ollama)',
        architecture: 'Local Open-Weights Dense Model (3B)',
        parameters: { total: '3B', active: '3B Local' },
        contextWindow: '32,768 (32K)',
        maxOutput: '4,096 tokens',
        speed: 'Local Hardware Speed',
        pricing: '100% Free (Offline / Local)',
        refreshSchedule: 'Unlimited (Always 100% Available)',
        resetType: 'unlimited',
        limits: {
            rpm: 'Unlimited',
            rpd: 'Unlimited',
            tpm: 'Unlimited',
            concurrency: 'Hardware Bound (RAM/VRAM)'
        },
        pros: [
            '100% Local and private: zero financial data leaves your machine',
            'ZERO rate limits, zero API keys needed, zero network latency',
            'Always 100% available even if internet is disconnected',
            'Compact 3B footprint runs smoothly even on standard laptops'
        ],
        cons: [
            'Speed depends on your local GPU/CPU hardware',
            'Lower reasoning complexity than 70B+ cloud frontier models'
        ],
        bestFor: 'Privacy-first card insight generation, offline screening, rapid prototyping',
        recommendedTier: 'Level 1 (Fast Local)'
    },
    {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B (Local)',
        provider: 'Local Ollama',
        providerKey: 'ollama',
        maker: 'Alibaba Cloud (Self-Hosted Ollama)',
        architecture: 'Local Open-Weights Dense Model (7B)',
        parameters: { total: '7B', active: '7B Local' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Local Hardware Speed',
        pricing: '100% Free (Offline / Local)',
        refreshSchedule: 'Unlimited (Always 100% Available)',
        resetType: 'unlimited',
        limits: {
            rpm: 'Unlimited',
            rpd: 'Unlimited',
            tpm: 'Unlimited',
            concurrency: 'Hardware Bound'
        },
        pros: [
            'Substantial 7B local capability with full 128K context window',
            '100% confidential offline execution with zero API limits',
            'Impressive mathematical reasoning and code comprehension for a 7B model'
        ],
        cons: [
            'Requires ~8GB VRAM or system RAM for comfortable local inference'
        ],
        bestFor: 'Private local analysis, offline page synthesis fallback',
        recommendedTier: 'Level 2 (Standard Local)'
    },
    {
        id: 'thinkingmachines/inkling-small:free',
        name: 'Inkling Small',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Thinking Machines Lab',
        architecture: 'MoE Multimodal (12B active / 276B total)',
        parameters: { total: '276B', active: '12B Active' },
        contextWindow: '1,050,000 (1.05M)',
        maxOutput: '32,768 tokens',
        speed: 'High Throughput',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (Rolling 24h)',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: '100K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Massive 1.05M context window at zero token cost',
            'Low inference compute demand (only 12B active parameters)',
            'Native multimodal understanding (text, vision, audio)',
            'Strong agentic tool-use and retrieval-augmented generation (RAG)'
        ],
        cons: [
            'Public free queue can occasionally have variable latency',
            'Slightly lower complex mathematical density than 975B flagship'
        ],
        bestFor: 'Deep document analysis, multi-card cross synthesis, long-horizon agent workflows',
        recommendedTier: 'Level 2 / Level 3 (Standard / Advanced)'
    },
    {
        id: 'thinkingmachines/inkling:free',
        name: 'Inkling Flagship',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Thinking Machines Lab',
        architecture: 'MoE Multimodal (41B active / 975B total)',
        parameters: { total: '975B', active: '41B Active' },
        contextWindow: '1,050,000 (1.05M)',
        maxOutput: '32,768 tokens',
        speed: 'Balanced Frontier',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (Rolling 24h)',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: '100K TPM',
            concurrency: '3 in-flight'
        },
        pros: [
            'Frontier-class 975B parameter scale with deep reasoning',
            'Full 1.05M context for massive market history & financial filings',
            'Native image, audio, and code understanding in a single loop',
            'Exceptional multi-step logical deduction and synthesis'
        ],
        cons: [
            'Heavier parameter weight causes higher latency than Inkling Small',
            'Subject to OpenRouter free community throughput thresholds'
        ],
        bestFor: 'Macroeconomic synthesis, comprehensive sector rotation thesis, Level 5 reasoning',
        recommendedTier: 'Level 5 (Reasoner)'
    },
    {
        id: 'nvidia/nemotron-3.5-lightning:free',
        name: 'Nemotron 3.5 Lightning',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'NVIDIA',
        architecture: 'Open Mixture-of-Experts (3B active / 30B total)',
        parameters: { total: '30B', active: '3B Active' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '16,384 tokens',
        speed: 'Ultra Fast (>400 tps)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Blazing fast response times (only 3B active parameters)',
            'Full 1M token context window for extensive document ingestion',
            'Ranked #43 in global Programming benchmarks',
            'Built specifically for high-volume agentic pipelines'
        ],
        cons: [
            'Compact active parameter size may miss subtle nuances in dense prose',
            'Text-only inputs (no native video/audio perception)'
        ],
        bestFor: 'Rapid card insight generation, streaming ticker summaries, real-time filters',
        recommendedTier: 'Level 1 (Fast Tasks)'
    },
    {
        id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        name: 'Nemotron 3 Ultra',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'NVIDIA',
        architecture: 'Hybrid Transformer-Mamba MoE (55B active / 550B total)',
        parameters: { total: '550B', active: '55B Active' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '65,536 tokens',
        speed: 'High-Throughput Frontier',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: '100K TPM',
            concurrency: '3 in-flight'
        },
        pros: [
            'State-of-the-art Mamba-Transformer hybrid linear-attention architecture',
            'Elite quantitative reasoning (Ranked #19 Programming, #50 Science)',
            'Huge 1M context with 55B active reasoning power',
            'Excels at complex multi-step planning and mathematical calculations'
        ],
        cons: [
            'Requires substantial compute; free endpoints can throttle during peak hours',
            'Strictly text and code inputs'
        ],
        bestFor: 'Future Vision OHLCV predictive generation, quantitative valuation modeling',
        recommendedTier: 'Level 5 (Elite Reasoner)'
    },
    {
        id: 'nvidia/nemotron-3-super-120b-a12b:free',
        name: 'Nemotron 3 Super',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'NVIDIA',
        architecture: 'Hybrid Mamba-Transformer MoE with Multi-Token Prediction',
        parameters: { total: '120B', active: '12B Active' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '32,768 tokens',
        speed: '50%+ Higher Throughput (MTP)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '25 RPM',
            rpd: '250 RPD',
            tpm: '120K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Multi-Token Prediction (MTP) generates tokens 50% faster than standard LLMs',
            'Latent MoE activates 4 experts for the inference computational cost of 1',
            'Trained across 10+ multi-agent RL environments (SWE-Bench, AIME 2025)',
            'Exceptional coherence across long-horizon planning'
        ],
        cons: [
            'Specialized structure requires strict schema prompts for optimal JSON formatting',
            'Free tier allocation can experience queuing'
        ],
        bestFor: 'Algorithmic strategy generation, multi-timeframe correlation, Future Vision backup',
        recommendedTier: 'Level 4 / Level 5 (Expert / Reasoner)'
    },
    {
        id: 'dots-studio/dots-3-note-preview:free',
        name: 'Dots3-Note Preview',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Dots Studio',
        architecture: 'MoE Multimodal (16B active / 280B total)',
        parameters: { total: '280B', active: '16B Active' },
        contextWindow: '512,000 (512K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast MoE',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (Retiring Sep 30, 2026)',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '150 RPD',
            tpm: '80K TPM',
            concurrency: '2 in-flight'
        },
        pros: [
            'Lightest, highly responsive model in the Dots 3 family',
            'Substantial 512K context window for long transcript review',
            'Effective at multi-step agent workflows and exploratory research'
        ],
        cons: [
            'Preview version slated for deprecation on September 30, 2026',
            'Lower community token volume compared to Nemotron/Ling'
        ],
        bestFor: 'Exploratory chat analysis, earnings conference call note-taking',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'inclusionai/ling-3.0-flash-vl:free',
        name: 'Ling 3.0 Flash VL',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'InclusionAI',
        architecture: 'Hybrid Instant/Reasoning MoE Vision-Language (5.5B active / 124B total)',
        parameters: { total: '124B', active: '5.5B Active' },
        contextWindow: '262,144 (262K)',
        maxOutput: '16,384 tokens',
        speed: 'Very Fast (<300ms TTFT)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Native visual perception and visual agent capabilities',
            'Hybrid architecture supports instant responses and extended reasoning traces',
            'Built-in robust tool calling and computer-use actions',
            'Low active parameter footprint (5.5B) ensures high throughput'
        ],
        cons: [
            '262K context window is smaller than 1M frontier models',
            'Less suited for pure text-only deep econometric modeling'
        ],
        bestFor: 'Technical chart visual pattern inspection, candlestick screenshot reading',
        recommendedTier: 'Level 6 (Vision Model)'
    },
    {
        id: 'inclusionai/ling-3.0-flash-fin:free',
        name: 'Ling 3.0 Flash Fin',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'InclusionAI',
        architecture: 'Financial Investment MoE (5.1B active / 124B total)',
        parameters: { total: '124B', active: '5.1B Active' },
        contextWindow: '262,144 (262K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast Financial Inference',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Specialized fine-tuning explicitly on real-world investment workflows',
            'Ranked #36 globally in Programming with high mathematical rigor',
            'Excels at options payoff modeling, Greeks, and financial balance sheets',
            'Fast 5.1B active parameter inference'
        ],
        cons: [
            'Narrow domain focus; not intended for general-purpose prose or poetry',
            '262K context window ceiling'
        ],
        bestFor: 'Fundamental valuation cards, Options OI/IV analysis, Future Vision risk scoring',
        recommendedTier: 'Level 3 / Level 4 (Advanced / Expert)'
    },
    {
        id: 'inclusionai/ling-3.0-flash-sante:free',
        name: 'Ling 3.0 Flash Sante',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'InclusionAI',
        architecture: 'Medical & Clinical MoE (5.1B active / 124B total)',
        parameters: { total: '124B', active: '5.1B Active' },
        contextWindow: '262,144 (262K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Rigorous clinical-grade factual verification and zero-shot evidence retrieval',
            'High safety standards and structured evidence validation'
        ],
        cons: [
            'Specialized for healthcare and bio-tech domains'
        ],
        bestFor: 'Pharma / Healthcare sector catalyst news & clinical trial impact analysis',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'nex-agi/nex-n2.5-pro:free',
        name: 'Nex-N2.5 Pro',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Nex AGI',
        architecture: 'Autonomous Agentic Software Engineering Model',
        parameters: { total: 'Large MoE', active: 'High Density' },
        contextWindow: '262,144 (262K)',
        maxOutput: '32,768 tokens',
        speed: 'Multi-Step Agentic',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: '100K TPM',
            concurrency: '3 in-flight'
        },
        pros: [
            'Core strength in agentic coding within an active visual feedback loop',
            'Explores codebases, runs multi-file modifications, executes terminal tasks',
            'Self-healing: diagnoses behavioral discrepancies, revises code, and re-tests',
            'Demonstrates working outcomes rather than inferring from static code'
        ],
        cons: [
            'Higher execution latency due to iterative verification cycles',
            'Can consume rate limit budget quickly during automated loops'
        ],
        bestFor: 'Automated script debugging, complex trading formula verification, tool actions',
        recommendedTier: 'Level 4 (Expert)'
    },
    {
        id: 'nex-agi/nex-n2.5-mini:free',
        name: 'Nex-N2.5 Mini',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Nex AGI',
        architecture: 'Compact Agentic Tool & Coding Model',
        parameters: { total: 'Compact MoE', active: 'Efficient' },
        contextWindow: '262,144 (262K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast Agentic',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '25 RPM',
            rpd: '250 RPD',
            tpm: '120K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Low latency agentic execution with terminal and GUI automation',
            'Lightweight version of Nex-N2.5 for rapid iterative checks',
            'High test-verification reliability in sandboxed environments'
        ],
        cons: [
            'Lower reasoning horizon than the Pro variant for large refactors'
        ],
        bestFor: 'Unit test execution, automated data validation, quick script parsing',
        recommendedTier: 'Level 1 / Level 2 (Fast / Standard)'
    },
    {
        id: 'poolside/laguna-s-2.1:free',
        name: 'Laguna S 2.1',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Poolside',
        architecture: 'Specialized Coding MoE (8B active / 118B total)',
        parameters: { total: '118B', active: '8B Active' },
        contextWindow: '262,144 (262K)',
        maxOutput: '32,768 tokens',
        speed: 'Fast Coding Agent',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '25 RPM',
            rpd: '250 RPD',
            tpm: '120K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Elite benchmark scores: 70.2% on Terminal-Bench 2.1, 40.4% on DeepSWE',
            'Ranked #48 globally in Programming; outstanding at software engineering',
            '8B active parameter footprint delivers swift token delivery',
            'Open-weight under OpenMDW-1.1 license'
        ],
        cons: [
            'Strictly tuned for coding; unsuited for open conversational banter',
            'Free usage inputs/outputs may be utilized for model alignment'
        ],
        bestFor: 'Mathematical indicator engine script generation, automated backtesting code',
        recommendedTier: 'Level 4 (Expert / Code)'
    },
    {
        id: 'poolside/laguna-xs-2.1:free',
        name: 'Laguna XS 2.1',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Poolside',
        architecture: 'Compact FP8 Coding MoE (3B active / 33B total)',
        parameters: { total: '33B', active: '3B Active' },
        contextWindow: '256,000 (256K)',
        maxOutput: '32,768 tokens',
        speed: 'Ultra-Fast FP8',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Quantized to FP8 for blazing-fast inference and minimal resource cost',
            'Huge 32K token output capability despite compact 33B footprint',
            'Tool calling and interleaved reasoning built directly into the kernel'
        ],
        cons: [
            'Slightly lower complex code refactoring ceiling than Laguna S'
        ],
        bestFor: 'Rapid formula evaluation, lightweight tool dispatching, code snippet check',
        recommendedTier: 'Level 1 (Fast)'
    },
    {
        id: 'google/gemma-4-26b-a4b-it:free',
        name: 'Gemma 4 26B A4B',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Google DeepMind',
        architecture: 'Instruction-Tuned MoE (3.8B active / 25.2B total)',
        parameters: { total: '25.2B', active: '3.8B Active' },
        contextWindow: '256,000 (256K)',
        maxOutput: '16,384 tokens',
        speed: 'Very Fast',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Near-31B quality at a fraction of compute (only 3.8B activates per token)',
            'Supports multimodal inputs: text, images, and video (up to 60s @ 1fps)',
            'Native function calling and configurable thinking/reasoning modes',
            'Permissive Apache 2.0 open release'
        ],
        cons: [
            '256K context limit (smaller than 1M Gemini / Nemotron models)'
        ],
        bestFor: 'Card insight summaries, multimodal chart verification, quick reasoning',
        recommendedTier: 'Level 2 / Level 6 (Standard / Vision)'
    },
    {
        id: 'google/gemma-4-31b-it:free',
        name: 'Gemma 4 31B',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Google DeepMind',
        architecture: 'Dense Multimodal Instruct (30.7B dense)',
        parameters: { total: '30.7B Dense', active: '30.7B Active' },
        contextWindow: '256,000 (256K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast & High Quality',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Google DeepMind flagship dense open model with 140+ language support',
            'Exceptional document understanding, mathematical deduction, and coding',
            'Configurable thinking/reasoning budget and native function calling',
            'High factual coherence without MoE routing artifacts'
        ],
        cons: [
            'Higher inference compute cost than MoE variant'
        ],
        bestFor: 'Page synthesis, macro news analysis, structured report authoring',
        recommendedTier: 'Level 3 (Advanced)'
    },
    {
        id: 'cohere/north-mini-code:free',
        name: 'North Mini Code',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Cohere',
        architecture: 'Sparse MoE Coding Agent (3B active / 30B total)',
        parameters: { total: '30B', active: '3B Active' },
        contextWindow: '256,000 (256K)',
        maxOutput: '65,536 tokens (64K)',
        speed: 'Ultra Fast',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Cohere debut agentic coding model with massive 64K token completion limit',
            'Supports interleaved reasoning and tool use via strict JSON schema',
            'Small 3B active parameter footprint ensures minimal latency'
        ],
        cons: [
            'Domain focused on terminal and software engineering tasks'
        ],
        bestFor: 'JSON schema compliance, technical indicator script creation',
        recommendedTier: 'Level 1 / Level 4 (Fast / Expert)'
    },
    {
        id: 'liquid/lfm-2.5-2.6b:free',
        name: 'LFM 2.5 2.6B',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Liquid AI',
        architecture: 'Liquid Neural Network / State-Space (2.6B dense)',
        parameters: { total: '2.6B', active: '2.6B Active' },
        contextWindow: '66,000 (66K)',
        maxOutput: '8,192 tokens',
        speed: 'Instantaneous (>600 tps)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '300 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Ultra-compact non-transformer state-space architecture',
            'Instant token generation with practically zero latency',
            'Excellent for rapid data classification, entity extraction, and filtering'
        ],
        cons: [
            'Liquid advises against knowledge-heavy or complex coding tasks',
            '66K context window is smaller than modern LLMs'
        ],
        bestFor: 'Live streaming ticker tagger, sentiment labeler, fast classification',
        recommendedTier: 'Level 1 (Fast Tasks)'
    },
    {
        id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        name: 'Nemotron 3 Nano Omni',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'NVIDIA',
        architecture: 'MoE Transformer-Mamba with Conv3D (3B active / 30B total)',
        parameters: { total: '30B', active: '3B Active' },
        contextWindow: '256,000 (256K)',
        maxOutput: '16,384 tokens',
        speed: '2x Video Throughput',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '25 RPM',
            rpd: '250 RPD',
            tpm: '120K TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Unified perception: accepts text, images, video, and audio in 1 inference loop',
            'Conv3D layers deliver 2x higher throughput and 2.5x lower compute for video',
            'Extended thinking capability with up to 16,384 reasoning budget tokens'
        ],
        cons: [
            'Requires specialized multimodal prompt formulation'
        ],
        bestFor: 'Multi-modal chart video replay analysis, live webinar/audio stream parsing',
        recommendedTier: 'Level 6 / Level 7 (Vision / Audio)'
    },
    {
        id: 'nvidia/nemotron-3.5-content-safety:free',
        name: 'Nemotron 3.5 Content Safety',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'NVIDIA',
        architecture: 'Multimodal Guardrail (4B dense, Gemma-3-4B fine-tune)',
        parameters: { total: '4B', active: '4B Active' },
        contextWindow: '128,000 (128K)',
        maxOutput: '4,096 tokens',
        speed: 'Instant Guardrail',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '500 RPD',
            tpm: '150K TPM',
            concurrency: '5 in-flight'
        },
        pros: [
            'Instant multimodal input/output moderation across 12 languages',
            'Optional reasoning trace explains exactly why a prompt was flagged',
            'Extremely lightweight 4B footprint ensures negligible gateway overhead'
        ],
        cons: [
            'Strictly a moderation/guardrail model; not for generative responses'
        ],
        bestFor: 'Gateway input/output sanitization, trading prompt safety enforcement',
        recommendedTier: 'Security / Guardrail'
    },
    {
        id: 'liquid/lfm-2.5-embedding-350m:free',
        name: 'LFM 2.5 Embedding',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Liquid AI',
        architecture: 'Dense Text Embedding Model (350M)',
        parameters: { total: '350M', active: '350M' },
        contextWindow: '512 tokens',
        maxOutput: '1,024-dim Vector',
        speed: 'Instantaneous (<10ms)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '50 RPM',
            rpd: '1,000 RPD',
            tpm: '200K TPM',
            concurrency: '10 in-flight'
        },
        pros: [
            'Produces 1,024-dimensional semantic embeddings with lightning speed',
            'Ideal for real-time vector similarity search across financial filings'
        ],
        cons: [
            '512 token context ceiling per embedding chunk'
        ],
        bestFor: 'Vector search indexing, historical pattern similarity lookup',
        recommendedTier: 'Embedding Engine'
    },
    {
        id: 'deepgram/flux-tts:free',
        name: 'Flux TTS',
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        maker: 'Deepgram',
        architecture: 'Neural Speech Synthesis Engine',
        parameters: { total: 'Proprietary', active: 'Audio Kernel' },
        contextWindow: 'Audio Stream',
        maxOutput: 'Audio Waves',
        speed: 'Real-time Streaming',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '200 RPD',
            tpm: 'N/A',
            concurrency: '3 in-flight'
        },
        pros: [
            'Natural, expressive English speech synthesis across Deepgram catalog',
            'Ultra-low streaming audio latency (<150ms)'
        ],
        cons: [
            'Audio synthesis only; no text inference'
        ],
        bestFor: 'Voice commentary on trading alerts, audio market briefings',
        recommendedTier: 'Level 7 (Audio/Speech)'
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 2. GROQ (LPU ULTRA-HIGH-SPEED INFERENCE)
    // ═════════════════════════════════════════════════════════════════════════
    {
        id: 'openai/gpt-oss-120b',
        name: 'OpenAI GPT-OSS 120B',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'OpenAI (Hosted on Groq LPUs)',
        architecture: 'Flagship Open-Weight Dense Model with Reasoning',
        parameters: { total: '120B', active: '120B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '65,536 tokens',
        speed: '~500 tokens/sec',
        pricing: 'Free Tier ($0.15 in / $0.60 out paid)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (RPD) & Rolling 1m (TPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '8,000 TPM',
            tpd: '200,000 TPD'
        },
        pros: [
            'OpenAI flagship 120B open model running at unprecedented 500 tps on Groq LPUs',
            'Native browser search, Python code execution, and deep reasoning capabilities',
            'Huge 65K max completion capacity for exhaustive quantitative research reports',
            'Generates deep financial theses in 2–3 seconds that take 30s on standard GPUs'
        ],
        cons: [
            'Free tier 8,000 TPM limit requires concise input prompt batching',
            '1,000 requests per day cap on free plan'
        ],
        bestFor: 'Level 5 Deep Reasoner, Future Vision OHLCV generation, multi-factor synthesis',
        recommendedTier: 'Level 5 (Elite Reasoner)'
    },
    {
        id: 'openai/gpt-oss-20b',
        name: 'OpenAI GPT-OSS 20B',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'OpenAI (Hosted on Groq LPUs)',
        architecture: 'High-Efficiency Open-Weight Model',
        parameters: { total: '20B', active: '20B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '65,536 tokens',
        speed: '~1,000 tokens/sec (Record)',
        pricing: 'Free Tier ($0.075 in / $0.30 out paid)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (RPD) & Rolling 1m (TPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '8,000 TPM',
            tpd: '200,000 TPD'
        },
        pros: [
            'Astonishing ~1,000 tokens/second speed — responses appear almost instantly',
            'Massive 65.5K output token limit despite small 20B footprint',
            'Full 131K context window with strong reasoning fidelity'
        ],
        cons: [
            '8K TPM free limit still applies across Groq free accounts',
            'Lower extreme quantitative edge compared to the 120B variant'
        ],
        bestFor: 'Instant manual analysis chat, real-time live card insights, interactive Q&A',
        recommendedTier: 'Level 2 / Level 3 (Standard / Advanced)'
    },
    {
        id: 'openai/gpt-oss-safeguard-20b',
        name: 'GPT-OSS Safeguard 20B',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'OpenAI (Hosted on Groq LPUs)',
        architecture: 'Dedicated Safety & Policy Evaluation Model',
        parameters: { total: '20B', active: '20B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '65,536 tokens',
        speed: '~1,000 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC & Rolling 1m',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '8,000 TPM',
            tpd: '200,000 TPD'
        },
        pros: [
            'Instant safety and hallucination classification at 1,000 tps',
            'Safeguards trading order executions against malicious prompts'
        ],
        cons: [
            'Safety-tuned; not for creative analysis'
        ],
        bestFor: 'Pre-flight trade order validation, prompt safety verification',
        recommendedTier: 'Security / Safeguard'
    },
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Meta AI (Hosted on Groq LPUs)',
        architecture: 'Dense General-Purpose Frontier LLM',
        parameters: { total: '70B', active: '70B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '32,768 tokens',
        speed: '~280 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC & Rolling 1m',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '6,000 TPM',
            tpd: '100,000 TPD'
        },
        pros: [
            'Industry gold standard for general reasoning, tone, and financial understanding',
            'Runs at smooth 280 tps on Groq LPUs with zero jitter',
            'Outstanding at synthesizing conflicting market data into actionable conclusions'
        ],
        cons: [
            'Slightly lower TPM limit on free tier (6K TPM) requiring concise prompts'
        ],
        bestFor: 'Page synthesis, comprehensive multi-card aggregation, executive briefings',
        recommendedTier: 'Level 3 / Level 4 (Advanced / Expert)'
    },
    {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Meta AI (Hosted on Groq LPUs)',
        architecture: 'Compact Dense High-Speed LLM',
        parameters: { total: '8B', active: '8B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '131,072 tokens',
        speed: '~560 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC & Rolling 1m',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '14,400 RPD',
            tpm: '30,000 TPM',
            tpd: '500,000 TPD'
        },
        pros: [
            'Massive daily quota: 14,400 RPD and 500,000 TPD on free tier!',
            'Super-fast 560 tokens/sec generation with full 131K context',
            'Highest reliability tier on Groq with almost zero downtime'
        ],
        cons: [
            'Smaller 8B parameter capacity lacks deep non-linear derivatives reasoning'
        ],
        bestFor: 'High-frequency card insight generation, automated background refresh loops',
        recommendedTier: 'Level 1 (Fast Tasks)'
    },
    {
        id: 'groq/compound',
        name: 'Groq Compound (Agentic)',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Groq AI Systems',
        architecture: 'Multi-Model Agentic System with Web Search & Python Sandbox',
        parameters: { total: 'Compound Ensemble', active: 'Dynamic MoE' },
        contextWindow: '131,072 (131K)',
        maxOutput: '8,192 tokens',
        speed: '~450 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC (250 RPD limit)',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '250 RPD',
            tpm: '70,000 TPM',
            tpd: 'Dynamic'
        },
        pros: [
            'Intelligently uses built-in tools: live Google search & Python code execution',
            'Huge 70,000 TPM limit enables deep web-grounded research prompts',
            'Blazing ~450 tps speed even with active tool orchestration loops'
        ],
        cons: [
            'Capped at 250 requests per day on free plan'
        ],
        bestFor: 'Real-time financial news catalyst research, live breaking news verification',
        recommendedTier: 'Level 4 (Web Agent / Synthesis)'
    },
    {
        id: 'groq/compound-mini',
        name: 'Groq Compound Mini',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Groq AI Systems',
        architecture: 'Lightweight Agentic System with Integrated Tool Use',
        parameters: { total: 'Compound Mini', active: 'Fast Dispatch' },
        contextWindow: '131,072 (131K)',
        maxOutput: '8,192 tokens',
        speed: '~450 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '250 RPD',
            tpm: '70,000 TPM',
            tpd: 'Dynamic'
        },
        pros: [
            'Rapid tool use and live search integration for quick fact checks',
            'Generous 70K TPM rate limit pool'
        ],
        cons: [
            '250 RPD ceiling on free tier'
        ],
        bestFor: 'Quick catalyst verification, macroeconomic rate lookup',
        recommendedTier: 'Level 2 / Level 4 (Standard / Agent)'
    },
    {
        id: 'qwen/qwen3.6-27b',
        name: 'Qwen 3.6 27B',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Alibaba Cloud (Hosted on Groq)',
        architecture: 'Dense Multilingual LLM (27B)',
        parameters: { total: '27B', active: '27B Dense' },
        contextWindow: '131,072 (131K)',
        maxOutput: '16,384 tokens',
        speed: '~500 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC & Rolling 1m',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '8,000 TPM',
            tpd: '200,000 TPD'
        },
        pros: [
            'Top-tier mathematical accuracy and coding benchmark results',
            'Supports 20MB file size uploads natively through Groq API',
            'High 500 tps throughput on Groq hardware'
        ],
        cons: [
            '16K completion token limit'
        ],
        bestFor: 'Technical indicator mathematical verification, quantitative pattern parsing',
        recommendedTier: 'Level 3 (Advanced Math)'
    },
    {
        id: 'qwen/qwen3.8-27b',
        name: 'Qwen 3.8 27B',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Alibaba Cloud (Hosted on Groq)',
        architecture: 'Enhanced Multilingual LLM (27B)',
        parameters: { total: '27B', active: '27B Dense' },
        contextWindow: '131,042 (131K)',
        maxOutput: '16,384 tokens',
        speed: '~450 tokens/sec',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC & Rolling 1m',
        resetType: 'hybrid',
        limits: {
            rpm: '30 RPM',
            rpd: '1,000 RPD',
            tpm: '8,000 TPM',
            tpd: '200,000 TPD'
        },
        pros: [
            'Advanced multi-step reasoning capabilities with Asian & global market depth',
            'Handles structured JSON outputs with exceptional precision',
            '20MB input context file support'
        ],
        cons: [
            '8K TPM free tier ceiling'
        ],
        bestFor: 'Global Macro correlation, Future Vision validation fallback',
        recommendedTier: 'Level 3 / Level 4 (Advanced / Expert)'
    },
    {
        id: 'minimaxai/minimax-m2.7',
        name: 'MiniMax M2.7',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'MiniMax (Hosted on Groq)',
        architecture: 'High-Capacity MoE Long-Context Model',
        parameters: { total: 'High-Density MoE', active: 'Dynamic' },
        contextWindow: '196,608 (196K)',
        maxOutput: '131,072 tokens (131K)',
        speed: '~260 tokens/sec',
        pricing: 'Preview Tier (Free Evaluation)',
        refreshSchedule: 'Daily @ 12:00 AM UTC',
        resetType: 'daily',
        limits: {
            rpm: '20 RPM',
            rpd: '500 RPD',
            tpm: '50K TPM',
            concurrency: '3 in-flight'
        },
        pros: [
            'Huge 196K context window with colossal 131K output token capacity',
            'Outstanding long-form conversational coherence and filing extraction'
        ],
        cons: [
            'Preview evaluation status; may undergo periodic API updates'
        ],
        bestFor: 'Annual report (10-K) parsing, exhaustive prospectus summarization',
        recommendedTier: 'Level 4 (Expert Long-Context)'
    },
    {
        id: 'whisper-large-v3-turbo',
        name: 'Whisper Large V3 Turbo',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'OpenAI (Hosted on Groq)',
        architecture: 'Neural Speech Recognition & Transcription Engine',
        parameters: { total: 'Large V3 Turbo', active: 'Audio Kernel' },
        contextWindow: 'Real-time Audio Stream',
        maxOutput: 'Verbatim Text / Subtitles',
        speed: 'Real-time Turbo (<200ms latency)',
        pricing: 'Free Tier ($0.04/hr paid)',
        refreshSchedule: 'Hourly Rolling (400K ASH) & Daily (400 RPM)',
        resetType: 'hourly',
        limits: {
            rpm: '400 RPM',
            rpd: '2,000 RPD',
            ash: '400,000 ASH (Audio Sec/Hr)',
            concurrency: '10 in-flight'
        },
        pros: [
            'Ultra-fast audio transcription on Groq hardware',
            'Massive 400K audio seconds/hour limit; handles lengthy earnings calls easily'
        ],
        cons: [
            'Strictly an audio-to-text model'
        ],
        bestFor: 'Live earnings call transcription, voice command trading inputs',
        recommendedTier: 'Level 7 (Audio Transcription)'
    },
    {
        id: 'meta-llama/llama-prompt-guard-2-86m',
        name: 'Llama Prompt Guard 2 86M',
        provider: 'Groq',
        providerKey: 'groq',
        maker: 'Meta AI (Hosted on Groq)',
        architecture: 'Micro Security Classifier (86M)',
        parameters: { total: '86M', active: '86M' },
        contextWindow: '512 tokens',
        maxOutput: '512 tokens',
        speed: 'Near Instant (>2,000 tps)',
        pricing: 'Free Tier',
        refreshSchedule: 'Daily @ 12:00 AM UTC (14.4K RPD)',
        resetType: 'daily',
        limits: {
            rpm: '30 RPM',
            rpd: '14,400 RPD',
            tpm: '15,000 TPM',
            tpd: '500,000 TPD'
        },
        pros: [
            'Protects application against prompt injection, jailbreaks, and unsafe commands',
            'Massive 14.4K RPD quota with sub-5ms latency'
        ],
        cons: [
            '512 token context limit'
        ],
        bestFor: 'Chat input sanitization, automated security filter before LLM processing',
        recommendedTier: 'Security / Guardrail'
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 3. GOOGLE GEMINI (FREE TIER RATE LIMITS)
    // ═════════════════════════════════════════════════════════════════════════
    {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'Next-Gen Frontier Multimodal Flash',
        parameters: { total: 'High-Scale MoE', active: 'Optimized' },
        contextWindow: '1,000,000+ (1M)',
        maxOutput: '16,384 tokens',
        speed: 'High-Speed Multimodal',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (20 RPD) & Rolling 1m (5 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '5 RPM',
            rpd: '20 RPD',
            tpm: '250,000 TPM',
            concurrency: '2 in-flight'
        },
        pros: [
            'State-of-the-art Google DeepMind reasoning, math, and chart perception',
            'Huge 250,000 TPM token allowance on free tier',
            '1M+ context window seamlessly ingests entire stock histories and news batches'
        ],
        cons: [
            'Strict 20 RPD daily limit on free tier without Google Cloud billing',
            '5 RPM rate limit requires spacing calls 12 seconds apart'
        ],
        bestFor: 'Future Vision OHLCV predictive generation, high-conviction daily market thesis',
        recommendedTier: 'Level 5 (Elite Reasoner)'
    },
    {
        id: 'gemini-3.5-flash-lite',
        name: 'Gemini 3.5 Flash Lite',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'High-Throughput Lightweight Multimodal',
        parameters: { total: 'Lightweight MoE', active: 'Ultra Fast' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '16,384 tokens',
        speed: 'Ultra Fast (<250ms TTFT)',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (500 RPD) & Rolling 1m (15 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '15 RPM',
            rpd: '500 RPD',
            tpm: '250,000 TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            '500 RPD daily limit (25x more requests than standard Flash on free tier!)',
            '15 RPM ceiling allows frequent card updates without 429 throttling',
            'Generous 250K TPM budget with full 1M context window support',
            'Low latency streaming ideal for real-time dashboard responsiveness'
        ],
        cons: [
            'Slightly lower complex mathematical deduction than 3.8 Flash'
        ],
        bestFor: 'High-frequency card insight generation, multi-indicator consensus, header synthesis',
        recommendedTier: 'Level 1 / Level 2 (Fast / Standard)'
    },
    {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'High-Throughput Lightweight Multimodal',
        parameters: { total: 'Lightweight MoE', active: 'Ultra Fast' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '16,384 tokens',
        speed: 'Ultra Fast',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (500 RPD) & Rolling 1m (15 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '15 RPM',
            rpd: '500 RPD',
            tpm: '250,000 TPM',
            concurrency: '4 in-flight'
        },
        pros: [
            'Extremely generous 500 RPD free allocation',
            '15 RPM rate limit handles rapid UI tab switching',
            'Full multimodal capability with fast text output'
        ],
        cons: [
            'Superceded by 3.5 Flash Lite for nuanced text synthesis'
        ],
        bestFor: 'Technical indicator card summaries, options card takeaways',
        recommendedTier: 'Level 1 (Fast Tasks)'
    },
    {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'Frontier Multimodal LLM',
        parameters: { total: 'High-Scale MoE', active: 'Balanced' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '16,384 tokens',
        speed: 'Fast & Highly Intelligent',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (20 RPD) & Rolling 1m (5 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '5 RPM',
            rpd: '20 RPD',
            tpm: '250,000 TPM',
            concurrency: '2 in-flight'
        },
        pros: [
            'Superb multi-modal chart and visual pattern reading',
            '250K TPM limit accommodates massive prompt context batches',
            'Strong quantitative reasoning for stock market anomalies'
        ],
        cons: [
            '20 RPD ceiling on free tier'
        ],
        bestFor: 'Future Vision OHLCV generation, technical chart analysis',
        recommendedTier: 'Level 3 / Level 5 (Advanced / Reasoner)'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'Stable Multimodal LLM',
        parameters: { total: 'Established MoE', active: 'Balanced' },
        contextWindow: '1,000,000 (1M)',
        maxOutput: '8,192 tokens',
        speed: 'Fast',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (20 RPD) & Rolling 1m (5 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '5 RPM',
            rpd: '20 RPD',
            tpm: '250,000 TPM',
            concurrency: '2 in-flight'
        },
        pros: [
            'Rock-solid stability across millions of production deployments',
            'Consistent JSON formatting and structured output compliance'
        ],
        cons: [
            '20 RPD limit on free tier'
        ],
        bestFor: 'Stable fallback for card insight generation and manual analysis',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'gemini-embedding-2',
        name: 'Gemini Embedding 2',
        provider: 'Google Gemini',
        providerKey: 'gemini',
        maker: 'Google DeepMind',
        architecture: 'Multimodal Dense Vector Embedding',
        parameters: { total: 'Embedding Model', active: 'Vector' },
        contextWindow: '2,048 tokens',
        maxOutput: '768-dim Vector',
        speed: 'Instantaneous (<15ms)',
        pricing: 'Free Tier ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (1,000 RPD) & Rolling 1m (100 RPM)',
        resetType: 'hybrid',
        limits: {
            rpm: '100 RPM',
            rpd: '1,000 RPD',
            tpm: '30,000 TPM',
            concurrency: '10 in-flight'
        },
        pros: [
            'Generous 100 RPM and 1,000 RPD on free plan',
            'High semantic accuracy for indexing market documents and trade journals'
        ],
        cons: [
            'Embeddings only; no text generation'
        ],
        bestFor: 'Trade journal similarity search, news catalyst semantic matching',
        recommendedTier: 'Embedding Engine'
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4. Z.AI / GLM (ZHIPU AI — HIGH CONCURRENCY MODEL POOL)
    // ═════════════════════════════════════════════════════════════════════════
    {
        id: 'glm-4.5-flash',
        name: 'GLM-4.5-Flash',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Ultra-Fast Lightweight Mixture-of-Experts',
        parameters: { total: 'Lightweight MoE', active: 'High-Throughput' },
        contextWindow: '128,000 (128K)',
        maxOutput: '4,096 tokens',
        speed: 'Ultra Fast (<200ms TTFT)',
        pricing: 'Free ($0/M)',
        refreshSchedule: 'Daily @ 12:00 AM UTC (100 RPD)',
        resetType: 'daily',
        limits: {
            concurrency: '30 in-flight',
            rpm: '15 RPM',
            rpd: '100 RPD',
            tpm: '100K TPM'
        },
        pros: [
            'Lightweight ultra-fast inference suitable for high-frequency routing',
            '128K context window provides ample room for market and card data ingestion',
            'Full support for rapid classification and preliminary signals'
        ],
        cons: [
            'Less nuanced on deep multi-step quantitative deductions than GLM-4-Plus'
        ],
        bestFor: 'Level 1 Fast classification, quick status checks, initial filtering',
        recommendedTier: 'Level 1 (Fast)'
    },
    {
        id: 'glm-5.3-flash',
        name: 'GLM-5.3-Flash',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Ultra-High Concurrency Mixture-of-Experts',
        parameters: { total: '100B+ MoE', active: 'High-Throughput' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Very Fast Concurrency',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release (Real-Time)',
        resetType: 'concurrency',
        limits: {
            concurrency: '50 in-flight',
            rpm: 'High (Concurrency-bounded)',
            rpd: 'Unlimited (Coding Plan)',
            note: 'Requests >8K context throttled to 1% concurrency on free trial'
        },
        pros: [
            'Massive 50 CONCURRENCY LIMIT — can run 50 parallel requests simultaneously!',
            'Ideal for batch computing insights across all 20+ dashboard cards at once',
            'Zero daily request cap on GLM Coding Plan; instant concurrency release'
        ],
        cons: [
            'Free trial throttles context lengths over 8K to 1% concurrency'
        ],
        bestFor: 'Parallel card insight batching, live ticker multi-factor matrix computation',
        recommendedTier: 'Level 2 / Batch Engine'
    },
    {
        id: 'glm-4-plus',
        name: 'GLM-4-Plus',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Flagship Frontier Reasoning Model',
        parameters: { total: 'Frontier Scale', active: 'Advanced MoE' },
        contextWindow: '128,000 (128K)',
        maxOutput: '16,384 tokens',
        speed: 'Deep Reasoning',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release (Real-Time)',
        resetType: 'concurrency',
        limits: {
            concurrency: '20 in-flight',
            rpm: 'High',
            rpd: 'Unlimited (Coding Plan)'
        },
        pros: [
            'Top-tier flagship intelligence rivaling GPT-4 and Claude 3.5 Sonnet',
            '20 concurrent in-flight requests allows multi-agent deliberations',
            'Strong understanding of global macroeconomics, Asian equity flows, and FII/DII data',
            'Built-in complex tool calling and code reasoning'
        ],
        cons: [
            'Higher execution latency than GLM Flash variants'
        ],
        bestFor: 'Level 5 Deep Reasoning, Page Synthesis, Executive Briefings',
        recommendedTier: 'Level 5 (Elite Reasoner)'
    },
    {
        id: 'glm-4-32b-0414-128k',
        name: 'GLM-4-32B-128K',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Dense Intermediate LLM (32B)',
        parameters: { total: '32B', active: '32B Dense' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Fast & Consistent',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '15 in-flight',
            rpm: 'High',
            rpd: 'Unlimited'
        },
        pros: [
            '15 concurrent requests with generous 128K context window',
            'Dense 32B model delivers high factual accuracy without MoE router variance'
        ],
        cons: [
            '8K completion limit'
        ],
        bestFor: 'Technical analysis explanations, automated trading journal insights',
        recommendedTier: 'Level 3 (Advanced)'
    },
    {
        id: 'glm-5.2',
        name: 'GLM-5.2',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Next-Gen Advanced LLM',
        parameters: { total: 'Next-Gen Scale', active: 'Optimized' },
        contextWindow: '128,000 (128K)',
        maxOutput: '16,384 tokens',
        speed: 'High-Throughput Reasoning',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '10 in-flight',
            rpm: 'High',
            rpd: 'Unlimited'
        },
        pros: [
            '10 concurrent slots for advanced quantitative synthesis',
            'Strong logical chain-of-thought deductions and economic trend forecasting'
        ],
        cons: [
            'Slightly lower concurrency than Flash (10 vs 50)'
        ],
        bestFor: 'Future Vision secondary validation, market regime classification',
        recommendedTier: 'Level 4 / Level 5 (Expert / Reasoner)'
    },
    {
        id: 'glm-5.1',
        name: 'GLM-5.1',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Next-Gen LLM',
        parameters: { total: 'Next-Gen Scale', active: 'Optimized' },
        contextWindow: '128,000 (128K)',
        maxOutput: '16,384 tokens',
        speed: 'Fast Reasoning',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '10 in-flight',
            rpm: 'High',
            rpd: 'Unlimited'
        },
        pros: [
            '10 concurrent in-flight slots',
            'Balanced performance for multi-page synthesis'
        ],
        cons: [
            'Superceded by GLM-5.2 for pure math density'
        ],
        bestFor: 'Sector rotation analysis, options chain synthesis',
        recommendedTier: 'Level 3 (Advanced)'
    },
    {
        id: 'glm-4.6v',
        name: 'GLM-4.6V (Vision)',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Multimodal Vision-Language Model',
        parameters: { total: 'Vision MoE', active: 'Multimodal' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Fast Visual Analysis',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '10 in-flight',
            rpm: 'High',
            rpd: 'Unlimited'
        },
        pros: [
            '10 concurrent visual inspection slots',
            'Reads high-resolution stock charts, candlestick patterns, and financial tables with high OCR precision'
        ],
        cons: [
            'Higher token latency for dense 4K image uploads'
        ],
        bestFor: 'Chart image verification, visual pattern detection confirmation',
        recommendedTier: 'Level 6 (Vision Model)'
    },
    {
        id: 'glm-4.5-air',
        name: 'GLM-4.5-Air',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Lightweight Balanced Model',
        parameters: { total: 'Air Architecture', active: 'Lightweight' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Swift',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '5 in-flight',
            rpm: 'Standard',
            rpd: 'Unlimited'
        },
        pros: [
            'Cost-effective and lightweight fallback for general-purpose chat',
            'Stable formatting and reliable latency'
        ],
        cons: [
            '5 concurrency slots'
        ],
        bestFor: 'Manual chat queries, lightweight portfolio notes',
        recommendedTier: 'Level 2 (Standard)'
    },
    {
        id: 'glm-4.7-flashx',
        name: 'GLM-4.7-FlashX',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Experimental Low-Latency MoE',
        parameters: { total: 'FlashX MoE', active: 'Ultra Fast' },
        contextWindow: '128,000 (128K)',
        maxOutput: '8,192 tokens',
        speed: 'Instantaneous (<180ms TTFT)',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '3 in-flight',
            rpm: 'High',
            rpd: 'Unlimited'
        },
        pros: [
            'Extremely low time-to-first-token (<180ms)',
            'Quick burst responses for instant tool executions'
        ],
        cons: [
            '3 concurrency limit requires sequential processing'
        ],
        bestFor: 'Real-time alert ticker generation, instant keyboard shortcut queries',
        recommendedTier: 'Level 1 (Fast)'
    },
    {
        id: 'glm-ocr',
        name: 'GLM-OCR',
        provider: 'Z.AI (GLM)',
        providerKey: 'zai',
        maker: 'Zhipu AI',
        architecture: 'Specialized Optical Character Recognition Model',
        parameters: { total: 'OCR Engine', active: 'Vision Text' },
        contextWindow: '8,192 tokens',
        maxOutput: '4,096 tokens',
        speed: 'High-Precision OCR',
        pricing: 'Free / Coding Plan',
        refreshSchedule: 'Instant Concurrency Release',
        resetType: 'concurrency',
        limits: {
            concurrency: '2 in-flight',
            rpm: 'Standard',
            rpd: 'Unlimited'
        },
        pros: [
            'Pixel-level optical character recognition for printed broker contract notes & financial receipts',
            'Detects skewed text and complex table structures'
        ],
        cons: [
            'Strictly an OCR extraction tool'
        ],
        bestFor: 'Broker contract note parsing, physical trade statement digitization',
        recommendedTier: 'Utility / OCR'
    }
];

export const PROVIDER_OPTIONS = [
    { id: 'all', label: 'All Models', count: MODEL_CATALOG.length },
    { id: 'openrouter', label: 'OpenRouter', count: MODEL_CATALOG.filter(m => m.providerKey === 'openrouter').length },
    { id: 'groq', label: 'Groq LPU', count: MODEL_CATALOG.filter(m => m.providerKey === 'groq').length },
    { id: 'gemini', label: 'Google Gemini', count: MODEL_CATALOG.filter(m => m.providerKey === 'gemini').length },
    { id: 'zai', label: 'Z.AI (GLM)', count: MODEL_CATALOG.filter(m => m.providerKey === 'zai').length }
];
