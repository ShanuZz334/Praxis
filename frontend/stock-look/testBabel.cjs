const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });
  console.log("SUCCESS");
} catch (e) {
  console.log("ERROR:");
  console.log(e.message);
}
