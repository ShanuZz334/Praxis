const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\options\\engine\\useOptionsCompositeScore.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'risks_json: risks\n                }).catch(err => console.error("Failed to sync Options header:", err));',
    'risks_json: risks,\n                    counts_json: cardScores\n                }).catch(err => console.error("Failed to sync Options header:", err));'
);

fs.writeFileSync(file, content);
console.log('Fixes applied successfully!');
