import fs from 'fs';

const transcript = fs.readFileSync('C:\\Users\\shanif\\.gemini\\antigravity\\brain\\8079e513-2699-4689-a0b7-c905a8c792e3\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'run_command' && tc.args.CommandLine && tc.args.CommandLine.includes('Get-Content "c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\components\\charts\\AdvancedCandlestickChart.jsx" -TotalCount')) {
                    console.log("Found run_command!");
                }
            }
        }
        if (obj.content && obj.content.includes('triggerFutureVision')) {
            // Check if it's a tool response
            if (obj.type === 'ENVIRONMENT_RESPONSE') {
                fs.appendFileSync('c:/project/ALLBACKUP/Praxis/backend/extracted_chart.txt', obj.content + "\n=======================\n");
            }
        }
    } catch (e) {
    }
}
