const fs = require('fs');
const file = 'backend/ai-gateway/cache/providerCache.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("../../utils/encryption.js", "../utils/encryption.js");
fs.writeFileSync(file, content);
