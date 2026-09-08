const fs = require('fs');
const file = 'frontend/stock-look/src/features/dashboard/pai/ui/PaiModelsTab.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Initial form state
content = content.replace(
    /supportedTiers: \[\],(\s*)models: \{ tier1_simple: '', tier2_medium: '', tier3_complex: '', tier4_vision: '' \}/g,
    `supportedLevels: [],$1models: { level1_fast: '', level2_standard: '', level3_advanced: '', level4_expert: '', level5_reasoner: '', level6_vision: '', level7_audio: '' }`
);

// 2. handleTemplateSelect
content = content.replace(
    /tier1_simple: tmpl\.models\?\.tier1_simple \|\| '',\s*tier2_medium: tmpl\.models\?\.tier2_medium \|\| '',\s*tier3_complex: tmpl\.models\?\.tier3_complex \|\| '',\s*tier4_vision: tmpl\.models\?\.tier4_vision \|\| ''/g,
    `level1_fast: tmpl.models?.level1_fast || '', level2_standard: tmpl.models?.level2_standard || '', level3_advanced: tmpl.models?.level3_advanced || '', level4_expert: tmpl.models?.level4_expert || '', level5_reasoner: tmpl.models?.level5_reasoner || '', level6_vision: tmpl.models?.level6_vision || '', level7_audio: tmpl.models?.level7_audio || ''`
);

// 3. handleSubmit
content = content.replace(
    /const supportedTiers = Object\.keys\(formData\.models\)\s*\.filter\(k => formData\.models\[k\] && formData\.models\[k\]\.trim\(\) !== ''\)\s*\.map\(k => k\.replace\('tier', ''\)\.split\('_'\)\[0\]\);\s*const dataToSubmit = \{ \.\.\.formData, supportedTiers \};/g,
    `const supportedLevels = Object.keys(formData.models).filter(k => formData.models[k] && formData.models[k].trim() !== '');\n        const dataToSubmit = { ...formData, supportedLevels };`
);

// 4. dropdowns for auto routing
content = content.replace(
    /tier3_complex fallback/g,
    `level4_expert fallback`
);
content = content.replace(
    /\{ key: 'tier1_simple', label: 'T1 Simple' \},/g,
    `{ key: 'level1_fast', label: 'Level 1 Fast' },`
);
content = content.replace(
    /\{ key: 'tier2_medium', label: 'T2 Medium' \},/g,
    `{ key: 'level2_standard', label: 'Level 2 Std' },`
);
content = content.replace(
    /\{ key: 'tier3_complex', label: 'T3 Complex' \},/g,
    `{ key: 'level3_advanced', label: 'Level 3 Adv' },\n                            { key: 'level4_expert', label: 'Level 4 Expert' },\n                            { key: 'level5_reasoner', label: 'Level 5 Reasoner' },\n                            { key: 'level6_vision', label: 'Level 6 Vision' },\n                            { key: 'level7_audio', label: 'Level 7 Audio' },`
);
content = content.replace(
    /\{ key: 'tier4_vision', label: 'T4 Vision' \}/g,
    ``
);

fs.writeFileSync(file, content);
