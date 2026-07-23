import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const map = {
  "support_level": "support",
  "resistance_level": "resistance",
  "global_crude_oil": "crude",
  "pivot_points": "pivot",
  "global_dxy": "dxy",
  "global_eur_usd": "eurusd",
  "global_usd_jpy": "usdjpy",
  "global_usd_inr": "usd_inr",
  "global_sp500": "sp_futures",
  "global_nasdaq": "nasdaq_futures",
  "global_dow": "dow_futures",
  "global_nikkei_225": "nikkei",
  "global_ftse_100": "ftse",
  "global_dax_40": "dax",
  "global_hang_seng": "hangseng",
  "global_shanghai": "shanghai",
  "global_cac_40": "cac40",
  "global_eurostoxx_50": "eurostoxx",
  "global_gold": "gold",
  "global_copper": "copper",
  "global_silver": "silver",
  "global_natgas": "natgas",
  "global_wheat": "wheat",
  "global_aluminum": "aluminum",
  "global_us_10y_yield": "us_10y_yield",
  "global_vix": "vix",
  "global_move_index": "move",
  "global_bitcoin": "bitcoin",
  "options_header": "options_company_header",
  "opt_manual": "options_manual",
  "brent_crude": "crude",
  "Master": "praxis_composite_header",
  "master_header": "praxis_composite_header",
  "dashboard": "praxis_composite_header",
  "master_manual": "master_manual_chat",
  "qchat_dashboard": "master_qchat",
  "qchat_global_macros": "master_qchat",
  "fii_dii": "fii_dii_flow_master",
  "market_cap_gdp": "mcap_gdp",
  "qchat_technicals": "qchat_technical"
};

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

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

  const prompts = await AiCardPrompt.find();
  console.log(`Found ${prompts.length} total prompts`);
  
  let migrated = 0;
  let skipped = 0;
  for (const prompt of prompts) {
    if (map[prompt.targetId]) {
      const newTargetId = map[prompt.targetId];
      console.log(`Migrating ${prompt.targetId} -> ${newTargetId}`);
      
      try {
        prompt.targetId = newTargetId;
        await prompt.save();
        migrated++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`Duplicate found for ${newTargetId}, deleting old prompt ${prompt._id}`);
          await AiCardPrompt.deleteOne({ _id: prompt._id });
          skipped++;
        } else {
          throw err;
        }
      }
    }
  }

  console.log(`Migration complete. Updated ${migrated} prompts. Deleted ${skipped} duplicates.`);
  
  const finalCount = await AiCardPrompt.countDocuments();
  console.log(`Final row count: ${finalCount}`);

  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
