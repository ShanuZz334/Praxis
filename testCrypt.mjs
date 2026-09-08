import { encrypt as e1, decrypt as d1 } from "./backend/ai-gateway/utils/encryption.js";
import { encrypt as e2, decrypt as d2 } from "./backend/utils/encryption.js";

const testString = "super_secret_api_key_123";
try {
    const enc1 = e1(testString);
    console.log("Gateway encrypted:", enc1);
    
    // Try to decrypt it with Core
    const dec2 = d2(enc1);
    console.log("Core decrypted:", dec2);
} catch(e) {
    console.log("Core failed to decrypt Gateway's token:", e.message);
}
