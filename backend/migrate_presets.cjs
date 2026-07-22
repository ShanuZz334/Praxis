const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/project/ALLBACKUP/Praxis/backend/.env' });

const aiCardPromptSchema = new mongoose.Schema({ targetId: String, presets: Array }, { strict: false });
const AiCardPrompt = mongoose.model('AiCardPrompt', aiCardPromptSchema, 'aicardprompts');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB. Migrating preset names...');

        const prompts = await AiCardPrompt.find({});
        let updatedCount = 0;

        for (const prompt of prompts) {
            let modified = false;
            if (prompt.presets && Array.isArray(prompt.presets)) {
                for (let i = 0; i < prompt.presets.length; i++) {
                    if (prompt.presets[i].id === 'positional') {
                        prompt.presets[i].id = 'intraday';
                        prompt.presets[i].name = 'Intraday';
                        prompt.presets[i].systemInstruction = prompt.presets[i].systemInstruction.replace('[Mode: Positional Focus]', '[Mode: Intraday Focus]');
                        modified = true;
                    }
                    if (prompt.presets[i].id === 'long') {
                        prompt.presets[i].id = 'position';
                        prompt.presets[i].name = 'Position';
                        prompt.presets[i].systemInstruction = prompt.presets[i].systemInstruction.replace('[Mode: Long-Term Focus]', '[Mode: Position Focus]');
                        modified = true;
                    }
                }
            }
            if (modified) {
                prompt.markModified('presets');
                await prompt.save();
                updatedCount++;
            }
        }
        console.log(`Migration complete. Updated ${updatedCount} records.`);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
