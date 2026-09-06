export function validateOutput(text, jsonMode, schema) {
    if (!jsonMode) return { parsed: null, raw: text };
    
    let clean = text.trim();
    
    // Attempt to extract JSON block using regex if markdown is present anywhere
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        clean = jsonMatch[1].trim();
    } else {
        // Fallback: Try to find the first '{' or '[' and last '}' or ']'
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        const firstIdx = (firstBrace !== -1 && firstBracket !== -1) 
            ? Math.min(firstBrace, firstBracket) 
            : Math.max(firstBrace, firstBracket);
            
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');
        const lastIdx = Math.max(lastBrace, lastBracket);
        
        if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
            clean = clean.substring(firstIdx, lastIdx + 1).trim();
        }
    }

    try {
        const parsed = JSON.parse(clean);
        if (schema) {
            for (const key of Object.keys(schema)) {
                if (parsed[key] === undefined) {
                    throw new Error(`Missing expected key: ${key}`);
                }
            }
        }
        return { parsed, raw: clean };
    } catch (e) {
        throw new Error(`Malformed JSON output: ${e.message}`);
    }
}
