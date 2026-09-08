const fs = require('fs');
const file = 'frontend/stock-look/src/features/dashboard/pai/ui/PaiModelsTab.jsx';
let content = fs.readFileSync(file, 'utf8');

// The rendering of the models might be like: p.models?.tier1_simple
content = content.replace(/p\.models\?\.tier1_simple/g, 'p.models?.level1_fast');
content = content.replace(/p\.models\?\.tier2_medium/g, 'p.models?.level2_standard');
content = content.replace(/p\.models\?\.tier3_complex/g, 'p.models?.level3_advanced');
content = content.replace(/p\.models\?\.tier4_vision/g, 'p.models?.level6_vision'); // Vision map
content = content.replace(/p\.models\.tier1_simple/g, 'p.models.level1_fast');
content = content.replace(/p\.models\.tier2_medium/g, 'p.models.level2_standard');
content = content.replace(/p\.models\.tier3_complex/g, 'p.models.level3_advanced');
content = content.replace(/p\.models\.tier4_vision/g, 'p.models.level6_vision');

// Also update the UI labels rendered like <span className="...">T1: {p.models.tier1_simple}</span>
content = content.replace(/T1:/g, 'L1:');
content = content.replace(/T2:/g, 'L2:');
content = content.replace(/T3:/g, 'L3:');
content = content.replace(/T4:/g, 'L6:'); // mapping T4 Vision to L6 Vision visually

fs.writeFileSync(file, content);
