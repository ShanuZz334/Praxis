const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the merge logic to preserve fallbacks if live engine is null/undefined
content = content.replace(
    /const mergedTech = { \.\.\.\(dbFallbackData\?\.technical\?\.counts \|\| {}\), \.\.\.\(techEngine\?\.cardScores \|\| {}\) };\s+const mergedFund = { \.\.\.\(dbFallbackData\?\.fundamental\?\.counts \|\| {}\), \.\.\.\(fundEngine\?\.cardScores \|\| {}\) };\s+const mergedOpt = { \.\.\.\(dbFallbackData\?\.options\?\.counts \|\| {}\), \.\.\.\(optionsEngine\?\.cardScores \|\| {}\) };/,
    `const safeMerge = (fallback, live) => {
            const result = { ...(fallback || {}) };
            if (live) {
                Object.entries(live).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && !isNaN(v) && v !== '--') {
                        result[k] = v;
                    }
                });
            }
            return result;
        };

        const mergedTech = safeMerge(dbFallbackData?.technical?.counts, techEngine?.cardScores);
        const mergedFund = safeMerge(dbFallbackData?.fundamental?.counts, fundEngine?.cardScores);
        const mergedOpt = safeMerge(dbFallbackData?.options?.counts, optionsEngine?.cardScores);`
);

fs.writeFileSync(file, content);
console.log("Successfully fixed merge logic!");
