export function resolveGlobal(cardDef, rawGlobal) {
    if (!rawGlobal) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    const getVal = (id) => {
        const item = rawGlobal.macro?.find(m => m.id === id);
        return item ? item.value : null;
    };

    const value = getVal(cardDef.id);

    if (value !== null && value !== undefined) {
        return {
            hasLiveData: true,
            value,
            // Score can be derived if needed, or defaults to 50
            score: 50
        };
    }

    return {
        hasLiveData: false,
        reason: 'Missing from upstream API'
    };
}
