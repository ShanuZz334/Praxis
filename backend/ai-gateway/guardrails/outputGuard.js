function autoRepairJson(str) {
    let inString = false;
    let escapeNext = false;
    const stack = [];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{' || char === '[') stack.push(char);
            else if (char === '}') {
                if (stack[stack.length - 1] === '{') stack.pop();
            } else if (char === ']') {
                if (stack[stack.length - 1] === '[') stack.pop();
            }
        }
    }

    let repaired = str;
    if (inString) repaired += '"';
    
    // Reverse stack and close
    while (stack.length > 0) {
        const char = stack.pop();
        if (char === '{') repaired += '}';
        if (char === '[') repaired += ']';
    }

    return repaired;
}

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
        
        if (firstIdx !== -1 && lastIdx !== -1) {
            // If the model cut off, lastIdx might be a random closing bracket, not the real end.
            // But let's try the bounded slice first.
            clean = clean.substring(firstIdx, Math.max(lastIdx + 1, clean.length)).trim();
        } else if (firstIdx !== -1) {
            clean = clean.substring(firstIdx).trim();
        }
    }

    let parsed;
    try {
        parsed = JSON.parse(clean);
    } catch (e) {
        console.warn(`[OutputGuard] JSON parse failed (${e.message}). Attempting iterative auto-repair...`);
        let success = false;
        // Try trimming up to 150 characters from the end to find a valid truncation point (handles dangling keys, commas, etc)
        for (let i = 0; i < 150; i++) {
            if (clean.length - i <= 0) break;
            const temp = clean.slice(0, clean.length - i);
            const repaired = autoRepairJson(temp);
            try {
                parsed = JSON.parse(repaired);
                console.log(`[OutputGuard] Auto-repair successful! Trimmed ${i} broken characters.`);
                clean = repaired;
                success = true;
                break;
            } catch (e2) {}
        }
        if (!success) {
            throw new Error(`Malformed JSON output. Auto-repair failed completely.`);
        }
    }

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
}
