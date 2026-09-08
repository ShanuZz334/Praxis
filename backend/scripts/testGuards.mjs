import { validateInput } from "../ai-gateway/guardrails/inputGuard.js";
import { validateOutput } from "../ai-gateway/guardrails/outputGuard.js";

console.log("--- Testing Input Guard ---");
try {
    validateInput({ taskType: "chart_qa", prompt: "Hello", data: null });
    console.log("FAILED: Expected chart_qa with null data to throw!");
} catch (e) {
    console.log("SUCCESS: chart_qa caught missing data ->", e.message);
}

console.log("\n--- Testing Output Guard (Trailing Garbage) ---");
const rawJsonWithGarbage = "Here is your output:\n```json\n{\"result\": \"success\", \"arr\": [1, 2]}\n```\n[End of JSON]";
const parsed1 = validateOutput(rawJsonWithGarbage, true);
console.log("SUCCESS: Parsed trailing garbage properly ->", parsed1.parsed);

console.log("\n--- Testing Output Guard (Missing Schema Keys) ---");
const rawJsonMissing = "{\"name\": \"test\"}";
const schema = { name: "string", description: "Default Desc" };
const parsed2 = validateOutput(rawJsonMissing, true, schema);
console.log("SUCCESS: Injected default schema values ->", parsed2.parsed);
