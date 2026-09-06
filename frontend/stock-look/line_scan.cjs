const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Parse from the BEGINNING with progressively more lines added
// Find the line where adding it first causes a parse error in the growing prefix
let lastOkLine = 0;
for (let end = 800; end <= 1600; end += 20) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        lastOkLine = end;
    } catch(e) {
        if (lastOkLine > 0 && end - lastOkLine <= 40) {
            console.log("First failure detected: lastOk=", lastOkLine, "failAt=", end);
            // Fine-grained check
            for (let f = lastOkLine + 1; f <= end; f++) {
                const c2 = lines.slice(0, f).join("\n") + "\n    );\n}\n";
                try {
                    parse(c2, { sourceType: "module", plugins: ["jsx", "typescript"] });
                } catch(e2) {
                    console.log("EXACT first fail at line", f, "->", JSON.stringify(lines[f-1].trim().substring(0, 120)));
                    console.log("Error:", e2.message, JSON.stringify(e2.loc));
                    process.exit(0);
                }
            }
        }
    }
}
console.log("No single line found to be culprit");
