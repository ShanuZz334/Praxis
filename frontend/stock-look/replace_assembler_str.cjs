const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\futureVisionContextAssembler.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /BLOCK 2[\s\S]*?BLOCK 6/i,
    `BLOCK 2 - TECHNICAL NARRATIVE
  =========================================
  \${technicalBlock}
  
  BLOCK 3 - FUNDAMENTAL NARRATIVE
  =========================================
  \${fundamentalBlock}
  
  BLOCK 4 - EVENTS NARRATIVE
  =========================================
  \${eventBlock}
  
  BLOCK 4.1 - OPTIONS NARRATIVE
  =========================================
  \${optionsBlock}
  
  BLOCK 4.2 - GLOBAL MACRO NARRATIVE
  =========================================
  \${globalBlock}
  
  BLOCK 5 - SESSION & MODE CONTEXT
  =========================================
  \${sessionBlock}
  
  BLOCK 6`
);

fs.writeFileSync(path, content);
