import fs from 'fs';

const editsText = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/extracted_edits.txt', 'utf8');
let fileText = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

// The editsText has the exact replacements. The problem is \r\n.
// Let's normalize everything to \n.
const normalizedEdits = editsText.replace(/\r\n/g, '\n');
const normalizedFile = fileText.replace(/\r\n/g, '\n');

const regex = /=== REPLACEMENT at (.*?) ===\nTarget: ([\s\S]*?)\nReplacement: ([\s\S]*?)(?=\n\n=== REPLACEMENT|$)/g;

let newFileText = normalizedFile;
let match;
while ((match = regex.exec(normalizedEdits)) !== null) {
    const target = match[2];
    const replacement = match[3];
    if (newFileText.includes(target)) {
        newFileText = newFileText.replace(target, replacement);
        console.log("Applied edit:", target.substring(0, 30) + '...');
    } else {
        console.log("Failed to find target:", target.substring(0, 30) + '...');
    }
}

fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', newFileText);
console.log("Done.");
