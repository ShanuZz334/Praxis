const fs = require("fs");
const content = fs.readFileSync("c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = content.split("\n");

// Count opening and closing JSX tags to find imbalance around line 1500
// Look at lines 1450-1510 for unclosed blocks
let depth = 0;
const issues = [];
for (let i = 1445; i < 1510 && i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (opens !== closes) {
        issues.push({ lineNum: i+1, depth, opens, closes, preview: line.trim().substring(0, 80) });
    }
}
console.log("Depth at line 1510:", depth);
issues.forEach(({lineNum, depth, opens, closes, preview}) => {
    console.log(`L${lineNum} [depth:${depth}] +${opens}/-${closes}: ${preview}`);
});
