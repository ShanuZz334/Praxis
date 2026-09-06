const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const idx = code.indexOf("Future Vision Settings");
if (idx < 0) { console.log("NOT FOUND"); process.exit(1); }
console.log("Found at byte:", idx);
// Print char codes around it
for (let i = idx - 3; i < idx + 30; i++) {
    console.log("  byte", i, "char:", JSON.stringify(code[i]), "code:", code.charCodeAt(i));
}
