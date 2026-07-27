import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
const User = (await import('./models/User.js')).default;
const user = await User.findOne({ email: 'shanifshaz546@gmail.com' }).lean();
const token = user.activeToken || jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
await mongoose.disconnect();

// Generate a massive mock contextData object to simulate the 40+ cards
const massiveContext = { pageSnapshot: {} };
for (let i = 0; i < 50; i++) {
    massiveContext.pageSnapshot[`card_${i}`] = {
        cardId: `card_${i}`,
        displayName: `Indicator ${i}`,
        value: Math.random() * 100,
        score: Math.round(Math.random() * 100),
        signal: 'BULLISH',
        weight: 1.0,
        additionalContext: "This is a very long string that represents the AI insight generated previously for this card. ".repeat(10)
    };
}

console.log(`Payload size: ${JSON.stringify(massiveContext).length} characters`);
console.log('Hitting live server for qchat_fundamentals with massive payload...');
const startTime = Date.now();
const response = await fetch('http://localhost:5000/api/v1/ai-prompts/chat/qchat_fundamentals', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        message: "hello",
        scope: 'page',
        contextData: massiveContext
    })
});

console.log(`HTTP ${response.status} in ${Date.now() - startTime}ms`);
console.log(await response.text());
