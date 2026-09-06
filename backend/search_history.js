import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\shanif\\AppData\\Roaming\\Code\\User\\History';

function search(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            search(fullPath);
        } else if (file === 'entries.json') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('AdvancedCandlestickChart.jsx')) {
                console.log(`Found entries.json in ${dir}`);
                // read all files in this dir
                const versions = fs.readdirSync(dir);
                for (const v of versions) {
                    if (v !== 'entries.json') {
                        const vContent = fs.readFileSync(path.join(dir, v), 'utf8');
                        if (vContent.includes('triggerFutureVision')) {
                            console.log(`FOUND BACKUP in ${v}`);
                            fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', vContent);
                            process.exit(0);
                        }
                    }
                }
            }
        }
    }
}
search(historyDir);
console.log("Done");
