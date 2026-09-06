const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("./node_modules/@vitejs/plugin-react/package.json", "utf8"));
console.log("@vitejs/plugin-react version:", pkg.version);
console.log("Dependencies:", JSON.stringify(pkg.dependencies, null, 2));
