const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

// We need to find the technicals API call and inject ltp
const searchStr = 'const techRes = await axiosInstance.get(`/api/v1/upstox/technicals?instrument=${selectedInstrument}&timeframe=day`);';

if (content.includes(searchStr)) {
    content = content.replace(searchStr, `const currentLtp = livePrices?.[selectedInstrument]?.ltp || '';
                    const techRes = await axiosInstance.get(\`/api/v1/upstox/technicals?instrument=\${selectedInstrument}&timeframe=day&ltp=\${currentLtp}\`);`);
    fs.writeFileSync(file, content);
    console.log("Successfully injected ltp to tech API call in useMasterComposite!");
} else {
    console.log("Could not find the techRes API call line!");
}
