const fs = require('fs');

// Clean CARD_INVENTORY.md
const md = 'C:\\project\\ALLBACKUP\\Praxis\\CARD_INVENTORY.md';
let cMd = fs.readFileSync(md, 'utf8');
const newCmd = cMd.split('\n').filter(line => !line.includes('fno_ban')).join('\n');
fs.writeFileSync(md, newCmd);
console.log('Cleaned CARD_INVENTORY.md');

// Clean seed_round5_options.mjs
const seed = 'C:\\project\\ALLBACKUP\\Praxis\\backend\\scripts\\seed_round5_options.mjs';
let cSeed = fs.readFileSync(seed, 'utf8');
const target = "targetId: 'fno_ban'";
if (cSeed.includes(target)) {
    console.log('Found fno_ban in seed_round5_options.mjs, removing...');
    cSeed = cSeed.replace(/\s*\{\s*targetId:\s*'fno_ban'[\s\S]*?\}\s*,?/g, '');
    cSeed = cSeed.replace(/\/\/ MAX PAIN & F&O BAN/g, '// MAX PAIN');
    fs.writeFileSync(seed, cSeed);
}
