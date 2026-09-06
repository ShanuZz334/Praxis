const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Find all lines that could cause context to shift: unclosed backticks, strings, etc
const lines = code.split("\n");
let inTemplateLiteral = false;
let inString = null;
let lastSignificant = null;

for (let i = 1300; i < 1510 && i < lines.length; i++) {
    const line = lines[i];
    // Count backticks (unescaped)
    const backticks = (line.match(/(?<!\\)`/g) || []).length;
    if (backticks % 2 !== 0) {
        console.log("ODD backtick count on line", i+1, ":", backticks, "->", JSON.stringify(line.trim().substring(0,100)));
    }
}
console.log("Done scanning for backtick issues");
