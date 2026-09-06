const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
console.log("Byte 85518 context:", JSON.stringify(code.substring(85418, 85620)));
