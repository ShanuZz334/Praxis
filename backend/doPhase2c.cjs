const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/drawing/DrawingCanvas.jsx', 'utf8');

const regex = /const onContextMenu = \(e\) => \{\n\s*if \(activeTool !== 'cursor'\) return;/;
const replacement = `const onContextMenu = (e) => {
            if (activeTool !== 'cursor') {
                e.preventDefault();
                setActiveTool('cursor');
                return;
            }`;

code = code.replace(regex, replacement);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/drawing/DrawingCanvas.jsx', code);
console.log("DrawingCanvas context menu patched");
