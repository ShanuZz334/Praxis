const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
// Use the parser directly from @babel/core
try {
    const result = babel.parseSync(code, {
        filename: "SettingsPage.jsx",
        parserOpts: {
            plugins: ["jsx", "typescript", "decorators-legacy"]
        }
    });
    console.log("BABEL PARSE OK");
} catch(e) {
    console.log("BABEL ERROR at line:", e.loc?.line, "col:", e.loc?.column);
    console.log("Msg:", e.message.substring(0, 200));
}
