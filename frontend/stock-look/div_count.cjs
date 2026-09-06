const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Count div opens/closes from line 1113 (preferences conditional) to line 1542
let opens = 0, closes = 0;
for (let i = 1112; i < 1542; i++) {
    const line = lines[i];
    // Simple count (not counting self-closing or conditional)
    opens += (line.match(/<div[^/]/g) || []).length;
    closes += (line.match(/<\/div>/g) || []).length;
}
console.log("Preferences tab div opens:", opens, "closes:", closes, "net:", opens - closes);
