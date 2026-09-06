const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// Find all unclosed/mismatched JSX tags in lines 1380-1510
// Simple stack-based tracker
const stack = [];
const issues = [];

for (let i = 1379; i < 1510 && i < lines.length; i++) {
    const line = lines[i];
    // Match self-closing tags
    const selfClose = line.match(/<([A-Za-z][A-Za-z0-9.]*)[^>]*\/>/g) || [];
    // Match opening tags (not self-closing)
    const opens = line.match(/<([A-Za-z][A-Za-z0-9.]*)(?:\s[^>]*)?>(?!\/)/g) || [];
    // Match closing tags
    const closes = line.match(/<\/([A-Za-z][A-Za-z0-9.]*)>/g) || [];
    
    opens.forEach(tag => {
        const name = tag.match(/<([A-Za-z][A-Za-z0-9.]*)/)[1];
        if (!["input","br","hr","img","meta","link"].includes(name.toLowerCase())) {
            stack.push({ name, line: i+1 });
        }
    });
    closes.forEach(tag => {
        const name = tag.match(/<\/([A-Za-z][A-Za-z0-9.]*)>/)[1];
        if (stack.length && stack[stack.length-1].name === name) {
            stack.pop();
        } else {
            issues.push({ type: "UNEXPECTED_CLOSE", name, line: i+1 });
        }
    });
}

console.log("Unclosed stack at line 1510:", JSON.stringify(stack));
console.log("Issues:", JSON.stringify(issues));
