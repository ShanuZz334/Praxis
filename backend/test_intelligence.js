import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { runFundamentalIntelligence } from './services/intelligenceCron.js';
import { getLatestAiPageSnapshot } from './config/localDb.js';
import Instrument from './models/Instrument.js';

async function test() {
    await connectDB();
    
    // Create a dummy instrument for testing if none exists
    const testInst = await Instrument.findOneAndUpdate(
        { tradingSymbol: "HDFC" },
        { 
            instrumentKey: "NSE_EQ|HDFC", 
            isin: "INE040A01034", 
            instrumentType: "Companies" 
        },
        { upsert: true, new: true }
    );

    console.log("Running fundamental intelligence for", testInst.tradingSymbol);
    await runFundamentalIntelligence();

    console.log("Querying SQLite ai_card_store...");
    const snapshot = getLatestAiPageSnapshot("NSE_EQ|HDFC", "Fundamental");
    
    if (snapshot) {
        console.log("SUCCESS! Snapshot retrieved from SQLite:");
        console.log("- Composite Score:", snapshot.compositeScore);
        console.log("- Number of Sections:", snapshot.sections?.length);
        console.log("- Number of Cards:", snapshot.cards?.length);
        
        if (snapshot.cards && snapshot.cards.length > 0) {
            console.log("Sample Card (PE Ratio):", snapshot.cards.find(c => c.id === 'pe_ratio')?.score);
        }
    } else {
        console.log("FAILED to retrieve snapshot from SQLite.");
    }
    
    process.exit(0);
}

test();
