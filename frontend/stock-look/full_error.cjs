const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
try {
    babel.parseSync(code, {
        filename: "SettingsPage.jsx",
        parserOpts: { plugins: ["jsx", "typescript", "decorators-legacy"] }
    });
    console.log("PARSE OK");
} catch(e) {
    console.log("Full error message:");
    console.log(e.message);
    console.log("\nLoc:", JSON.stringify(e.loc));
    // Show surrounding code
    if (e.loc) {
        const lines = code.split("\n");
        const line = e.loc.line - 1;
        for (let i = Math.max(0, line-3); i <= Math.min(lines.length-1, line+3); i++) {
            console.log((i===line ? ">>>" : "   ") + " " + (i+1) + ": " + JSON.stringify(lines[i]));
        }
    }
}
