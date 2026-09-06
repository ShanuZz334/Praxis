const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Find the specific line between 800 and 1000 where issue starts
for (let end = 800; end <= 1000; end += 10) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        console.log("PASSES at line", end);
    } catch(e) {
        console.log("FAILS at line", end, "->", e.message.substring(0, 80));
    }
}
