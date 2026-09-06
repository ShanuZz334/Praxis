import fs from 'fs';

const transcript = fs.readFileSync('C:\\Users\\shanif\\.gemini\\antigravity\\brain\\8079e513-2699-4689-a0b7-c905a8c792e3\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === 'ENVIRONMENT_RESPONSE' && obj.content && obj.content.includes('AdvancedCandlestickChart.jsx')) {
            fs.appendFileSync('c:/project/ALLBACKUP/Praxis/backend/extracted_env.txt', `\n\n=== RESPONSE at ${obj.created_at} ===\n${obj.content.substring(0, 100)}\n`);
            
            // if it looks like a view_file response
            if (obj.content.includes('import React')) {
                fs.writeFileSync(`c:/project/ALLBACKUP/Praxis/backend/chart_backup_${i}.jsx`, obj.content);
            }
        }
    } catch (e) {
    }
}
