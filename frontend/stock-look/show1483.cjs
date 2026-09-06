const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");
// Print lines 1480-1490 with raw content
for (let i = 1479; i < 1490; i++) {
    console.log((i+1) + ": " + JSON.stringify(lines[i]));
}
