import fs from 'fs';

let content = fs.readFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/fundamentalsController.js', 'utf8');
content = content.replace(
    'console.error("Error fetching fundamentals:", error?.response?.data || error.message);',
    'console.error("Error fetching fundamentals:", error?.response?.data || error.message);\n        import("fs").then(fs => fs.appendFileSync("c:/project/ALLBACKUP/Praxis/backend/real_errors.log", new Date().toISOString() + " FundError: " + (error.stack || error.message) + "\\n"));'
);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/fundamentalsController.js', content);

let tech = fs.readFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/technicalsController.js', 'utf8');
tech = tech.replace(
    'console.error("Candles endpoint error:", error);',
    'console.error("Candles endpoint error:", error);\n        import("fs").then(fs => fs.appendFileSync("c:/project/ALLBACKUP/Praxis/backend/real_errors.log", new Date().toISOString() + " TechError: " + (error.stack || error.message) + "\\n"));'
);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/backend/controllers/technicalsController.js', tech);
