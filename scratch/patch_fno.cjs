const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\options\\ui\\FnOBanCard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            data={{
                currentValueObj: { 
                    label: 'Status', 
                    value: isBanned ? 'BANNED' : 'ACTIVE' 
                },
                details: [
                    mwplPct !== null && { label: 'MWPL', value: \`\${mwplPct.toFixed(1)}%\`, isManual: false },
                    isBanned && { label: 'Days in Ban', value: daysInBan.toString(), isManual: false },
                ].filter(Boolean),`;

const replaceStr = `            data={{
                currentValueObj: { 
                    label: 'Status', 
                    value: mwplPct === null ? '--' : (isBanned ? 'BANNED' : 'ACTIVE') 
                },
                details: [
                    { label: 'MWPL', value: mwplPct !== null ? \`\${mwplPct.toFixed(1)}%\` : '--', isManual: true },
                    { label: 'Days in Ban', value: mwplPct !== null ? daysInBan.toString() : '--', isManual: true },
                ],`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
} else {
    // line endings
    const t2 = targetStr.replace(/\n/g, '\r\n');
    const r2 = replaceStr.replace(/\n/g, '\r\n');
    if (content.includes(t2)) {
        content = content.replace(t2, r2);
    } else {
        console.log('Target string not found');
        process.exit(1);
    }
}
fs.writeFileSync(file, content);
console.log('Patched FnOBanCard');
