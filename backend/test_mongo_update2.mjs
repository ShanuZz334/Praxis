import mongoose from 'mongoose';
import { config } from 'dotenv';
config({path: '.env'});
import Instrument from './models/Instrument.js';
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Instrument.updateOne({ tradingSymbol: 'HDFCBANK' }, { $set: { instrumentKey: 'NSE_EQ|INE040A01034', tradingSymbol: 'HDFCBANK', isin: 'INE040A01034' } });
  console.log('Updated to INE...');
  process.exit(0);
});
