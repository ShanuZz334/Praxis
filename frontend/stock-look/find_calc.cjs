const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const idx = code.indexOf("Calculator Keybindings Customization");
console.log("Found at byte:", idx, "line:", code.substring(0,idx).split("\n").length);
// Show the end of the Calc section
const endSearch = code.indexOf("</div>", code.indexOf("</div>", code.indexOf("</div>", idx + 1000)));
console.log("Area after calc section:", JSON.stringify(code.substring(idx + 800, idx + 1200)));
