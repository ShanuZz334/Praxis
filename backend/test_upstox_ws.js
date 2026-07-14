import { connectUpstoxWebsocket } from './services/upstoxWebsocket.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Mongo connected, starting WS...");
    connectUpstoxWebsocket();
}).catch(e => console.error(e));
