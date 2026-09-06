const babel = require("./node_modules/@babel/core");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
try {
    const result = babel.parseSync(code, {
        filename: "SettingsPage.jsx",
        presets: [["./node_modules/@babel/preset-react", { runtime: "automatic" }]],
        plugins: []
    });
    console.log("BABEL PARSE OK");
} catch(e) {
    console.log("BABEL ERROR:", e.message.substring(0, 200));
}
