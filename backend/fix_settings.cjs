const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/settings/ui/SettingsPage.jsx';
let content = fs.readFileSync(path, 'utf8');
// Remove any JSX comment containing Future Vision Settings (handles garbled emojis)
content = content.replace(/\{\/\*[^*]*Future Vision Settings[^*]*\*\/\}/g, '{/* Future Vision Settings */}');
fs.writeFileSync(path, content, 'utf8');
console.log('Done. Lines with Future Vision:');
content.split('\n').forEach((l, i) => { if (l.includes('Future Vision')) console.log(i+1 + ': ' + l.trim()); });
