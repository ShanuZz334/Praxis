const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/let praxisComposite = 50;\s+if \(validScores\.length > 0\) \{\s+praxisComposite = validScores\.reduce\(\(acc, curr\) => acc \+ curr\.rawScore, 0\) \/ validScores\.length;\s+\}/m, `const moduleScoreMap = { TECH: techScore, OPT: optScore, FUND: fundScore, GLOB: globScore, EVT: evtScore };
        const institutionalData = computeInstitutionalComposite(moduleScoreMap, extraData);
        let praxisComposite = institutionalData.compositeScore;`);

fs.writeFileSync(file, content);
console.log("Successfully restored institutional block!");
