/**
 * Utilities for Options Math (PCR, Max Pain)
 */

export function calculatePCR(chain) {
    if (!chain || chain.length === 0) return 1.0;
    
    let totalPutOi = 0;
    let totalCallOi = 0;
    
    chain.forEach(row => {
        if (row.put && row.put.oi) totalPutOi += row.put.oi;
        if (row.call && row.call.oi) totalCallOi += row.call.oi;
    });
    
    if (totalCallOi === 0) return 1.0;
    return totalPutOi / totalCallOi;
}

export function calculateMaxPain(chain) {
    if (!chain || chain.length === 0) return null;
    
    let minPain = Infinity;
    let maxPainStrike = chain[Math.floor(chain.length / 2)].strike;
    
    // For each possible expiry strike K
    for (let i = 0; i < chain.length; i++) {
        const K = chain[i].strike;
        let currentPain = 0;
        
        // Sum the intrinsic value loss of all options if K is the expiry price
        for (let j = 0; j < chain.length; j++) {
            const row = chain[j];
            
            // Calls are in the money if expiry (K) > Call Strike
            if (K > row.strike && row.call && row.call.oi) {
                currentPain += (K - row.strike) * row.call.oi;
            }
            
            // Puts are in the money if expiry (K) < Put Strike
            if (K < row.strike && row.put && row.put.oi) {
                currentPain += (row.strike - K) * row.put.oi;
            }
        }
        
        if (currentPain < minPain) {
            minPain = currentPain;
            maxPainStrike = K;
        }
    }
    
    return maxPainStrike;
}
