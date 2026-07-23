const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

// Patch 1: Imports
content = content.replace(
    `import { useOptionsCompositeScore } from '../../options/engine/useOptionsCompositeScore';`,
    `import { useOptionsCompositeScore } from '../../options/engine/useOptionsCompositeScore';\nimport { useGlobalComposite } from '../../foreign/engine/useGlobalComposite';`
);

// Patch 2: globalOverrides state
content = content.replace(
    `const [dbFallbackData, setDbFallbackData] = useState({});`,
    `const [dbFallbackData, setDbFallbackData] = useState({});\n    const [globalOverrides, setGlobalOverrides] = useState({});`
);

// Patch 3: Load overrides useEffect
content = content.replace(
    `// Fetch all real-time data + fallback\n    useEffect(() => {`,
    `// Load global overrides from local storage once\n    useEffect(() => {\n        if (typeof window !== 'undefined') {\n            try {\n                const stored = localStorage.getItem('praxis_manual_overrides_global');\n                if (stored) {\n                    const parsed = JSON.parse(stored);\n                    if (parsed && parsed['global_macro']) {\n                        setGlobalOverrides(parsed['global_macro']);\n                    }\n                }\n            } catch(e) {}\n        }\n    }, []);\n\n    // Fetch all real-time data + fallback\n    useEffect(() => {`
);

// Patch 4: Global Engine instantiation
const globalEngineLogic = `
    // Global Engine (Hooks)
    const globalLiveData = useMemo(() => {
        return {
            dxy: livePrices?.['GLOBAL_INDICATOR|DXY']?.ltp || null,
            usd_inr: livePrices?.['GLOBAL_INDICATOR|USDINR']?.ltp || null,
            crude: livePrices?.['GLOBAL_INDICATOR|BZUSD']?.ltp || null,
            gold: livePrices?.['GLOBAL_INDICATOR|GOLD']?.ltp || null,
            silver: livePrices?.['GLOBAL_INDICATOR|SILV']?.ltp || null,
            us_10y_yield: livePrices?.['GLOBAL_INDICATOR|US10Y']?.ltp || null,
            sp_futures: livePrices?.['GLOBAL_INDICATOR|ES1']?.ltp || null,
            nasdaq_futures: livePrices?.['GLOBAL_INDICATOR|NQ1']?.ltp || null,
            dow_futures: livePrices?.['GLOBAL_INDICATOR|YM1']?.ltp || null,
            vix: livePrices?.['GLOBAL_INDICATOR|VIX']?.ltp || null,
            bitcoin: livePrices?.['GLOBAL_INDICATOR|BTCUSD']?.ltp || null,
            eurusd: livePrices?.['GLOBAL_INDICATOR|EURUSD']?.ltp || null,
            usdjpy: livePrices?.['GLOBAL_INDICATOR|USDJPY']?.ltp || null,
            nikkei: livePrices?.['GLOBAL_INDICATOR|NIY']?.ltp || null,
            ftse: livePrices?.['GLOBAL_INDICATOR|Z1']?.ltp || null,
            dax: livePrices?.['GLOBAL_INDICATOR|FDAX']?.ltp || null,
            hangseng: livePrices?.['GLOBAL_INDICATOR|HSI']?.ltp || null,
            shanghai: livePrices?.['GLOBAL_INDICATOR|SSEC']?.ltp || null,
            cac40: livePrices?.['GLOBAL_INDICATOR|FCE']?.ltp || null,
            eurostoxx: livePrices?.['GLOBAL_INDICATOR|FESX']?.ltp || null,
            copper: livePrices?.['GLOBAL_INDICATOR|HG1']?.ltp || null,
            natgas: livePrices?.['GLOBAL_INDICATOR|NG1']?.ltp || null,
            wheat: livePrices?.['GLOBAL_INDICATOR|ZW1']?.ltp || null,
            aluminum: livePrices?.['GLOBAL_INDICATOR|ALI1']?.ltp || null,
            move: livePrices?.['GLOBAL_INDICATOR|MOVE']?.ltp || null
        };
    }, [livePrices]);
    
    const globalEngine = useGlobalComposite(globalOverrides, globalLiveData);
`;

content = content.replace(
    `const optionsEngine = useOptionsCompositeScore(optionsMetrics, selectedInstrument);`,
    `const optionsEngine = useOptionsCompositeScore(optionsMetrics, selectedInstrument);\n` + globalEngineLogic
);

// Patch 5: Final Aggregation globScore
content = content.replace(
    `const globScore = dbFallbackData?.global?.composite_score ?? null;`,
    `const globScore = globalEngine?.compositeScore ?? dbFallbackData?.global?.composite_score ?? null;`
);

// Patch 6: activeCounts - parseEngineCounts now expects engineRawScores (value mapping). globalEngine.cardData provides it.
// We map cardData to { id: score } for parseEngineCounts.
content = content.replace(
    `global: dbFallbackData?.global?.counts,`,
    `global: parseEngineCounts(Object.fromEntries(Object.entries(globalEngine?.cardData || {}).map(([k, v]) => [k, v?.score])), 'GLOB', globalEngine?.cards) || dbFallbackData?.global?.counts,`
);

fs.writeFileSync(file, content);
console.log('All patches applied successfully!');
