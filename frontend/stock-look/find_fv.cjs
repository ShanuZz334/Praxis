const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
// Search for Future Vision using byte scan
const idx = code.indexOf("Future Vision");
if (idx >= 0) {
    console.log("Found 'Future Vision' at byte:", idx);
    console.log("Context:", JSON.stringify(code.substring(idx - 50, idx + 200)));
    const lineNum = code.substring(0, idx).split("\n").length;
    console.log("Line:", lineNum);
} else {
    console.log("NOT FOUND - file may not have Future Vision section");
    console.log("File length:", code.length, "bytes");
}
