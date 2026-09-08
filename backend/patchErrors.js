import fs from 'fs';

let content = fs.readFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/fundamentalsController.js', 'utf8');
content = content.replace(
    'res.status(500).json({ error: "Internal server error while fetching fundamentals" });',
    'res.status(500).json({ error: "Internal server error", details: error.message, stack: error.stack });'
);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/fundamentalsController.js', content);

let tech = fs.readFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/technicalsController.js', 'utf8');
tech = tech.replace(
    'res.status(500).json({ success: false, error: "Internal server error" });',
    'res.status(500).json({ success: false, error: "Internal server error", details: error.message, stack: error.stack });'
);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/technicalsController.js', tech);
