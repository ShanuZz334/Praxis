const fs = require('fs');
const path = require('path');
const dir = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/fundamentals/ui';

let replacements = [
  // (%) without it in value yet
  { file: 'CPICard.jsx', oldStr: "label: 'Inflation (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Inflation', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'CreditGrowthCard.jsx', oldStr: "label: 'Growth (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Growth', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'EPSYoYCard.jsx', oldStr: "label: 'Growth (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Growth', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'FiscalDeficitCard.jsx', oldStr: "label: 'Deficit (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Deficit', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'GDPCard.jsx', oldStr: "label: 'Growth (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Growth', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'ProfitMarginCard.jsx', oldStr: "label: 'Margin (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Margin', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  { file: 'RepoCard.jsx', oldStr: "label: 'Rate (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Rate', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--'" },
  
  // ForwardEPSCard has wrong label completely
  { file: 'ForwardEPSCard.jsx', oldStr: "label: 'Growth (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'EPS', value: currentValue !== null ? (typeof currentValue === 'number' ? '₹' + currentValue.toFixed(2) : '₹' + currentValue) : '--'" },

  // ($)
  { file: 'CrudeCard.jsx', oldStr: "label: 'Price ($)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Price', value: currentValue !== null ? (typeof currentValue === 'number' ? '$' + currentValue.toFixed(2) : '$' + currentValue) : '--'" },
  
  // (Cr)
  { file: 'DIICard.jsx', oldStr: "label: 'Flow (Cr)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Flow', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + ' Cr' : currentValue + ' Cr') : '--'" },
  { file: 'FIICard.jsx', oldStr: "label: 'Flow (Cr)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Flow', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + ' Cr' : currentValue + ' Cr') : '--'" },
  { file: 'MFFlowsCard.jsx', oldStr: "label: 'Flows (Cr)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Flows', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + ' Cr' : currentValue + ' Cr') : '--'" },
  
  // (LCr)
  { file: 'SystemLiquidityCard.jsx', oldStr: "label: 'Surplus (LCr)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--'", newStr: "label: 'Surplus', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + ' LCr' : currentValue + ' LCr') : '--'" },
  
  // (Days)
  { file: 'CashConversionCycleCard.jsx', oldStr: "label: 'CCC (Days)', value: ccc !== null ? Math.round(ccc).toString() : '--'", newStr: "label: 'CCC', value: ccc !== null ? Math.round(ccc).toString() + ' Days' : '--'" },

  // Already have (%) in value, just need label stripped
  { file: 'NetMarginCard.jsx', oldStr: "label: 'Net Margin (%)'", newStr: "label: 'Net Margin'" },
  { file: 'OperatingMarginCard.jsx', oldStr: "label: 'Operating Margin (%)'", newStr: "label: 'Operating Margin'" },
  { file: 'ProfitGrowthCard.jsx', oldStr: "label: 'CAGR (%)'", newStr: "label: 'CAGR'" },
  { file: 'RevenueGrowthCard.jsx', oldStr: "label: 'CAGR (%)'", newStr: "label: 'CAGR'" },
  { file: 'ROCECard.jsx', oldStr: "label: 'ROCE (%)'", newStr: "label: 'ROCE'" },
  { file: 'ROECard.jsx', oldStr: "label: 'ROE (%)'", newStr: "label: 'ROE'" },
  { file: 'ROACard.jsx', oldStr: "label: 'ROA (%)'", newStr: "label: 'ROA'" },
  
  // FreeCashFlow is multi-line. Let's fix that too.
  { file: 'FreeCashFlowCard.jsx', oldStr: "label: 'FCF (₹ Cr)'", newStr: "label: 'FCF'" }
];

replacements.forEach(r => {
  let filepath = path.join(dir, r.file);
  if(fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes(r.oldStr)) {
        content = content.replace(r.oldStr, r.newStr);
        fs.writeFileSync(filepath, content);
        console.log('SUCCESS: ' + r.file);
    } else {
        console.log('NOT FOUND in ' + r.file + ': ' + r.oldStr);
    }
  } else {
    console.log('FILE NOT FOUND: ' + r.file);
  }
});
