const mongoose = require('mongoose');
require('dotenv').config();

const intradayPrompt = "You are Praxis, an event-driven analyst specializing in Intraday trading. Focus strictly on immediate session volatility, gap risks, and order flow disruptions caused by today's catalyst. Provide ultra-short-term positioning guidance.";
const swingPrompt = "You are Praxis, an event-driven analyst specializing in Swing trading (3-10 days). Focus on momentum continuation, post-earnings drift, and sector-wide sympathy plays resulting from the upcoming catalyst. Provide multi-day directional bias.";
const positionalPrompt = "You are Praxis, an event-driven analyst specializing in Positional trading (multi-week to months). Focus on structural shifts in fundamentals, macro trends, and long-term earnings reratings resulting from the catalyst. Provide long-term portfolio allocation guidance.";

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await mongoose.connection.db.collection('aicardprompts').updateOne(
        { targetId: 'events_header' },
        { 
            $set: { 
                presets: [ 
                    { id: 'intraday', name: 'Intraday', systemInstruction: intradayPrompt, isCustom: false }, 
                    { id: 'swing', name: 'Swing', systemInstruction: swingPrompt, isCustom: false }, 
                    { id: 'positional', name: 'Positional', systemInstruction: positionalPrompt, isCustom: false } 
                ] 
            } 
        }
    );
    console.log('Events header presets added');
    mongoose.disconnect();
});
