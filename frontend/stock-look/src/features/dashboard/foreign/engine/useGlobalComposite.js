import { useMemo } from 'react';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { 
    scoreDXY, scoreUSDINR, scoreCrude, scoreGold, scoreSilver, 
    scoreUS10Y, scoreSPFutures, scoreNasdaqFutures, scoreDowFutures, scoreVIX, 
    scoreBitcoin, scoreEthereum, scoreUsdjpy, scoreNikkei, scoreFtse, scoreDax, 
    scoreHangseng, scoreShanghai, scoreCopper, scoreNatgas, scoreMove 
} from './globalScoringEngine';
import { computeGlobalComposite, ID_TO_TITLE_GLOBAL } from './globalCompositeMath';

export { computeGlobalComposite, ID_TO_TITLE_GLOBAL };

export const useGlobalComposite = (manualOverrides, liveData = {}, rangeData = {}) => {
    return useMemo(() => {
        // Fallback logic: Upstox Live Data -> Manual Overrides
        const getVal = (key) => liveData[key] ?? manualOverrides[key];
        // Range data from 52-week Yahoo Finance hi/lo
        const getRange = (key) => rangeData[key] || {};

        const scores = {
            dxy:            scoreDXY(getVal('dxy'), getRange('dxy')),
            usd_inr:        scoreUSDINR(getVal('usd_inr'), getRange('usd_inr')),
            crude:          scoreCrude(getVal('crude'), getRange('crude')),
            gold:           scoreGold(getVal('gold'), getRange('gold')),
            silver:         scoreSilver(getVal('silver'), getRange('silver')),
            us_10y_yield:   scoreUS10Y(getVal('us_10y_yield'), getRange('us_10y_yield')),
            sp_futures:     scoreSPFutures(getVal('sp_futures'), getRange('sp_futures')),
            nasdaq_futures: scoreNasdaqFutures(getVal('nasdaq_futures'), getRange('nasdaq_futures')),
            dow_jones:      scoreDowFutures(getVal('dow_jones'), getRange('dow_jones')),
            vix:            scoreVIX(getVal('vix'), getRange('vix')),
            bitcoin:        scoreBitcoin(getVal('bitcoin'), getRange('bitcoin')),
            ethereum:       scoreEthereum(getVal('ethereum'), getRange('ethereum')),
            usdjpy:         scoreUsdjpy(getVal('usdjpy'), getRange('usdjpy')),
            nikkei:         scoreNikkei(getVal('nikkei'), getRange('nikkei')),
            ftse:           scoreFtse(getVal('ftse'), getRange('ftse')),
            dax:            scoreDax(getVal('dax'), getRange('dax')),
            hangseng:       scoreHangseng(getVal('hangseng'), getRange('hangseng')),
            shanghai:       scoreShanghai(getVal('shanghai'), getRange('shanghai')),
            copper:         scoreCopper(getVal('copper'), getRange('copper')),
            natgas:         scoreNatgas(getVal('natgas'), getRange('natgas')),
            move:           scoreMove(getVal('move'), getRange('move'))
        };

        const engineOutput = computeGlobalComposite(scores);
        
        const result = {
            ...engineOutput,
            cardData: {
                dxy: { value: getVal('dxy'), ...scores.dxy },
                usd_inr: { value: getVal('usd_inr'), ...scores.usd_inr },
                crude: { value: getVal('crude'), ...scores.crude },
                gold: { value: getVal('gold'), ...scores.gold },
                silver: { value: getVal('silver'), ...scores.silver },
                us_10y_yield: { value: getVal('us_10y_yield'), ...scores.us_10y_yield },
                sp_futures: { value: getVal('sp_futures'), ...scores.sp_futures },
                nasdaq_futures: { value: getVal('nasdaq_futures'), ...scores.nasdaq_futures },
                dow_jones: { value: getVal('dow_jones'), ...scores.dow_jones },
                vix: { value: getVal('vix'), ...scores.vix },
                bitcoin: { value: getVal('bitcoin'), ...scores.bitcoin },
                ethereum: { value: getVal('ethereum'), ...scores.ethereum },
                usdjpy: { value: getVal('usdjpy'), ...scores.usdjpy },
                nikkei: { value: getVal('nikkei'), ...scores.nikkei },
                ftse: { value: getVal('ftse'), ...scores.ftse },
                dax: { value: getVal('dax'), ...scores.dax },
                hangseng: { value: getVal('hangseng'), ...scores.hangseng },
                shanghai: { value: getVal('shanghai'), ...scores.shanghai },
                copper: { value: getVal('copper'), ...scores.copper },
                natgas: { value: getVal('natgas'), ...scores.natgas },
                move: { value: getVal('move'), ...scores.move }
            }
        };

        const cards = [];
        Object.values(CARD_REGISTRY).forEach(cardDef => {
            if (cardDef.page !== 'Global' && cardDef.page !== 'Foreign') return;

            const data = result.cardData[cardDef.id];
            if (!data || data.value === null || data.value === undefined) {
                cards.push({
                    id: cardDef.id,
                    displayName: cardDef.displayName || ID_TO_TITLE_GLOBAL[cardDef.id],
                    value: null,
                    score: null,
                    hasLiveData: false,
                    status: 'missing',
                    reason: 'No upstream source',
                    retryAfter: 10000,
                    severity: 'warning'
                });
            } else {
                cards.push({
                    id: cardDef.id,
                    displayName: cardDef.displayName || ID_TO_TITLE_GLOBAL[cardDef.id],
                    value: data.value,
                    score: data.score,
                    hasLiveData: true
                });
            }
        });
        result.cards = cards;

        // DB Sync is handled by useAiSync in ForeignPage.jsx. Do NOT write to header_data here,
        // because this hook is also used by the Master Dashboard which would overwrite the DB with 59.

        return result;
    }, [manualOverrides, liveData, rangeData]);
};
