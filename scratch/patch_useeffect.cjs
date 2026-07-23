const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

const target = `    // Fetch all real-time data + fallback
    useEffect(() => {`;
const targetAlt = `    // Fetch all real-time data + fallback\r\n    useEffect(() => {`;

const replacement = `    // Load global overrides from local storage once
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('praxis_manual_overrides_global');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed['global_macro']) {
                        setGlobalOverrides(parsed['global_macro']);
                    }
                }
            } catch(e) {}
        }
    }, []);

    // Fetch all real-time data + fallback
    useEffect(() => {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
} else if (content.includes(targetAlt)) {
    content = content.replace(targetAlt, replacement);
} else {
    console.log("Could not find target block");
}

fs.writeFileSync(file, content);
console.log('Fixed useEffect successfully!');
