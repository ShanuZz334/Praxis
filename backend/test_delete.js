import db from './config/localDb.js';
db.prepare("DELETE FROM quotes WHERE instrument_key='NSE_INDEX|Nifty 50'").run();
console.log('Deleted');
process.exit();
