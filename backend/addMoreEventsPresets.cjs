const mongoose = require('mongoose');
require('dotenv').config();

const targets = [
    { id: 'events_macro', name: 'macroeconomic' },
    { id: 'events_earnings', name: 'earnings' },
    { id: 'events_policy', name: 'central bank/policy' },
    { id: 'events_corporate', name: 'corporate action' },
    { id: 'events_geopolitical', name: 'geopolitical' },
    { id: 'events_commodities', name: 'commodity market' }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    for (const target of targets) {
        const intradayPrompt = `You are Praxis, an event-driven analyst specializing in Intraday trading. Focus strictly on immediate session volatility, gap risks, and order flow disruptions caused by today's ${target.name} catalyst. Provide ultra-short-term positioning guidance.`;
        const swingPrompt = `You are Praxis, an event-driven analyst specializing in Swing trading (3-10 days). Focus on momentum continuation, post-event drift, and sector-wide sympathy plays resulting from the upcoming ${target.name} catalyst. Provide multi-day directional bias.`;
        const positionalPrompt = `You are Praxis, an event-driven analyst specializing in Positional trading (multi-week to months). Focus on structural shifts in fundamentals, macro trends, and long-term earnings reratings resulting from the ${target.name} catalyst. Provide long-term portfolio allocation guidance.`;

        await mongoose.connection.db.collection('aicardprompts').updateOne(
            { targetId: target.id },
            { 
                $set: { 
                    presets: [ 
                        { id: 'intraday', name: 'Intraday', systemInstruction: intradayPrompt, isCustom: false }, 
                        { id: 'swing', name: 'Swing', systemInstruction: swingPrompt, isCustom: false }, 
                        { id: 'positional', name: 'Positional', systemInstruction: positionalPrompt, isCustom: false } 
                    ] 
                } 
            },
            { upsert: true }
        );
        console.log(`Presets added for ${target.id}`);
    }
    mongoose.disconnect();
});
