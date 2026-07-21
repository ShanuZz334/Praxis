const fs = require('fs');
let data = JSON.parse(fs.readFileSync('c:\\project\\ALLBACKUP\\Praxis\\compact.json', 'utf8'));

const cardsToUpdate = new Set([
  'sectorearningscard', 'sectorgrowthcard', 'sectorvaluationcard', 
  'sectorconcentrationcard', 'cycdefcard', 'epsyoycard', 
  'forwardepscard', 'earningsrevisioncard', 'profitmargincard'
]);

for (const card of data) {
    if (cardsToUpdate.has(card.cardId)) {
        card.requiredDataFields = ['ratios'];
    }
}

fs.writeFileSync('c:\\project\\ALLBACKUP\\Praxis\\compact.json', JSON.stringify(data, null, 2));
console.log('Updated compact.json');
