const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

// We will just regex replace the block
content = content.replace(/const activeCounts = {[\s\S]*?events: dbFallbackData\?\.events\?\.counts\s*};/, `const mergedTech = { ...(dbFallbackData?.technical?.counts || {}), ...(techEngine?.cardScores || {}) };
        const mergedFund = { ...(dbFallbackData?.fundamental?.counts || {}), ...(fundEngine?.cardScores || {}) };
        const mergedOpt = { ...(dbFallbackData?.options?.counts || {}), ...(optionsEngine?.cardScores || {}) };

        const activeCounts = {
            fundamental: parseEngineCounts(mergedFund, 'FUND'),
            technical: parseEngineCounts(mergedTech, 'TECH'),
            options: parseEngineCounts(mergedOpt, 'OPT'),
            global: dbFallbackData?.global?.counts,
            events: dbFallbackData?.events?.counts
        };`);

fs.writeFileSync(file, content);
console.log("Successfully restored perfect merge logic!");
