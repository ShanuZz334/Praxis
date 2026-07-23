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

// 1. Delete FnOBanCard.jsx
const fnoBanCardPath = path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/options/ui/FnOBanCard.jsx');
if (fs.existsSync(fnoBanCardPath)) {
    fs.unlinkSync(fnoBanCardPath);
    console.log('Deleted FnOBanCard.jsx');
}

// 2. OptionsGrid.jsx
patchFile(path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/options/ui/OptionsGrid.jsx'), [
    { target: "import FnOBanCard from './FnOBanCard';\n", replace: "" },
    { target: ", CARD_REGISTRY.fno_ban.id", replace: "" },
    { target: "if (item.id === CARD_REGISTRY.fno_ban.id && compositeData?.fnoBan) liveData = compositeData.fnoBan;\n", replace: "" },
    { target: "renderList.push({ id: CARD_REGISTRY.fno_ban.id, node: <FnOBanCard cardId={CARD_REGISTRY.fno_ban.id} /> });\n", replace: "" },
    // Remove the explicit render block in the bottom half of the file if it exists
    { target: "{/* fnoBan goes here */}\n                                    <FnOBanCard cardId={CARD_REGISTRY.fno_ban.id} data={compositeData?.fnoBan} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime ? resolveTime(isLive, isLive ? null : CARD_REGISTRY.fno_ban.id) : null} />", replace: "" },
    // Or just generic:
    { regex: /<FnOBanCard[\s\S]*?\/>/g, replace: "" }
]);

// 3. OptionsPage.jsx
patchFile(path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/options/ui/OptionsPage.jsx'), [
    { target: ", CARD_REGISTRY.fno_ban.id", replace: "" },
    { target: `                <div className="space-y-2">
                    <div className="text-xs font-bold text-rose-500 mb-2">F&O Ban Status</div>
                    <DebouncedOverrideInput label="MWPL (%)" overrideKey="mwpl_pct" value={manualOverrides.mwpl_pct} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="Ban Status (true/false)" overrideKey="ban_status" value={manualOverrides.ban_status} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="Days in Ban" overrideKey="days_in_ban" value={manualOverrides.days_in_ban} onChange={handleOverrideChange} />
                </div>`, replace: "" },
    { regex: /<div className="space-y-2">\s*<div className="text-xs font-bold text-rose-500 mb-2">F&O Ban Status<\/div>[\s\S]*?<\/div>/g, replace: "" }
]);

// 4. PaiSidebar.jsx
patchFile(path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/pai/ui/PaiSidebar.jsx'), [
    { target: "                    { id: CARD_REGISTRY.fno_ban.id, title: 'F&O Ban Status', type: 'card' }\n", replace: "" },
    { target: "                    { id: CARD_REGISTRY.fno_ban.id, title: 'F&O Ban Status', type: 'card' }", replace: "" }
]);

// 5. _wire_tech_opts.cjs
patchFile(path.join(projectRoot, 'frontend/stock-look/src/features/dashboard/fundamentals/ui/_wire_tech_opts.cjs'), [
    { target: "    { file: 'FnOBanCard.jsx',             cardId: 'fno_ban' },\n", replace: "" }
]);

// 6. cardRegistry.js
patchFile(path.join(projectRoot, 'frontend/stock-look/src/shared/config/cardRegistry.js'), [
    { target: "    fno_ban:                 { id: 'fno_ban',                 type: 'card',   displayName: 'F&O Ban Status',         page: 'Options',   section: 'General', appliesTo: 'company', legacyIds: [] },\n", replace: "" },
    { regex: /\s*fno_ban:\s*\{.*?\},/g, replace: "" }
]);

// 7. cardInventory.json
patchFile(path.join(projectRoot, 'frontend/stock-look/src/shared/constants/cardInventory.json'), [
    { regex: /,\s*\{\s*"targetId":\s*"fno_ban"[\s\S]*?\}/g, replace: "" },
    { regex: /\{\s*"targetId":\s*"fno_ban"[\s\S]*?\},/g, replace: "" }
]);

// 8. CARD_INVENTORY.md
patchFile(path.join(projectRoot, 'CARD_INVENTORY.md'), [
    { regex: /\| \d+ \| F&O Ban Status \| Options \| Manual \/ Upstox \| Company \|\n/g, replace: "" }
]);

console.log('Nuke script complete!');
