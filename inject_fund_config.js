const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\config\\indicatorConfig.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `    ev_ebitda: { id: "ev_ebitda", title: "EV/EBITDA", creditScore: 7, category: "Valuation" },
    relative_valuation: { id: "relative_valuation", title: "Relative Valuation", creditScore: 6, category: "Valuation" },
    roa: { id: "roa", title: "ROA", creditScore: 7, category: "Corporate" },
    promoter_holding: { id: "promoter_holding", title: "Promoter Holding", creditScore: 8, category: "Ownership" },
    smart_money_flow: { id: "smart_money_flow", title: "Smart Money Flow", creditScore: 9, category: "Ownership" },
    earnings_quality: { id: "earnings_quality", title: "Earnings Quality", creditScore: 8, category: "Ownership" },
`;

// Insert before the last closing brace
const lastBraceIndex = content.lastIndexOf('}');
content = content.substring(0, lastBraceIndex) + injection + content.substring(lastBraceIndex);
fs.writeFileSync(file, content);
console.log("Successfully appended missing Fundamental cards to config!");
