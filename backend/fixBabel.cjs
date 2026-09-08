const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/pai/ui/PaiFloatingWidget.jsx';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('\\nimport')) {
    code = code.replace(/\\nimport/g, '\nimport');
    fs.writeFileSync(path, code);
    console.log("Fixed literal \\nimport in PaiFloatingWidget.jsx!");
} else {
    console.log("Could not find \\nimport. Trying broader search...");
    // maybe it's literally backslash n
    code = code.replace(/\\n/g, '\n');
    fs.writeFileSync(path, code);
    console.log("Replaced all literal \\n with actual newlines.");
}
