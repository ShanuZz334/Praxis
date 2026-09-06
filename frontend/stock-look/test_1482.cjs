const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const lines = code.split("\n");

// The insertion point is after line 1482 in original (</div> before )})
// Test if parsing succeeds up to that exact point
const truncated = lines.slice(0, 1482).join("\n") + "\n    );\n}\n";
try {
    parse(truncated, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("Truncated at 1482 PASSES");
} catch(e) {
    console.log("Truncated at 1482 FAILS:", e.message, JSON.stringify(e.loc));
    // Show surrounding bytes
    const idx = e.loc?.index || 0;
    console.log("Context:", JSON.stringify(code.substring(Math.max(0, idx-300), idx+100)));
}
