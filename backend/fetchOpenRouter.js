import fetch from 'node-fetch';

async function run() {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0").map(m => m.id);
    console.log("Zero-cost OpenRouter Models:");
    console.log(freeModels);
}
run();
