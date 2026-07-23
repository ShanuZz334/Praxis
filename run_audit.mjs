import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.join(__dirname, 'frontend/stock-look/src/shared/config/cardRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

// simple evaluation to get the registry
let CARD_REGISTRY;
try {
  // Strip export and evaluate
  const scriptContent = registryContent.replace('export const CARD_REGISTRY =', 'CARD_REGISTRY =');
  eval(scriptContent);
} catch (e) {
  console.error("Failed to parse registry", e);
  process.exit(1);
}

const allCards = Object.values(CARD_REGISTRY);
const cardIds = allCards.map(c => c.id);

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        if (!dirFile.includes('node_modules') && !dirFile.includes('.git') && !dirFile.includes('.next') && !dirFile.includes('build') && !dirFile.includes('dist')) {
          filelist = walkSync(dirFile, filelist);
        }
      } else {
        const ext = path.extname(dirFile).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md'].includes(ext)) {
          filelist.push(dirFile);
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EPERM' || err.code === 'EACCES') {
      } else {
        throw err;
      }
    }
  });
  return filelist;
}

const allFiles = walkSync(__dirname);

let coverageGaps = [];
let staleRegistryEntries = [];
let systemUsageAudit = [];
let ghostIdsFound = [];
let duplicateCollisions = [];

// Step 4: Duplicates
const idCounts = {};
allCards.forEach(c => {
  idCounts[c.id] = (idCounts[c.id] || 0) + 1;
  if (idCounts[c.id] > 1) {
    duplicateCollisions.push(c.id);
  }
});

// Build system usage
const usageMap = {};
allCards.forEach(c => {
  usageMap[c.id] = {
    frontend: 'MISSING',
    engine: 'MISSING',
    chat: 'MISSING',
    prompt: 'MISSING',
    seed: 'MISSING'
  };
});

allFiles.forEach(file => {
  if (file === registryPath || file === __filename) return;
  const content = fs.readFileSync(file, 'utf8');
  
  // Ghost IDs check: legacyIds
  allCards.forEach(c => {
    (c.legacyIds || []).forEach(legacy => {
      if (content.includes(legacy)) {
        ghostIdsFound.push({ file: file, type: 'legacyId', value: legacy });
      }
    });
  });

  // check if file is frontend component
  const isFrontend = file.includes('frontend') && (file.endsWith('.jsx') || file.endsWith('.js'));
  const isEngine = file.includes('engine') || file.includes('scorers');
  const isChat = file.includes('Chat') || file.includes('sidebar') || file.toLowerCase().includes('paisidebar');
  const isPrompt = file.includes('prompt');
  const isSeed = file.includes('seed') || file.includes('mock');

  allCards.forEach(c => {
    const hasLiveImport = content.includes(`CARD_REGISTRY.${c.id}`) || (content.includes(c.id) && content.includes('CARD_REGISTRY'));
    const hasHardcoded = content.includes(`'${c.id}'`) || content.includes(`"${c.id}"`) || content.includes(`id="${c.id}"`) || content.includes(`id: '${c.id}'`);

    let status = 'MISSING';
    if (hasLiveImport) status = 'LIVE_IMPORT';
    else if (hasHardcoded) status = 'HARDCODED_MATCH';

    if (status !== 'MISSING') {
      if (isFrontend && usageMap[c.id].frontend !== 'LIVE_IMPORT') usageMap[c.id].frontend = status;
      if (isEngine && usageMap[c.id].engine !== 'LIVE_IMPORT') usageMap[c.id].engine = status;
      if (isChat && usageMap[c.id].chat !== 'LIVE_IMPORT') usageMap[c.id].chat = status;
      if (isPrompt && usageMap[c.id].prompt !== 'LIVE_IMPORT') usageMap[c.id].prompt = status;
      if (isSeed && usageMap[c.id].seed !== 'LIVE_IMPORT') usageMap[c.id].seed = status;
    }
  });
});

// Calculate gaps
allCards.forEach(c => {
  systemUsageAudit.push({
    id: c.id,
    systems: usageMap[c.id]
  });
  
  if (usageMap[c.id].frontend === 'MISSING') {
    staleRegistryEntries.push(c.id);
  }
});

// Ghost IDs Part 2 & 3: Check for ghost cardIds and strings that look like card ids
allFiles.forEach(file => {
    if (file === registryPath || file === __filename) return;
    const content = fs.readFileSync(file, 'utf8');
    
    // find things like cardId: 'something' or id="something" that might be a card
    const cardIdRegex = /cardId['"]?\s*:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = cardIdRegex.exec(content)) !== null) {
        const id = match[1];
        if (!cardIds.includes(id)) {
            ghostIdsFound.push({ file: file, type: 'ghost_cardId', value: id });
        }
    }
});


// Output
const report = {
  summary: {
    totalComponentsFound: allCards.length - staleRegistryEntries.length,
    totalRegistered: allCards.length,
    coverageGaps: staleRegistryEntries.length,
    ghostIdsFound: ghostIdsFound.length,
    verdict: "Audit complete. Found various gaps and inconsistencies."
  },
  coverageGaps: staleRegistryEntries.map(id => ({ id, reason: 'Missing in frontend' })),
  staleRegistryEntries,
  systemUsageAudit,
  ghostIdsFound,
  duplicateCollisions
};

const outPath = 'C:\\Users\\shanif\\.gemini\\antigravity\\brain\\97819f1b-03de-4882-96f5-233fe6d30ac4\\id_registry_audit.json';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

const mdPath = 'C:\\Users\\shanif\\.gemini\\antigravity\\brain\\97819f1b-03de-4882-96f5-233fe6d30ac4\\id_registry_audit.md';
let md = `# ID Registry Audit Report

## Summary
- Total Registered: ${report.summary.totalRegistered}
- Total Active in Frontend: ${report.summary.totalComponentsFound}
- Coverage Gaps: ${report.summary.coverageGaps}
- Ghost IDs: ${report.summary.ghostIdsFound}

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;
fs.writeFileSync(mdPath, md);
console.log("Done");
