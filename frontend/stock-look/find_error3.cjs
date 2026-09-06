const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");
// Print lines 1479-1500 with their exact content (raw)
for (let i = 1478; i < 1500; i++) {
    console.log((i+1) + ": " + JSON.stringify(lines[i]));
}
