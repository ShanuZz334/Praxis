const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Try a wider range since many lines together cause context shifts
for (let end = 1504; end >= 1400; end--) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        console.log("First PASSING truncation at line", end);
        console.log("=> Error introduced at line", end + 1, ":", JSON.stringify(lines[end].trim().substring(0, 120)));
        process.exit(0);
    } catch(e) {
        // keep going backwards
    }
}
console.log("No passing point found in range 1400-1504");
