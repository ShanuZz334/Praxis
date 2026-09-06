const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Step through in chunks of 2000 bytes, append closing braces
let lastOk = 0;
for (let i = 2000; i <= code.length; i += 2000) {
    const chunk = code.substring(0, i) + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        lastOk = i;
    } catch(e) {
        if (lastOk === 0) continue; // skip early parse fails due to truncation
        console.log("First REAL failure between bytes:", lastOk, "and", i);
        // Narrow it with 100-byte steps
        for (let j = lastOk + 100; j <= i; j += 100) {
            const c2 = code.substring(0, j) + "\n    );\n}\n";
            try {
                parse(c2, { sourceType: "module", plugins: ["jsx", "typescript"] });
            } catch(e2) {
                console.log("Narrowed to ~byte", j, "error:", e2.message, JSON.stringify(e2.loc));
                console.log("Content at failure zone:", JSON.stringify(code.substring(j - 300, j)));
                break;
            }
        }
        break;
    }
}
