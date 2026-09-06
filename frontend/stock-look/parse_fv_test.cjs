const { parse } = require("./node_modules/@babel/parser");
const fs = require("fs");
const code = fs.readFileSync("./fv_test.jsx", "utf8");
try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    console.log("FV TEST PARSES OK");
} catch(e) {
    console.log("FV TEST ERROR:", e.message, JSON.stringify(e.loc));
}
