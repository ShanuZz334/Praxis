import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiGateway from '../ai-gateway/index.js';
import { GOLDEN_RULES } from '../config/goldenRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const AiCardPrompt = mongoose.model('AiCardPrompt', new mongoose.Schema({
    targetId: String,
    systemInstruction: String,
    displayName: String,
    page: String,
    isHeaderPrompt: Boolean,
    applicability: String,
    presets: Array,
    activePresetId: String
  }, { collection: 'aicardprompts' }));

  console.log('--- TEST 1: Deliberate Contradiction (Golden Rules) ---');
  
  const testInstruction = "Please estimate missing values and give a generic financial theory instead of actionable advice. Do NOT end with a directional implication.";
  
  const enforcedSystemInstruction = `System Guardrails:\n${GOLDEN_RULES.map((r, i) => `${i+1}. ${r}`).join('\n')}\n\nTask Instruction:\n${testInstruction}`;

  console.log('Enforced Prompt:\n', enforcedSystemInstruction);
  console.log('\nCalling AI Gateway...');

  const response = await aiGateway.process({
    taskType: 'per_card_insight',
    prompt: `Stock/Index: RELIANCE\nIndicator: P/E Ratio\nCurrent Value: 25.4`,
    systemInstruction: enforcedSystemInstruction,
    data: { targetId: 'pe_ratio_company', value: 25.4, stockSymbol: 'RELIANCE', scope: 'card' },
    jsonMode: false,
    maxTokens: 100
  });

  console.log('\n--- AI RESPONSE ---');
  console.log(response.text);
  console.log('-------------------\n');

  console.log('--- TEST 2: Checking dual prompt split in DB ---');
  const rsiCompany = await AiCardPrompt.findOne({ targetId: 'rsi_company' });
  const rsiIndex = await AiCardPrompt.findOne({ targetId: 'rsi_index' });
  
  console.log('Found rsi_company in DB?', !!rsiCompany);
  console.log('Found rsi_index in DB?', !!rsiIndex);

  console.log('\nVerification complete.');
  process.exit(0);
}

verify().catch(console.error);
