const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\project\\ALLBACKUP\\Praxis\\compact.json', 'utf8'));

const companyFields = new Set(['ratios', 'balanceSheet', 'income', 'cashFlow', 'holdings', 'company_profile', 'corporate_actions', 'manualMarketCap']);

const macroCards = new Set([
  'cpicard', 'gdpcard', 'gdpgrowthcard', 'repocard', 'fiscaldeficitcard', 'currentaccountcard', 'crudecard', 'usdinrcard', 'volatilitycard',
  'fiidiiflowcard', 'globalliqcard', 'systemliquiditycard', 'sovereignriskcard', 'policystancecard', 'policytailwindscard', 'fiicard', 'diicard', 'fiitrendcard',
  'mfflowscard', 'corpdebtcard', 'reformmomentumcard', 'creditgrowthcard', 'cycdefcard',
  'sectorvaluationcard', 'sectorgrowthcard', 'sectorconcentrationcard', 'sectorearningscard'
]);

const forcedCompanyCards = new Set([
  'npacard', 'smartmoneyflowcard', 'companysummarywidget', 'marketcapgdpcard',
  'earningsrevisioncard', 'epsyoycard', 'forwardepscard', 'profitmargincard'
]);

const indicesCards = new Set([
  'indexdividendyieldcard', 'indexmcapgdpcard', 'indexsummarywidget', 'niftypecard', 'niftypbcard', 'breadthratiocard', 'mcclellancard', 'adlinecard', 'nhnlcard', 'trincard', 'advancedeclinecard'
]);

const result = [];

for (const card of data) {
    let applies = 'both';
    let cardId = card.cardId;

    if (cardId === 'usdinrcard' && card.page === 'Global') {
        cardId = 'usdinrcard_global';
        card.cardId = cardId;
    }

    let hasCompanyField = false;
    for (const field of card.requiredDataFields) {
        if (companyFields.has(field)) hasCompanyField = true;
    }

    if (card.page === 'Global' || macroCards.has(cardId) || cardId === 'usdinrcard_global') {
        applies = 'macro_global';
    }
    else if (hasCompanyField || forcedCompanyCards.has(cardId)) {
        applies = 'company';
    } 
    else if (indicesCards.has(cardId)) {
        applies = 'indices';
    }
    else {
        applies = 'both';
    }

    if (applies !== 'company') {
        if (['paichatarea', 'paifloatingwidget'].includes(cardId)) {
            applies = 'macro_global'; 
        }

        if (card.page === 'Options') {
            if (['optionspulse'].includes(cardId)) {
                applies = 'macro_global';
            } else {
                applies = 'both';
            }
        }

        if (card.page === 'Technical') {
            if (indicesCards.has(cardId)) {
                applies = 'indices';
            } else {
                applies = 'both'; 
            }
        }
    }

    card.appliesTo = applies;
    result.push(card);
}

fs.writeFileSync('c:\\project\\ALLBACKUP\\Praxis\\inventory_classified.json', JSON.stringify(result));
fs.writeFileSync('c:\\project\\ALLBACKUP\\Praxis\\inventory_classified_min.json', JSON.stringify(result));
