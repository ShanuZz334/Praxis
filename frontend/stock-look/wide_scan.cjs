const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

for (let end = 1400; end >= 1000; end -= 50) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        console.log("PASSES at", end);
        // Narrow 
        for (let f = end + 1; f <= end + 51; f++) {
            const c2 = lines.slice(0, f).join("\n") + "\n    );\n}\n";
            try {
                parse(c2, { sourceType: "module", plugins: ["jsx", "typescript"] });
            } catch(e2) {
                console.log("First fail at line", f, ":", JSON.stringify(lines[f-1].trim().substring(0, 120)));
                console.log("Error:", e2.message);
                process.exit(0);
            }
        }
        process.exit(0);
    } catch(e) {
        // continue
    }
}
console.log("No pass found down to line 1000");
