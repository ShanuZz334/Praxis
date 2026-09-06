import fs from 'fs';

const transcript = fs.readFileSync('C:\\Users\\shanif\\.gemini\\antigravity\\brain\\8079e513-2699-4689-a0b7-c905a8c792e3\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === 'USER_INPUT' && obj.content.includes('AdvancedCandlestickChart.jsx')) {
            fs.appendFileSync('c:/project/ALLBACKUP/Praxis/backend/extracted_user.txt', `\n\n=== USER_INPUT at ${obj.created_at} ===\n${obj.content.substring(0, 500)}\n`);
            
            // Extract the file block
            const match = obj.content.match(/<FILE\[c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\components\\charts\\AdvancedCandlestickChart.jsx\]>([\s\S]*?)<\/FILE/);
            if (match) {
                fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/AdvancedCandlestickChart_original.jsx', match[1].trim());
                console.log("Extracted original file!");
            }
        }
    } catch (e) {
    }
}
