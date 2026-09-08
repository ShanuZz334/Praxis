const parser = require('@babel/parser');
const fs = require('fs');
const code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx"
    ]
  });
  console.log("Parsed successfully!");
} catch (e) {
  console.log(e.message);
  console.log("Line: " + e.loc.line + " Col: " + e.loc.column);
}
