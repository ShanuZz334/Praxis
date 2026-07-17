import { getAiCardStoreHistory } from './config/localDb.js';

try {
    const history = getAiCardStoreHistory("GLOBAL", "Dashboard", "InstitutionalFlow", "FiiDiiSegmented", 0, 2);
    console.log("History length:", history.length);
    if (history.length > 0) {
        console.log("Latest entry:", history[0].timestamp, "FII Cash net:", history[0].fii['NSE_EQ|CASH'].net);
    }
} catch (e) {
    console.error("Test error:", e.message);
}
