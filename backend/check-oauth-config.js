import dotenv from 'dotenv';
dotenv.config();

console.log("=== Upstox OAuth Configuration Check ===\n");

const apiKey = process.env.UPSTOX_API_KEY;
const apiSecret = process.env.UPSTOX_API_SECRET;
const redirectUri = process.env.UPSTOX_REDIRECT_URI;

console.log("✓ API Key:", apiKey);
console.log("✓ API Secret:", apiSecret ? "***" + apiSecret.slice(-4) : "NOT SET");
console.log("✓ Redirect URI:", redirectUri);

console.log("\n=== What Should Be in Upstox Developer Console ===");
console.log("App Name: API Sandbox (or your app name)");
console.log("Redirect URL field should contain EXACTLY:");
console.log("  →", redirectUri);
console.log("\nNOTE: It should NOT be:");
console.log("  ✗ https://stocky-shanuzz334s-projects.vercel.app/dashboard/about");
console.log("  ✗ http://localhost:5173/oauth/upstox/callback");
console.log("  ✓ http://localhost:5000/oauth/upstox/callback");

const UPSTOX_AUTH_URL = "https://api.upstox.com/v2/login/authorization/dialog";
const authUrl = `${UPSTOX_AUTH_URL}?client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

console.log("\n=== Generated Authorization URL ===");
console.log(authUrl);

console.log("\n=== URL Parameters Breakdown ===");
console.log("client_id:", apiKey);
console.log("redirect_uri (encoded):", encodeURIComponent(redirectUri));
console.log("response_type: code");
