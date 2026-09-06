const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Try just parsing chunks that are complete JSX contexts
// Test each 5000-byte window independently
let lastGoodEnd = 0;
for (let end = 5000; end <= 100000; end += 5000) {
    const chunk = "function A() { return (" + code.substring(end - 5000, end) + "); }";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        lastGoodEnd = end;
    } catch(e) {
        // Ignore - chunks are not self-contained
    }
}

// Full file parse to get the error
try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("FULL PARSE OK");
} catch(e) {
    console.log("Full file error at byte:", e.loc?.index, "line:", e.loc?.line, "col:", e.loc?.column);
    console.log("Msg:", e.message);
    // Show 500 bytes BEFORE the error
    const idx = e.loc?.index || 0;
    console.log("Context before error:", JSON.stringify(code.substring(Math.max(0, idx-400), idx+50)));
}
