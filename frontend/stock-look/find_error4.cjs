const fs = require("fs");
const code = fs.readFileSync("./src/features/dashboard/settings/ui/SettingsPage.jsx", "utf8");
const idx = 86450;
console.log("Content around byte 86450:");
console.log(JSON.stringify(code.substring(idx - 200, idx + 300)));
