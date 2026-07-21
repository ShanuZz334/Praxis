import fs from 'fs';
import path from 'path';

const SRC_DIR = './src/features/dashboard';

const EXCLUDED_CARDS = [
  'FundamentalCard.jsx',
  'TechnicalCard.jsx',
  'OptionsCard.jsx',
  'OptionsHoverCard.jsx',
  'MessageCard.jsx',
  'LivePnLCard.jsx',
  'OptionsMarginCard.jsx'
];

// IDs for GenericGlobalCard extracted from globalData.js
const GLOBAL_IDS = [
  { id: 'dxy', label: 'Dollar Index (DXY)' },
  { id: 'eurusd', label: 'EUR/USD' },
  { id: 'usdjpy', label: 'USD/JPY' },
  { id: 'sp_futures', label: 'S&P 500' },
  { id: 'nasdaq_futures', label: 'Nasdaq 100' },
  { id: 'dow_futures', label: 'Dow Jones' },
  { id: 'nikkei', label: 'Nikkei 225' },
  { id: 'ftse', label: 'FTSE 100' },
  { id: 'dax', label: 'DAX 40' },
  { id: 'hangseng', label: 'Hang Seng' },
  { id: 'shanghai', label: 'Shanghai Composite' },
  { id: 'cac40', label: 'CAC 40' },
  { id: 'eurostoxx', label: 'Euro Stoxx 50' },
  { id: 'us_10y_yield', label: 'US 10-Year Yield' },
  { id: 'vix', label: 'VIX (CBOE)' },
  { id: 'move', label: 'MOVE Index' },
  { id: 'usd_inr', label: 'USD/INR' },
  { id: 'crude', label: 'Brent Crude Oil' },
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'copper', label: 'Copper' },
  { id: 'natgas', label: 'Natural Gas' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'aluminum', label: 'Aluminum' },
  { id: 'bitcoin', label: 'Bitcoin' }
];

const PAGE_MAPPING = {
  'fundamentals': 'Fundamentals',
  'technical': 'Technical Analysis',
  'options': 'Options Analysis',
  'foreign': 'Foreign Markets',
  'events': 'Events',
  'macro': 'Macro',
  'master': 'Master'
};

function scanCards(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanCards(fullPath, fileList);
    } else if (file.endsWith('Card.jsx') && !EXCLUDED_CARDS.includes(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const cardFiles = scanCards(SRC_DIR);
let inventory = [];

cardFiles.forEach((filePath) => {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let page = 'Unknown';
  for (const [key, value] of Object.entries(PAGE_MAPPING)) {
    if (filePath.includes(`\\${key}\\`) || filePath.includes(`/${key}/`)) {
      page = value;
      break;
    }
  }
  
  if (filename === 'GenericGlobalCard.jsx') {
    // Expand into the 25 distinct metrics
    GLOBAL_IDS.forEach(metric => {
        inventory.push({
            id: inventory.length + 1,
            filename: `GenericGlobalCard.jsx (Logical: ${metric.id})`,
            card: metric.label,
            targetId: `global_${metric.id}`,
            page: page,
            dataSource: metric.id === 'crude' || metric.id.includes('usd') ? 'Auto' : 'Manual', // Rough proxy based on typical Upstox data
            applicability: 'Both'
        });
    });
    return; // Skip adding the Generic component itself
  }

  let displayName = filename.replace('Card.jsx', '');
  const titleMatch1 = content.match(/title\s*=\s*"([^"]+)"/);
  const titleMatch2 = content.match(/title\s*=\s*\{'([^']+)'\}/);
  const titleMatch3 = content.match(/label\s*=\s*"([^"]+)"/);
  if (titleMatch1) displayName = titleMatch1[1];
  else if (titleMatch2) displayName = titleMatch2[1];
  else if (titleMatch3) displayName = titleMatch3[1];
  
  let dataSource = 'Unknown';
  if (content.includes('isLiveData={true}') || content.includes('isLiveData: true') || content.includes('source="Auto"')) {
    dataSource = 'Auto';
  } else if (content.includes('isLiveData={false}') || content.includes('isLiveData: false') || content.includes('source="Manual"')) {
    dataSource = 'Manual';
  } else {
    if (content.match(/data\?.+/)) {
      dataSource = 'Auto';
    } else {
      dataSource = 'Manual';
    }
  }
  
  let applicability = 'Both';
  if (page === 'Foreign Markets') applicability = 'Both';
  if (page === 'Technical Analysis') applicability = 'Both';
  if (page === 'Options Analysis') applicability = 'Both';
  
  if (page === 'Fundamentals') {
    if (content.toLowerCase().includes('macro') || content.toLowerCase().includes('index') || content.toLowerCase().includes('nifty')) {
      applicability = 'Index Only';
    } else if (content.toLowerCase().includes('eps') || content.toLowerCase().includes('pe ') || content.toLowerCase().includes('p/e') || content.toLowerCase().includes('promoter') || content.toLowerCase().includes('margin')) {
      applicability = 'Company Only';
    } else {
      applicability = 'Both';
    }
  }
  
  inventory.push({
    id: inventory.length + 1,
    filename: filename,
    card: displayName,
    targetId: filename.replace('Card.jsx', '').toLowerCase(),
    page: page,
    dataSource: dataSource,
    applicability: applicability
  });
});

// Write JSON
fs.writeFileSync('./card-inventory.json', JSON.stringify(inventory, null, 2));

// Write Markdown
let mdContent = `# Praxis Dashboard - Master Card Inventory

|  # | Card | Target ID | Page | Data Source | Applicability | Filename |
| -: | --- | --- | --- | --- | --- | --- |
`;

inventory.forEach((item, i) => {
  item.id = i + 1; // fix ordering
  mdContent += `| ${item.id} | ${item.card} | \`${item.targetId}\` | ${item.page} | ${item.dataSource} | ${item.applicability} | \`${item.filename}\` |\n`;
});

fs.writeFileSync('./CARD_INVENTORY.md', mdContent);

console.log(`Successfully generated logical inventory with ${inventory.length} active cards.`);
const breakdown = {};
inventory.forEach(c => {
    breakdown[c.page] = (breakdown[c.page] || 0) + 1;
});
console.log("Breakdown by Page:", breakdown);
