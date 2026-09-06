const { parse } = require("@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("Parse OK");
} catch(e) {
    console.log("Parse error:", e.message);
    console.log("Location:", JSON.stringify(e.loc));
}
