// Find which babel parser vite:react-babel uses
const path = require("path");
const viteBabelPath = require.resolve("@vitejs/plugin-react");
console.log("vite react plugin at:", viteBabelPath);
const babelPath = path.join(path.dirname(viteBabelPath), "..", "@babel", "parser");
console.log("expected babel path:", babelPath);
