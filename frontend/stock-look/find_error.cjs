const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
// Show exactly what is at byte offset 86252
const idx = 86252;
const surrounding = code.substring(idx - 100, idx + 200);
console.log("=== Content around byte 86252 ===");
console.log(JSON.stringify(surrounding));
console.log("\n=== Char codes around error ===");
for (let i = idx - 5; i < idx + 10; i++) {
    console.log("  offset " + i + ": char '" + code[i] + "' code=" + code.charCodeAt(i));
}
