const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\project\\ALLBACKUP\\Praxis\\compact.json', 'utf8'));

const seen = new Map();
let hasDuplicates = false;
for (const card of data) {
  const key = card.cardId;
  if (seen.has(key)) {
    console.warn(`DUPLICATE cardId: ${key} — pages: ${seen.get(key)} and ${card.page}`);
    hasDuplicates = true;
  }
  seen.set(key, card.page);
}

if (!hasDuplicates) {
    console.log("No duplicates found.");
}
