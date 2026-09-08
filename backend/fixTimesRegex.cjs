const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/backend/fixTimes.cjs', 'utf8');
code = code.replace(/return lastCandle\\\.time;\\n\\s\*\\\}\\\)\;/, 'return lastCandle\\\\.time;[\\\\s\\\\S]*?\\\\}\\\\);');
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/fixTimes.cjs', code);
console.log("Fixed regex in fixTimes.cjs!");
