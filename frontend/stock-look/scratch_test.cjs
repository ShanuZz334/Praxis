const { calculateGreeks } = require('./src/features/dashboard/options/engine/blackScholesEngine.js');
console.log(calculateGreeks(24206.9, 24150, 2.04, 0.07, 0.15, 'call'));
console.log(calculateGreeks(24206.9, 24150, 0.001, 0.07, 0.15, 'call'));
