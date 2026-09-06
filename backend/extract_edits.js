import fs from 'fs';

const transcript = fs.readFileSync('C:\\Users\\shanif\\.gemini\\antigravity\\brain\\8079e513-2699-4689-a0b7-c905a8c792e3\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'replace_file_content' && tc.args.TargetFile.includes('AdvancedCandlestickChart.jsx')) {
                    fs.appendFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/extracted_edits.txt', `\n\n=== REPLACEMENT at ${obj.created_at} ===\nTarget: ${tc.args.TargetContent}\nReplacement: ${tc.args.ReplacementContent}\n`);
                }
            }
        }
    } catch (e) {
    }
}
