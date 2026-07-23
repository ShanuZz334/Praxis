const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\options\\ui\\OptionsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                        {!hasVega && <DebouncedOverrideInput label="Vega" overrideKey={CARD_REGISTRY.vega.id} value={manualOverrides.vega} onChange={handleOverrideChange} />}
                    </div>
                )}`;

const replaceStr = `                        {!hasVega && <DebouncedOverrideInput label="Vega" overrideKey={CARD_REGISTRY.vega.id} value={manualOverrides.vega} onChange={handleOverrideChange} />}
                    </div>
                )}

                <div className="space-y-2">
                    <div className="text-xs font-bold text-rose-500 mb-2">F&O Ban Status</div>
                    <DebouncedOverrideInput label="MWPL (%)" overrideKey="mwpl_pct" value={manualOverrides.mwpl_pct} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="Ban Status (true/false)" overrideKey="ban_status" value={manualOverrides.ban_status} onChange={handleOverrideChange} />
                    <DebouncedOverrideInput label="Days in Ban" overrideKey="days_in_ban" value={manualOverrides.days_in_ban} onChange={handleOverrideChange} />
                </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
} else {
    // try different line endings
    const targetStr2 = targetStr.replace(/\n/g, '\r\n');
    const replaceStr2 = replaceStr.replace(/\n/g, '\r\n');
    if (content.includes(targetStr2)) {
        content = content.replace(targetStr2, replaceStr2);
    } else {
        console.log("Could not find the target string.");
        process.exit(1);
    }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched OptionsPage.jsx');
