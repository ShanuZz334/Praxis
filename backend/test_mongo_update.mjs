import mongoose from 'mongoose';
import { config } from 'dotenv';
config({path: '.env'});
import Instrument from './models/Instrument.js';
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Instrument.updateOne({ instrumentKey: 'NSE_EQ|HDFC' }, { $set: { instrumentKey: 'NSE_EQ|HDFCBANK', tradingSymbol: 'HDFCBANK', isin: 'INE040A01034' } });
  console.log('Updated');
  process.exit(0);
});
