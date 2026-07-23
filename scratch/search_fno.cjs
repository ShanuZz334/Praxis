const fs = require('fs');
const path = require('path');

const rootPath = 'C:\\project\\ALLBACKUP\\Praxis';
const terms = ["F&O Ban", "FO Ban", "FoBan", "fo_ban", "fno_ban", "MWPL", "Market Positioning", "Days in Ban"];
const regex = new RegExp(`(${terms.join('|')})`, 'i');

function searchDir(dir, results) {
    if (dir.includes('node_modules') || dir.includes('build') || dir.includes('archive') || dir.includes('.git') || dir.endsWith('logs')) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath, results);
        } else {
            if (file === 'package-lock.json' || file === 'options_indicators.txt' || file.endsWith('.log')) continue;
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (regex.test(lines[i])) {
                        results.push({
                            file: fullPath.replace(rootPath, ''),
                            line: i + 1,
                            content: lines[i].trim()
                        });
                    }
                }
            } catch (e) {
                // ignore binary
            }
        }
    }
}

const results = [];
searchDir(rootPath, results);

fs.writeFileSync(path.join(rootPath, 'scratch', 'search_results.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('Search complete. Found ' + results.length + ' matches.');
