import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import AiProvider from './models/AiProvider.js';
import { decrypt } from './ai-gateway/utils/encryption.js';

async function testAll() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Testing Providers\n");

    const providers = await AiProvider.find({ isActive: true }).lean();
    
    for (const p of providers) {
        console.log(`Testing [${p.displayName}]...`);
        let apiKey = p.apiKey ? decrypt(p.apiKey) : '';
        const url = p.baseUrl || '';

        const modelToTest = p.models?.tier1_simple || p.models?.tier2_medium || p.models?.tier3_complex || 'qwen2.5:3b';
        
        const payload = {
            model: modelToTest,
            messages: [{ role: 'user', content: 'Say hello in 1 word.' }],
            max_tokens: 10
        };

        const fetchUrl = p.providerId === 'ollama' ? `${url}/api/generate` : (url.endsWith('/chat/completions') ? url : `${url}/chat/completions`);
        const fetchPayload = p.providerId === 'ollama' ? { model: modelToTest, prompt: 'Say hello in 1 word.', stream: false } : payload;
        
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const startTime = Date.now();
        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(fetchPayload)
            });

            if (!response.ok) {
                const text = await response.text();
                console.log(`❌ FAILED: Status ${response.status} - ${text.substring(0, 150)}`);
            } else {
                const data = await response.json();
                let output = '';
                if (p.providerId === 'ollama') {
                    output = data.response;
                } else {
                    output = data.choices[0].message.content;
                }
                console.log(`✅ SUCCESS (${Date.now() - startTime}ms): Response: "${output.trim()}"`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        console.log('-----------------------------------\n');
    }

    process.exit(0);
}

testAll().catch(console.error);
