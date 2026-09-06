const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let content = fs.readFileSync(path, 'utf8');
console.log("Start index of '{/* ─── Future Vision Bias': ", content.indexOf('{/* ─── Future Vision Bias'));
