const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state declaration
content = content.replace(
    "const [fvPAE, setFvPAE] = useState(null);",
    "const [fvPAE, setFvPAE] = useState(null);\n    const [fvModel, setFvModel] = useState(null);"
);

// 2. Add to toggle off
content = content.replace(
    "setFvBias(null);\n            setFvRisk('');\n            setFvPAE(null);",
    "setFvBias(null);\n            setFvRisk('');\n            setFvPAE(null);\n            setFvModel(null);"
);

// 3. Add to triggerFutureVision success
content = content.replace(
    "setFvBias(overall_bias || 'neutral');\n            setFvRisk(key_risk || '');\n            setFvActive(true);",
    "setFvBias(overall_bias || 'neutral');\n            setFvRisk(key_risk || '');\n            setFvModel(res.data.modelUsed);\n            setFvActive(true);"
);

// 4. Add to useEffect restore
content = content.replace(
    "setFvBias(session.bias);\n            setFvRisk(session.risk || '');\n            setFvActive(true);",
    "setFvBias(session.bias);\n            setFvRisk(session.risk || '');\n            setFvModel(session.modelUsed || null);\n            setFvActive(true);"
);

// 5. Add to useEffect restore clear
content = content.replace(
    "setFvActive(false);\n            setFvBias(null);\n            setFvRisk('');\n            setFvPAE(null);\n            fvSessionRef.current = null;",
    "setFvActive(false);\n            setFvBias(null);\n            setFvRisk('');\n            setFvPAE(null);\n            setFvModel(null);\n            fvSessionRef.current = null;"
);

fs.writeFileSync(path, content);
console.log("Done");
