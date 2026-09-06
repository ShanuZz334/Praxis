const { parse } = require("./node_modules/@babel/parser");
const { execSync } = require("child_process");
const code = execSync('git -C "c:/project/ALLBACKUP/Praxis" show HEAD:"frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx"').toString();
try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("GIT HEAD PARSES OK");
} catch(e) {
    console.log("GIT HEAD PARSE ERROR:", e.message, JSON.stringify(e.loc));
}
