import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

import AiProvider from '../models/AiProvider.js';

process.env.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
const secretKey = process.env.ENCRYPTION_SECRET;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey.substring(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function migrate() {
    console.log("Starting Migration...");
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('ENCRYPTION_SECRET=')) {
        console.log(`Writing new ENCRYPTION_SECRET to .env: ${secretKey}`);
        envContent += `\nENCRYPTION_SECRET=${secretKey}\n`;
        fs.writeFileSync(envPath, envContent);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const providers = [
        {
            providerId: 'groq',
            displayName: 'Groq',
            apiKey: process.env.GROQ_API_KEY,
            baseUrl: 'https://api.groq.com/openai/v1',
            priority: 1,
            supportedTiers: ['1', '2'],
            models: {
                tier1_simple: 'llama-3.1-8b-instant',
                tier2_medium: 'llama-3.3-70b-versatile'
            }
        },
        {
            providerId: 'gemini',
            displayName: 'Google Gemini',
            apiKey: process.env.GEMINI_API_KEY,
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            priority: 2,
            supportedTiers: ['1', '2', '3', '4'],
            models: {
                tier1_simple: 'gemini-2.5-flash-lite',
                tier2_medium: 'gemini-2.5-flash',
                tier3_complex: 'gemini-2.5-flash',
                tier4_vision: 'gemini-2.5-flash'
            }
        },
        {
            providerId: 'openrouter',
            displayName: 'OpenRouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            baseUrl: 'https://openrouter.ai/api/v1',
            priority: 3,
            supportedTiers: ['2', '3'],
            models: {
                tier2_medium: 'meta-llama/llama-3.3-70b-instruct:free',
                tier3_complex: 'deepseek/deepseek-r1-distill-llama-70b:free'
            }
        },
        {
            providerId: 'ollama',
            displayName: 'Local Ollama',
            apiKey: '', 
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            priority: 0,
            supportedTiers: ['1', '3'],
            models: {
                tier1_simple: 'qwen2.5:3b',
                tier3_complex: 'qwen2.5:7b'
            }
        }
    ];

    for (const p of providers) {
        if (!p.apiKey && p.providerId !== 'ollama') {
            console.log(`Skipping ${p.providerId} (No API key found in .env)`);
            continue;
        }

        const encryptedKey = p.apiKey ? encrypt(p.apiKey) : '';

        await AiProvider.findOneAndUpdate(
            { providerId: p.providerId },
            {
                $set: {
                    displayName: p.displayName,
                    apiKey: encryptedKey,
                    baseUrl: p.baseUrl,
                    priority: p.priority,
                    supportedTiers: p.supportedTiers,
                    models: p.models,
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
        console.log(`Migrated ${p.providerId}`);
    }

    console.log("Migration complete.");
    process.exit(0);
}

migrate().catch(console.error);
