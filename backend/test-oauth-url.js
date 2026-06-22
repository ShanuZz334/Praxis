import dotenv from 'dotenv';
dotenv.config();

const UPSTOX_AUTH_URL = "https://api.upstox.com/v2/login/authorization/dialog";

const apiKey = process.env.UPSTOX_API_KEY;
const redirectUri = process.env.UPSTOX_REDIRECT_URI;

console.log("=== Upstox OAuth URL Test ===");
console.log("API Key:", apiKey);
console.log("Redirect URI:", redirectUri);
console.log("Encoded Redirect URI:", encodeURIComponent(redirectUri));

const authUrl = `${UPSTOX_AUTH_URL}?client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

console.log("\nFull Authorization URL:");
console.log(authUrl);
