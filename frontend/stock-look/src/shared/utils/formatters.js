/**
 * Formats large numbers into the Indian numbering system (Crores, Lakhs, thousands).
 * 
 * @param {number} num 
 * @returns {string} Formatted string like "1.50 Cr", "3.20 L", or "12.5 k"
 */
export const formatIndianNumber = (num) => {
    if (!num) return '';
    const n = Number(num);
    if (isNaN(n)) return '';
    if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return (n / 100000).toFixed(2) + ' L';
    if (n >= 1000) return (n / 1000).toFixed(1) + ' k';
    return n.toString();
};

export const formatCurrency = (num) => {
    if (!num) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};
