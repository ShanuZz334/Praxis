const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Binary search using @babel/core to find the exact failing line
let lo = 1440, hi = 1490;
for (let end = lo; end <= hi; end++) {
    const chunk = lines.slice(0, end).join("\n") + "\n    );\n}\n";
    try {
        babel.parseSync(chunk, {
            filename: "SettingsPage.jsx",
            parserOpts: { plugins: ["jsx", "typescript", "decorators-legacy"] }
        });
        console.log("PASS at line", end);
    } catch(e) {
        console.log("FAIL at line", end, "->", e.message.split("\n")[0].substring(0, 80));
    }
}
