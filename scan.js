const fs = require('fs');
const path = require('path');

const results = [];

function extractFields(content) {
    const fields = new Set();
    const dataMatches = content.matchAll(/data(?:\?\.|\.)([a-zA-Z0-9_]+)/g);
    for (const match of dataMatches) {
        if (match[1] !== 'current_price' && match[1] !== 'currentValue' && match[1] !== 'id' && match[1] !== 'name') {
            fields.add(match[1]);
        }
    }
    
    const propMatches = content.matchAll(/liveData(?:\?\.|\.)([a-zA-Z0-9_]+)/g);
    for (const match of propMatches) {
        fields.add(match[1]);
    }

    if (fields.size === 0) fields.add("value");
    return Array.from(fields);
}

function scanDir(dir, moduleName) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (!file.endsWith('.jsx')) continue;
        if (!file.includes('Card') && !file.includes('Widget') && !file.includes('Pulse') && !file.includes('Chat') && !file.includes('Insight')) continue;
        
        // Exclude generic/base components
        if (['FundamentalCard.jsx', 'TechnicalCard.jsx', 'OptionsCard.jsx', 'GenericGlobalCard.jsx', 'IndicatorCard.jsx', 'GlobalCard.jsx'].includes(file)) continue;

        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Skip files that are clearly not indicator cards (like empty state or context)
        if (!content.includes('export default') && !content.includes('export function')) continue;

        let cardId = "unknown";
        let cardName = file.replace('.jsx', '').replace(/([A-Z])/g, ' $1').trim();
        let section = moduleName;
        
        const idMatch = content.match(/(?:cardId|id)\s*:\s*['"]([^'"]+)['"]/);
        if (idMatch) cardId = idMatch[1];
        else {
            const defaultIdMatch = file.match(/^([a-zA-Z0-9]+)(?:Card|Widget)?\.jsx$/);
            if (defaultIdMatch) cardId = defaultIdMatch[1].toLowerCase();
        }

        const titleMatch = content.match(/(?:title|label)\s*:\s*['"]([^'"]+)['"]/);
        if (titleMatch) cardName = titleMatch[1];

        let appliesTo = "both";
        if (content.includes('isIndex') || file.includes('Index')) {
            if (content.includes('!isIndex')) appliesTo = "company";
            else appliesTo = "indices";
        }
        
        // Hardcode some known module behaviors
        if (moduleName === 'Options') appliesTo = 'both';
        if (moduleName === 'Global') appliesTo = 'both';

        let hasChatSection = false;
        if (content.includes('/intelligence/card-insight') || content.includes('aiInsight') || content.includes('insight') || content.includes('GlobalAIInsight')) {
            hasChatSection = true;
        }

        results.push({
            cardId: cardId,
            cardName: cardName,
            page: moduleName,
            appliesTo: appliesTo,
            existingPromptKey: null,
            hasChatSection: hasChatSection,
            requiredDataFields: extractFields(content),
            currentPromptText: null,
            notes: ""
        });
    }
}

const basePath = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard';

scanDir(path.join(basePath, 'fundamentals', 'ui'), 'Fundamentals');
scanDir(path.join(basePath, 'technical', 'ui'), 'Technical');
scanDir(path.join(basePath, 'options', 'ui'), 'Options');
scanDir(path.join(basePath, 'foreign', 'ui'), 'Global');
scanDir(path.join(basePath, 'pai', 'ui'), 'Master Dashboard');
scanDir(path.join(basePath, 'master', 'ui'), 'Master Dashboard');
scanDir(path.join(basePath, 'events', 'ui'), 'Events');

// For Globals, we know there are 14 generic cards in _baseCards, let's inject them:
const genericGlobals = ['eurusd', 'usdjpy', 'nikkei', 'ftse', 'dax', 'hangseng', 'shanghai', 'cac40', 'eurostoxx', 'copper', 'natgas', 'wheat', 'aluminum', 'move'];
for (const gg of genericGlobals) {
    results.push({
        cardId: gg,
        cardName: gg.toUpperCase() + " (Generic)",
        page: "Global",
        appliesTo: "both",
        existingPromptKey: null,
        hasChatSection: true,
        requiredDataFields: ["value"],
        currentPromptText: null,
        notes: "Rendered via GenericGlobalCard"
    });
}

fs.writeFileSync('c:\\project\\ALLBACKUP\\Praxis\\inventory.json', JSON.stringify(results, null, 2));
console.log(`TOTAL CARDS FOUND: ${results.length}`);
