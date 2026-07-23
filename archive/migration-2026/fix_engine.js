const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the import
content = content.replace(
    'import { useOptionsCompositeScore } from \'../../options/engine/useOptionsCompositeScore\';',
    'import { useOptionsCompositeScore } from \'../../options/engine/useOptionsCompositeScore\';\nimport { computeInstitutionalComposite } from \'./masterScoringEngine\';'
);

// 2. Fix the signature
content = content.replace(
    'export function useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices) {',
    'export function useMasterComposite(selectedInstrument, isIndex, selectedExpiry, livePrices, extraData = {}) {'
);

// 3. Fix the institutional calculation
content = content.replace(
    'let praxisComposite = 50;\n        if (validScores.length > 0) {\n            praxisComposite = validScores.reduce((acc, curr) => acc + curr.rawScore, 0) / validScores.length;\n        }',
    'const moduleScoreMap = { TECH: techScore, OPT: optScore, FUND: fundScore, GLOB: globScore, EVT: evtScore };\n        const institutionalData = computeInstitutionalComposite(moduleScoreMap, extraData);\n        let praxisComposite = institutionalData.compositeScore;'
);

// 4. Fix the activeCounts mapping
content = content.replace(
    'fundamental: parseEngineCounts(rawFundamentals, \'FUND\') || dbFallbackData?.fundamental?.counts,',
    'fundamental: parseEngineCounts(fundEngine?.cardScores, \'FUND\') || dbFallbackData?.fundamental?.counts,'
);
content = content.replace(
    'technical: parseEngineCounts(rawTechnicals, \'TECH\') || dbFallbackData?.technical?.counts,',
    'technical: parseEngineCounts(techEngine?.cardScores, \'TECH\') || dbFallbackData?.technical?.counts,'
);

// 5. Fix the return block to include modifierImpact
content = content.replace(
    'praxisComposite: Math.round(praxisComposite),',
    'praxisComposite: Math.round(praxisComposite),\n            modifierImpact: institutionalData.modifierImpact,'
);

fs.writeFileSync(file, content);
console.log('Fixes applied successfully!');
