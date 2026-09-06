const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Try to find the exact line by parsing the file with progressively more lines removed from END
const lines = code.split("\n");
console.log("Total lines:", lines.length);

// Parse with last N lines removed to find when parse succeeds
for (let trim = 10; trim <= 1000; trim += 10) {
    const trimmed = lines.slice(0, lines.length - trim).join("\n") + "\n    );\n}\n";
    try {
        parse(trimmed, { sourceType: "module", plugins: ["jsx", "typescript"] });
        // Success! The error is in the last `trim` lines
        console.log("Parse succeeds when last", trim, "lines removed - error is around line", lines.length - trim);
        break;
    } catch(e) {
        // continue
    }
}
