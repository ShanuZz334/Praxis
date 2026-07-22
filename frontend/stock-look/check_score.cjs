const fs = require('fs');
const path = require('path');
const dir = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/fundamentals/ui';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Card.jsx'));
let missingFiles = [];
files.forEach(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    // We only care about data prop inside <IndicatorCard
    const indicatorMatch = content.match(/<IndicatorCard[\s\S]*?data=\{\{([\s\S]*?)\}\}/);
    if (indicatorMatch) {
        if (!indicatorMatch[1].includes('score:')) {
            missingFiles.push(f);
        }
    }
});
console.log(missingFiles.join('\n'));
