export function validateOutput(text, jsonMode, schema) {
    if (!jsonMode) return { parsed: null, raw: text };
    
    let clean = text.trim();
    
    // Attempt to extract JSON block using regex if markdown is present anywhere
    // Added support for <think> tags from Level 5 reasoners (Bug 15)
    clean = clean.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        clean = jsonMatch[1].trim();
    } else {
        // Bug 12 Fix: Safely find outer JSON boundaries without breaking on trailing text
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');

        let firstIdx = -1;
        let lastIdx = -1;

        if (firstBrace !== -1 && firstBracket !== -1) {
            if (firstBrace < firstBracket) { firstIdx = firstBrace; lastIdx = lastBrace; }
            else { firstIdx = firstBracket; lastIdx = lastBracket; }
        } else if (firstBrace !== -1) {
            firstIdx = firstBrace; lastIdx = lastBrace;
        } else if (firstBracket !== -1) {
            firstIdx = firstBracket; lastIdx = lastBracket;
        }
        
        if (firstIdx !== -1 && lastIdx !== -1 && lastIdx >= firstIdx) {
            clean = clean.substring(firstIdx, lastIdx + 1).trim();
        }
    }

    try {
        const parsed = JSON.parse(clean);
        // Bug 13 Fix: Default Injection instead of Strict Discarding
        if (schema) {
            for (const [key, defaultVal] of Object.entries(schema)) {
                if (parsed[key] === undefined) {
                    console.warn(`[OutputGuard] Missing key: ${key}, injecting default.`);
                    parsed[key] = defaultVal;
                }
            }
        }
        return { parsed, raw: clean };
    } catch (e) {
        throw new Error(`Malformed JSON output: ${e.message}`);
    }
}
