const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('C:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  
  // Replace: score: 0, bias: 'Unknown', confidence: 0
  // or bias: "Unknown", confidence: "0%"
  content = content.replace(/score:\s*0,\s*bias:\s*(['"])Unknown\1/g, 'score: null, bias: $1Unknown$1');
  
  // Also neutral + 0 confidence
  content = content.replace(/score:\s*0,\s*bias:\s*(['"])Neutral\1,\s*confidence:\s*(0|['"]0%['"])/g, 'score: null, bias: $1Neutral$1, confidence: $2');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
});
console.log('Fixed ' + count + ' engine/card files');
