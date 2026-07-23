const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('C:', 'project', 'ALLBACKUP', 'Praxis', 'backend', 'local_data', 'praxis_market.db');

try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check if ai_card_prompts exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);

    if (tableNames.includes('ai_card_prompts')) {
        console.log('--- ai_card_prompts ---');
        const prompts = db.prepare("SELECT * FROM ai_card_prompts WHERE card_id = 'fno_ban'").all();
        console.log(`Found ${prompts.length} entry/entries for fno_ban in ai_card_prompts`);
    } else {
        console.log('Table ai_card_prompts not found');
    }

    if (tableNames.includes('ai_chat_threads')) {
        console.log('\n--- ai_chat_threads ---');
        const threads = db.prepare("SELECT * FROM ai_chat_threads WHERE context_card_id = 'fno_ban' OR messages LIKE '%fno_ban%' OR messages LIKE '%f&o ban%'").all();
        console.log(`Found ${threads.length} chat thread(s) associated with fno_ban`);
    } else {
        console.log('Table ai_chat_threads not found');
    }

    db.close();
} catch (e) {
    console.error(e);
}
