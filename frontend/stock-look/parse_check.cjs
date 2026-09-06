const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("PARSE OK");
} catch(e) {
    console.log("ERROR:", e.message, e.loc);
}
