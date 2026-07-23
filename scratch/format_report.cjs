const fs = require('fs');
const results = require('C:\\project\\ALLBACKUP\\Praxis\\scratch\\search_results.json');
const grouped = {};
results.forEach(r => {
    if (!grouped[r.file]) grouped[r.file] = [];
    grouped[r.file].push(r);
});
let output = '';
for (const file in grouped) {
    if (file.includes('scratch\\') || file.includes('wire_grids') || file.includes('wire_tech_opts') || file.includes('.db') || file.includes('.wal')) continue;
    output += '\n--- ' + file + ' ---\n';
    grouped[file].forEach(r => {
        output += `[L${r.line}] ${r.content}\n`;
    });
}
fs.writeFileSync('C:\\project\\ALLBACKUP\\Praxis\\scratch\\clean_search_report.txt', output, 'utf8');
