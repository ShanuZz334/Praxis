const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

const missingLogic = `
        const mergedTech = safeMerge(dbFallbackData?.technical?.counts, techEngine?.cardScores);
        const mergedFund = safeMerge(dbFallbackData?.fundamental?.counts, fundEngine?.cardScores);
        const mergedOpt = safeMerge(dbFallbackData?.options?.counts, optionsEngine?.cardScores);

        const activeCounts = {
            fundamental: parseEngineCounts(mergedFund, 'FUND', fundEngine?.cards),
            technical: parseEngineCounts(mergedTech, 'TECH', techEngine?.cards),
            options: parseEngineCounts(mergedOpt, 'OPT', optionsEngine?.cards),
            global: parseEngineCounts(Object.fromEntries(Object.entries(globalEngine?.cardData || {}).map(([k, v]) => [k, v?.score])), 'GLOB', globalEngine?.cards) || dbFallbackData?.global?.counts,
            events: dbFallbackData?.events?.counts
        };

        Object.entries(activeCounts).forEach(([engineName, counts]) => {
            if (counts) {
                totalCredits += counts.totalCredits || 0;
                totalBulls += counts.bulls || 0;`;

content = content.replace(
    `            }
            return result;
        };
                totalBears += counts.bears || 0;`,
    `            }
            return result;
        };
` + missingLogic + `
                totalBears += counts.bears || 0;`
);

fs.writeFileSync(file, content);
console.log('Restored missing logic');
