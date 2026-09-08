const fs = require('fs');

let content = fs.readFileSync('backend/routes/aiSettingsRoutes.js', 'utf8');

const livenessFunc = `
async function verifyProviderKey(providerId, baseUrl, apiKey) {
    if (providerId === 'ollama' || !apiKey) return true;
    const url = baseUrl || (providerId === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1');
    const endpoint = url.endsWith('/models') ? url : url.replace('/chat/completions', '') + '/models';
    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(5000)
        });
        if (res.status === 401 || res.status === 403) {
            throw new Error(`Invalid API Key for ${providerId}`);
        }
        return true;
    } catch(e) {
        if (e.message.includes('Invalid API Key')) throw e;
        return true;
    }
}

`;

content = content.replace('const router = express.Router();', livenessFunc + 'const router = express.Router();');

// Patch POST
content = content.replace(
    'if (body.apiKey) body.apiKey = encrypt(body.apiKey);',
    'if (body.apiKey) {\n            await verifyProviderKey(body.providerId, body.baseUrl, body.apiKey);\n            body.apiKey = encrypt(body.apiKey);\n        }'
);

// Patch PUT
content = content.replace(
    "if (body.apiKey && !body.apiKey.includes('...')) {",
    "if (body.apiKey && !body.apiKey.includes('...')) {\n            await verifyProviderKey(body.providerId, body.baseUrl, body.apiKey);"
);

fs.writeFileSync('backend/routes/aiSettingsRoutes.js', content);
