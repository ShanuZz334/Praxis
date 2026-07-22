import { CARD_REGISTRY } from '../../src/shared/config/cardRegistry.js';
import { TITLE_TO_ID } from '../../src/features/dashboard/fundamentals/engine/FundamentalCompositeEngine.js';

console.log("CARD_REGISTRY.nifty_pe:", CARD_REGISTRY.nifty_pe);
console.log("TITLE_TO_ID['Index P/E']:", TITLE_TO_ID['Index P/E']);
console.log("TITLE_TO_ID contains global_liq?", Object.values(TITLE_TO_ID).includes('global_liq'));
