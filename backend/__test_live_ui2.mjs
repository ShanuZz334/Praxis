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

console.log('Hitting live server...');
const response = await fetch('http://localhost:5000/api/v1/ai-prompts/chat/master_qchat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        message: "hello",
        scope: 'page',
        contextData: null
    })
});

console.log(`HTTP ${response.status}`);
console.log(await response.text());
