const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Compare div counts between original (git HEAD) and current
const { execSync } = require("child_process");
const orig = execSync("git -C c:/project/ALLBACKUP/Praxis show HEAD:frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx").toString();
const origLines = orig.split("\n");
let oOpens = 0, oCloses = 0;
for (let i = 1112; i < 1484; i++) {
    oOpens += (origLines[i].match(/<div[^/]/g) || []).length;
    oCloses += (origLines[i].match(/<\/div>/g) || []).length;
}
console.log("ORIGINAL lines 1113-1484 - opens:", oOpens, "closes:", oCloses, "net:", oOpens - oCloses);

const currLines = code.split("\n");
let cOpens = 0, cCloses = 0;
for (let i = 1112; i < 1484; i++) {
    cOpens += (currLines[i].match(/<div[^/]/g) || []).length;
    cCloses += (currLines[i].match(/<\/div>/g) || []).length;
}
console.log("CURRENT  lines 1113-1484 - opens:", cOpens, "closes:", cCloses, "net:", cOpens - cCloses);
