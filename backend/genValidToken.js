import mongoose from 'mongoose';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne();
    if (user) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        console.log("TOKEN=" + token);
    } else {
        console.log("NO USERS FOUND");
    }
    mongoose.disconnect();
}
run();
