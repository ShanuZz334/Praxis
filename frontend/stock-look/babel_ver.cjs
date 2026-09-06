const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("./node_modules/@babel/parser/package.json", "utf8"));
console.log("@babel/parser version:", pkg.version);
