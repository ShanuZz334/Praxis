const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\project\\ALLBACKUP\\Praxis';

function patchFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    for (const { target, replace, regex } of replacements) {
        if (regex) {
            if (regex.test(content)) {
                content = content.replace(regex, replace);
                modified = true;
            }
        } else {
            if (content.includes(target)) {
                content = content.split(target).join(replace);
                modified = true;
            }
        }
    }
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched ${path.basename(filePath)}`);
    }
}

// 2. OptionsGrid.jsx
patchFile(path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/options/ui/OptionsGrid.jsx'), [
    { target: "import FnOBanCard from './FnOBanCard';\n", replace: "" },
    { target: ", CARD_REGISTRY.fno_ban.id", replace: "" },
    { regex: /^[ \t]*if\s*\(item\.id === CARD_REGISTRY\.fno_ban\.id && compositeData\?\.fnoBan\) liveData = compositeData\.fnoBan;[\r\n]*/gm, replace: "" },
    { regex: /^[ \t]*renderList\.push\(\{\s*id:\s*CARD_REGISTRY\.fno_ban\.id,\s*node:\s*<FnOBanCard cardId=\{CARD_REGISTRY\.fno_ban\.id\} \/>\s*\}\);[\r\n]*/gm, replace: "" },
    { regex: /^[ \t]*renderList\.push\(\{\s*id:\s*CARD_REGISTRY\.fno_ban\.id,\s*node:\s*\}\);[\r\n]*/gm, replace: "" },
    { regex: /^[ \t]*<FnOBanCard cardId=\{CARD_REGISTRY\.fno_ban\.id\} data=\{compositeData\?\.fnoBan\} manualOverrides=\{manualOverrides\} lastUpdated=\{\(isLive\) => resolveTime \? resolveTime\(isLive, isLive \? null : CARD_REGISTRY\.fno_ban\.id\) : null\} \/>[\r\n]*/gm, replace: "" }
]);
