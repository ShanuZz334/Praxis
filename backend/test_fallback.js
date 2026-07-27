import { fetchWithFallback } from './utils/fetchWithFallback.js';
import rateLimiter from './utils/RateLimitBudgetTracker.js';

async function runTests() {
    console.log("=== Testing fetchWithFallback ===");

    // 1. Test successful unofficial scrape
    const successFetch = async () => 18.5; // Mock Yahoo Forward P/E
    const res1 = await fetchWithFallback('RELIANCE', 'forward_pe', successFetch);
    console.log("Test 1 (Success):", res1);
    // Expected: { value: 18.5, sourcePipeline: 'unofficial_scrape' }

    // 2. Test failing unofficial scrape (should fallback to last_known_good -> manual)
    const failingFetch = async () => { throw new Error('API Timeout'); };
    const res2 = await fetchWithFallback('RELIANCE', 'forward_pe', failingFetch);
    console.log("Test 2 (Failure/Fallback):", res2);
    // Expected: { value: ..., sourcePipeline: 'fallback' } or 'missing' depending on local DB

    console.log("\n=== Testing RateLimitBudgetTracker ===");
    const LIMITS = { requestsPerDay: 5, requestsPerMinute: 2 }; // Tight limits for testing
    const SOURCE = 'TestAPI';

    console.log("Request 1 allowed?", rateLimiter.consume(SOURCE, LIMITS)); // true
    console.log("Request 2 allowed?", rateLimiter.consume(SOURCE, LIMITS)); // true
    console.log("Request 3 allowed (should fail minute limit)?", rateLimiter.consume(SOURCE, LIMITS)); // false

    console.log("Tracker Status:", rateLimiter.getStatus(SOURCE));
}

runTests().catch(console.error);