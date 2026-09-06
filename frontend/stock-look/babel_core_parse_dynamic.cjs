const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const file = process.argv[2] || "./src/features/dashboard/settings/ui/SettingsPage.jsx";
const code = fs.readFileSync(file, "utf8");
try {
    const result = babel.parseSync(code, {
        filename: file,
        parserOpts: {
            plugins: ["jsx", "typescript", "decorators-legacy"]
        }
    });
    console.log("BABEL PARSE OK for " + file);
} catch(e) {
    console.log("BABEL ERROR at line:", e.loc?.line, "col:", e.loc?.column);
    console.log("Msg:", e.message.substring(0, 200));
}
