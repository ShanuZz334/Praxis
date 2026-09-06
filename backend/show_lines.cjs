const fs = require("fs");
const content = fs.readFileSync("c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = content.split("\n");

// Find unclosed JSX expressions (single open braces that aren't closed)
// Check specifically around line 1440-1500 for orphaned { or map block
for (let i = 1440; i < 1502 && i < lines.length; i++) {
    const line = lines[i];
    // Look for JSX expressions that might be unclosed
    const trimmed = line.trim();
    console.log(`${i+1}: ${trimmed.substring(0, 120)}`);
}
