const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

const target1 = `        // Ensure total missing covers exactly the expected cards based on instrument type
        // as per the latest Fundamental changes: 73 for Indices, 87 for Companies.
        const totalPossibleCards = isIndex ? 73 : 87;
        let totalMissing = Math.max(0, totalPossibleCards - (totalBulls + totalBears + totalNeutrals));`;

const target2 = `        // ==========================================
        // INSTITUTIONAL MASTER DRIVER ALGORITHM (SECTION LEVEL)
        // ==========================================`;

content = content.replace(target1, "");
content = content.replace(target2, `        const totalMissing = Object.keys(missingBreakdown).length;

        // ==========================================
        // INSTITUTIONAL MASTER DRIVER ALGORITHM (SECTION LEVEL)
        // ==========================================`);

fs.writeFileSync(file, content);
console.log("Successfully fixed totalMissing calculation!");
