export function validateOutput(text, jsonMode, schema) {
    if (!jsonMode) return { parsed: null, raw: text };
    
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.substring(7);
    else if (clean.startsWith('```')) clean = clean.substring(3);
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
    clean = clean.trim();

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
