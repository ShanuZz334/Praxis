const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/utils/predictionAccuracyEngine.js';
let code = fs.readFileSync(path, 'utf8');

const regex = /const wis = intervalWidth \+ \(2 \/ ALPHA\) \* undershoot \+ \(2 \/ ALPHA\) \* overshoot;/;

const newLogic = `const wis = intervalWidth + (2 / ALPHA) * undershoot + (2 / ALPHA) * overshoot;

    // Institutional composite accuracy score (0-100)
    // 1. Directional alignment (weight: 40%)
    // 2. Close price proximity to predicted close relative to the predicted volatility range (weight: 60%)
    const range = Math.max(pred.high - pred.low, real.high - real.low, 0.01);
    const closeError = Math.abs(real.close - pred.close);
    // If close error is 0, precision is 60. If close error is equal to the full range, precision is 0.
    const precisionScore = Math.max(0, 60 - (closeError / range) * 60);
    const compositeScore = (da === 1 ? 40 : 0) + precisionScore;`;

code = code.replace(regex, newLogic);
code = code.replace(/closeBias,\s*wis,/, 'closeBias,\n        wis,\n        compositeScore,');

fs.writeFileSync(path, code);
console.log("Patched PAE!");
