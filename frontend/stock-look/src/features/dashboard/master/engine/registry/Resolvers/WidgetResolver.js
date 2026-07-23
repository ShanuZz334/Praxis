export function resolveWidget(cardDef, rawData) {
    // Widgets generally don't have numerical scores, they just need to signal presence.
    // We assume if rawData exists, the widget can mount.
    if (!rawData) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    return {
        hasLiveData: true,
        value: null,
        score: null,
        status: 'live'
    };
}
