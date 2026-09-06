const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

for (let end = 1000; end >= 400; end -= 100) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        console.log("PASSES at line", end);
        process.exit(0);
    } catch(e) {
        console.log("FAILS at line", end, ":", e.message.substring(0, 60));
    }
}
