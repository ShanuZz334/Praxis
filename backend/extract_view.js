import fs from 'fs';

const transcript = fs.readFileSync('C:\\Users\\shanif\\.gemini\\antigravity\\brain\\8079e513-2699-4689-a0b7-c905a8c792e3\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

let lastViewFile = null;

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if (tc.name === 'view_file' && tc.args.AbsolutePath.includes('AdvancedCandlestickChart.jsx')) {
                    lastViewFile = i;
                }
            }
        }
        if (obj.type === 'ENVIRONMENT_RESPONSE' && lastViewFile !== null) {
            if (i === lastViewFile + 1 || i === lastViewFile + 2) {
                // Remove line numbers from the start of each line
                const contentLines = obj.content.split('\n');
                const cleanLines = contentLines.map(line => {
                    return line.replace(/^\d+:\s?/, '');
                });
                fs.writeFileSync(`c:/project/ALLBACKUP/Praxis/backend/chart_viewed_${i}.jsx`, cleanLines.join('\n'));
                console.log(`Extracted view_file at step ${i}`);
            }
            lastViewFile = null;
        }
    } catch (e) {
    }
}
