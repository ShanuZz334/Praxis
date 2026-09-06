import fs from 'fs';
let fileText = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

const importTarget = `import { useTheme } from '../../context/ThemeContext';\r\nimport { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';`;
const importReplacement = `import { useTheme } from '../../context/ThemeContext';\r\nimport { FO_INDICES, FO_EQUITIES } from '../../utils/foInstruments';\r\nimport { assembleContext, getFVSettings } from '../../utils/futureVisionContextAssembler';\r\nimport { storePrediction, scoreClosedCandle, getPAESession, clearPAESession, computeConfidence } from '../../utils/predictionAccuracyEngine';\r\nimport axiosInstance from '../../utils/axiosInstance';\r\nimport { useDataRegistry } from '../../context/DataRegistryContext';\r\nimport { Telescope, Loader2 } from 'lucide-react';`;

fileText = fileText.replace(importTarget, importReplacement);

const stateTarget = `    const { theme } = useTheme();\r\n    const isLight = theme === 'light';`;
const stateReplacement = `    const { theme, tradingMode } = useTheme();\r\n    const bandsMode = tradingMode === 'intraday' ? 'scalp' : (tradingMode || 'swing');\r\n    const isLight = theme === 'light';\r\n\r\n    const { getMasterSnapshot } = useDataRegistry();\r\n\r\n    const [fvActive, setFvActive] = useState(false);\r\n    const [fvLoading, setFvLoading] = useState(false);\r\n    const [fvBias, setFvBias] = useState(null);\r\n    const [fvRisk, setFvRisk] = useState('');\r\n    const [fvPAE, setFvPAE] = useState(null);\r\n\r\n    const fvSessionRef = useRef(null);\r\n    const fvLiveBarIndexRef = useRef(0);\r\n    const ghostCandleSeriesRef = useRef(null);\r\n    const ghostUpperConeRef = useRef(null);\r\n    const ghostLowerConeRef = useRef(null);\r\n\r\n    const liveIndicatorSnapshotRef = useRef({});`;

fileText = fileText.replace(stateTarget, stateReplacement);

fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', fileText);
console.log("Done fixing state and imports.");
