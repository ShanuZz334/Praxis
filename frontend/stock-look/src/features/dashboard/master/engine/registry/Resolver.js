import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { resolveFundamental } from './Resolvers/FundamentalResolver';
import { resolveTechnical } from './Resolvers/TechnicalResolver';
import { resolveOptions } from './Resolvers/OptionsResolver';
import { resolveGlobal } from './Resolvers/GlobalResolver';
import { resolveWidget } from './Resolvers/WidgetResolver';

/**
 * Resolver Layer
 * A pure function that routes a card definition and raw market data to the appropriate domain resolver.
 * 
 * @param {object} cardDef - The card definition from CARD_REGISTRY
 * @param {object} rawData - The aggregated raw data fetched during the poll
 * @returns {object} - The standardized state object for this card
 */
export function resolveCard(cardDef, rawData) {
    if (!cardDef || !cardDef.id) return null;

    // Delegate to domain resolvers based on the card's page
    const page = (cardDef.page || '').toLowerCase();

    // Custom UI Widgets need to be passed through without strict numeric scoring
    if (cardDef.type === 'widget') {
        return resolveWidget(cardDef, rawData);
    }

    let result = null;
    switch (page) {
        case 'fundamentals':
            result = resolveFundamental(cardDef, rawData.fundamentals);
            break;
        case 'technical':
            result = resolveTechnical(cardDef, rawData.technicals);
            break;
        case 'options':
            result = resolveOptions(cardDef, rawData.options);
            break;
        case 'global':
            result = resolveGlobal(cardDef, rawData.global);
            break;
        default:
            result = {
                id: cardDef.id,
                hasLiveData: false,
                status: 'missing',
                reason: 'Unknown domain',
                severity: 'warning'
            };
    }

    // Enforce strict schema if the domain resolver somehow returned a malformed object
    if (!result) {
        return {
            id: cardDef.id,
            hasLiveData: false,
            status: 'missing',
            reason: 'Resolver failed to return a valid object',
            severity: 'error'
        };
    }

    // Ensure the required minimum properties exist
    return {
        id: cardDef.id,
        status: result.status || (result.hasLiveData ? 'live' : 'missing'),
        hasLiveData: !!result.hasLiveData,
        value: result.value ?? null,
        score: result.score ?? null,
        reason: result.reason || (result.hasLiveData ? '' : 'No upstream source'),
        severity: result.severity || 'warning',
        ...result // Spread domain-specific properties like bias, confidence, pcr
    };
}
