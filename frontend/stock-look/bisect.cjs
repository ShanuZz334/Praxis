const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");

// Binary search: find the exact byte where parse first fails
let lo = 0;
let hi = code.length;
let lastOk = 0;

// Step through in chunks of 500 bytes
for (let i = 500; i <= code.length; i += 500) {
    const chunk = code.substring(0, i) + "\n}\n";
    try {
        parse(chunk, { sourceType: "module", plugins: ["jsx", "typescript"] });
        lastOk = i;
    } catch(e) {
        // First failure
        console.log("First failure around byte:", i, "lastOk:", lastOk);
        console.log("Error:", e.message, JSON.stringify(e.loc));
        // Show what's in that 500-byte window
        console.log("Content in window:", JSON.stringify(code.substring(lastOk, i)));
        break;
    }
}
