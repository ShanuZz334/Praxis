const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/pai/ui/PaiChatArea.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<form
                                    onSubmit={handleSend}`;

const replacement = `{chatType !== 'readonly' ? (
                                <form
                                    onSubmit={handleSend}`;

const endTarget = `</form>`;
const endReplacement = `</form>
                                ) : (
                                    <div className="p-3 text-center text-[11px] text-text-tertiary bg-background-elevated/50 rounded-xl border border-border-subtle font-mono">
                                        System Trace logs are read-only. Manual chatting is disabled.
                                    </div>
                                )}`;

let formStartIndex = content.indexOf(target);
if (formStartIndex !== -1) {
    let before = content.substring(0, formStartIndex);
    let after = content.substring(formStartIndex);
    after = after.replace(target, replacement);
    
    let formEndIndex = after.indexOf(endTarget);
    if (formEndIndex !== -1) {
        let afterEnd = after.substring(formEndIndex + endTarget.length);
        after = after.substring(0, formEndIndex) + endReplacement + afterEnd;
        fs.writeFileSync(path, before + after);
        console.log('Success');
    }
}
