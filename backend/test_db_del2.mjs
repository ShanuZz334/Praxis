import Database from 'better-sqlite3'; const db = new Database('local_data/praxis_market.db'); db.prepare('DELETE FROM header_data WHERE instrument_key = \'NIFTY\'').run(); console.log('Deleted');
