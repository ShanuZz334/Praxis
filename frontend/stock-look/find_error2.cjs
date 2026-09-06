const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
// Try parsing truncated file up to 86100 bytes to see context
const truncated = code.substring(0, 86100) + "\n}\n";
try {
    parse(truncated, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("Truncated parse OK - issue is in the next 150 bytes");
} catch(e) {
    console.log("Truncated parse error at:", JSON.stringify(e.loc), e.message);
    // Find last JSX-significant chars
    const snippet = truncated.substring(truncated.length - 300);
    console.log("Last 300 chars:", JSON.stringify(snippet));
}
