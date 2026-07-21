const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(process.env.APPDATA || (process.env.USERPROFILE + '/AppData/Roaming'), '../Local/gemini/antigravity/brain/913cc0f3-466b-4dbb-afe0-baaa06808792/card_inventory.json');
// Wait, the path to brain is C:\Users\shanif\.gemini\antigravity\brain\913cc0f3-466b-4dbb-afe0-baaa06808792\card_inventory.json
const correctInventoryPath = 'C:\\Users\\shanif\\.gemini\\antigravity\\brain\\913cc0f3-466b-4dbb-afe0-baaa06808792\\card_inventory.json';

const sidebarPath = path.join(__dirname, '..', 'frontend', 'stock-look', 'src', 'features', 'dashboard', 'pai', 'ui', 'PaiSidebar.jsx');

const inventory = JSON.parse(fs.readFileSync(correctInventoryPath, 'utf8'));

const sections = {
    assistant: {
        id: 'assistant',
        label: 'Assistant',
        icon: 'MessageSquare',
        subSections: [
            {
                id: 'assist_general',
                label: 'General',
                chats: [
                    { id: 'assist_global', title: 'Global Chat', type: 'manual' }
                ]
            }
        ]
    },
    master: {
        id: 'master',
        label: 'Master Dashboard',
        icon: 'LayoutDashboard',
        subSections: [
            {
                id: 'master_general',
                label: 'General',
                chats: [
                    { id: 'master_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'master_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    fundamental: {
        id: 'fundamental',
        label: 'Fundamental',
        icon: 'TrendingUp',
        subSections: [
            {
                id: 'fund_general',
                label: 'General',
                chats: [
                    { id: 'fundamentals_index_header', title: 'Index Header Insight', type: 'header' },
                    { id: 'fundamentals_company_header', title: 'Company Header Insight', type: 'header' },
                    { id: 'fund_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    technical: {
        id: 'technical',
        label: 'Technical',
        icon: 'LineChart',
        subSections: [
            {
                id: 'tech_general',
                label: 'General',
                chats: [
                    { id: 'technical_index_header', title: 'Index Header Insight', type: 'header' },
                    { id: 'technical_company_header', title: 'Company Header Insight', type: 'header' },
                    { id: 'tech_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    options: {
        id: 'options',
        label: 'Options',
        icon: 'CandlestickChart',
        subSections: [
            {
                id: 'opt_general',
                label: 'General',
                chats: [
                    { id: 'options_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'opt_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    events: {
        id: 'events',
        label: 'Events',
        icon: 'Calendar',
        subSections: [
            {
                id: 'events_general',
                label: 'General',
                chats: [
                    { id: 'events_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'events_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    foreign: {
        id: 'global',
        label: 'Global Macro',
        icon: 'Globe',
        subSections: [
            {
                id: 'glob_general',
                label: 'General',
                chats: [
                    { id: 'foreign_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'glob_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    }
};

const sanitizeId = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '_');

inventory.forEach(card => {
    // Only include cards with hasChatSection = true OR if we want to show all wired cards
    // Wait, the prompt says "is all the cards pages are correctly connected, i dont see all the cards names here". They expect to see ALL cards here so they can configure prompts for them.
    // Yes, we wired all 121 cards to the gateway, even if some don't have a chat section UI in the dashboard, they still have an AI route in the backend. Let's add them all.
    
    // Some cards like 'praxis_composite_header' are already handled by headers, skip them if they are headers.
    if (card.cardId.endsWith('_header')) return;
    
    let mainCategory = 'master';
    let subCategory = 'Cards';
    
    if (card.page === 'Master Dashboard') {
        mainCategory = 'master';
        subCategory = 'Widgets';
    } else if (card.page.startsWith('Fundamental')) {
        mainCategory = 'fundamental';
        subCategory = card.page.includes('>') ? card.page.split('>')[1].trim() : 'General';
    } else if (card.page.startsWith('Technical')) {
        mainCategory = 'technical';
        subCategory = card.page.includes('>') ? card.page.split('>')[1].trim() : 'General';
    } else if (card.page.startsWith('Option')) {
        mainCategory = 'options';
        subCategory = card.page.includes('>') ? card.page.split('>')[1].trim() : 'General';
    } else if (card.page.startsWith('Events')) {
        mainCategory = 'events';
        subCategory = card.page.includes('>') ? card.page.split('>')[1].trim() : 'General';
    } else if (card.page.startsWith('Global') || card.page.startsWith('Foreign')) {
        mainCategory = 'foreign';
        subCategory = card.page.includes('>') ? card.page.split('>')[1].trim() : 'General';
    } else {
        mainCategory = 'master'; // fallback
        subCategory = 'Uncategorized';
    }

    const section = sections[mainCategory];
    if (section) {
        let subSecId = `${mainCategory}_${sanitizeId(subCategory)}`;
        let subSec = section.subSections.find(s => s.id === subSecId);
        if (!subSec) {
            subSec = {
                id: subSecId,
                label: subCategory,
                chats: []
            };
            section.subSections.push(subSec);
        }
        
        // Prevent duplicates
        if (!subSec.chats.find(c => c.id === card.cardId)) {
            subSec.chats.push({
                id: card.cardId,
                title: card.cardName,
                type: 'card'
            });
        }
    }
});

// Format to JS string
let jsString = 'const INITIAL_SECTIONS = [\n';
const sectionKeys = ['assistant', 'master', 'fundamental', 'technical', 'options', 'events', 'foreign'];

sectionKeys.forEach((key, sIdx) => {
    const s = sections[key];
    jsString += `    {\n`;
    jsString += `        id: '${s.id}',\n`;
    jsString += `        label: '${s.label}',\n`;
    jsString += `        icon: ${s.icon},\n`;
    jsString += `        subSections: [\n`;
    s.subSections.forEach((sub, subIdx) => {
        jsString += `            {\n`;
        jsString += `                id: '${sub.id}',\n`;
        jsString += `                label: '${sub.label}',\n`;
        jsString += `                chats: [\n`;
        sub.chats.forEach((chat, cIdx) => {
            jsString += `                    { id: '${chat.id}', title: '${chat.title.replace(/'/g, "\\'")}', type: '${chat.type}' }${cIdx < sub.chats.length - 1 ? ',' : ''}\n`;
        });
        jsString += `                ]\n`;
        jsString += `            }${subIdx < s.subSections.length - 1 ? ',' : ''}\n`;
    });
    jsString += `        ]\n`;
    jsString += `    }${sIdx < sectionKeys.length - 1 ? ',' : ''}\n`;
});
jsString += '];';

let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const regex = /const INITIAL_SECTIONS = \[[\s\S]*?\];/;
if (regex.test(sidebarContent)) {
    sidebarContent = sidebarContent.replace(regex, jsString);
    fs.writeFileSync(sidebarPath, sidebarContent);
    console.log('Successfully updated PaiSidebar.jsx');
} else {
    console.error('Could not find INITIAL_SECTIONS in PaiSidebar.jsx');
}
