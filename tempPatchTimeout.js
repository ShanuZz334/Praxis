const fs = require('fs');

const files = [
    'backend/ai-gateway/providers/openrouterProvider.js',
    'backend/ai-gateway/providers/groqProvider.js',
    'backend/ai-gateway/providers/geminiProvider.js',
    'backend/ai-gateway/providers/ollamaProvider.js'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Update signature to include timeoutMs
    content = content.replace(/call\(\{\s*model,\s*messages,\s*maxTokens,\s*temperature,\s*jsonMode,\s*providerId\s*=\s*'[^']+'\s*\}\)/g, 
        match => match.replace('}', ', timeoutMs }'));
        
    // For Groq it didn't have AbortSignal, let's add it
    if (file.includes('groqProvider')) {
        content = content.replace(/const response = await fetch\(endpoint, \{\s*method: 'POST',/g,
            "const response = await fetch(endpoint, {\n        method: 'POST',\n        signal: AbortSignal.timeout(timeoutMs || 45000),");
    } else {
        // Replace existing hardcoded ones
        content = content.replace(/AbortSignal\.timeout\(\d+\)/g, 'AbortSignal.timeout(timeoutMs || 45000)');
    }
    
    fs.writeFileSync(file, content);
}
