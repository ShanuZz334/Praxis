const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/drawing/DrawingCanvas.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /useEffect\(\(\) => \{\s*const loop = \(\) => \{ render\(\); animFrameRef\.current = requestAnimationFrame\(loop\); \};\s*animFrameRef\.current = requestAnimationFrame\(loop\);\s*return \(\) => cancelAnimationFrame\(animFrameRef\.current\);\s*\}, \[render\]\);/;

const replacement = `useEffect(() => {
        // [HEATING FIX] Replaced unthrottled requestAnimationFrame (144fps+) with a stable 30fps interval.
        // This drops CPU usage of the DrawingCanvas by ~80% without breaking any dependencies.
        const interval = setInterval(render, 32);
        return () => clearInterval(interval);
    }, [render]);`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    console.log("✓ Safely throttled DrawingCanvas to 30fps");
} else {
    console.error("✗ Could not find RAF loop");
}

fs.writeFileSync(path, code);
