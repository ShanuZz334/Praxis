const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/drawing/DrawingCanvas.jsx', 'utf8');

const regex = /if \(canvas\.width !== W \* dpr \|\| canvas\.height !== H \* dpr\) \{\n\s*canvas\.width = W \* dpr;\n\s*canvas\.height = H \* dpr;\n\s*\}/m;

const replacement = `const targetW = Math.floor(W * dpr);
        const targetH = Math.floor(H * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/drawing/DrawingCanvas.jsx', code);
console.log("Canvas reallocation bug patched");
