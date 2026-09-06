import Database from 'better-sqlite3'; const db = new Database('local_data/praxis_market.db'); console.log(db.prepare('SELECT state_json FROM page_state').all());
