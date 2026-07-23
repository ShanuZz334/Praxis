const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `import { useOptionsCompositeScore } from '../../options/engine/useOptionsCompositeScore';`,
    `import { useOptionsCompositeScore } from '../../options/engine/useOptionsCompositeScore';\nimport { useGlobalComposite } from '../../foreign/engine/useGlobalComposite';`
);

content = content.replace(
    `const [dbFallbackData, setDbFallbackData] = useState({});`,
    `const [dbFallbackData, setDbFallbackData] = useState({});\n    const [globalOverrides, setGlobalOverrides] = useState({});`
);

content = content.replace(
    `    // Fetch all real-time data + fallback
    useEffect(() => {`,
    `    // Load global overrides from local storage once
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('praxis_manual_overrides_global');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed['global_macro']) {
                        setGlobalOverrides(parsed['global_macro']);
                    }
                }
            } catch(e) {}
        }
    }, []);

    // Fetch all real-time data + fallback
    useEffect(() => {`
);

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

content = content.replace(
    `const globScore = dbFallbackData?.global?.composite_score ?? null;`,
    `const globScore = globalEngine?.compositeScore ?? dbFallbackData?.global?.composite_score ?? null;`
);

content = content.replace(
    `global: dbFallbackData?.global?.counts,`,
    `global: parseEngineCounts(Object.fromEntries(Object.entries(globalEngine?.cardData || {}).map(([k, v]) => [k, v?.score])), 'GLOB', globalEngine?.cards) || dbFallbackData?.global?.counts,`
);

fs.writeFileSync(file, content);
console.log('All patches applied successfully!');
