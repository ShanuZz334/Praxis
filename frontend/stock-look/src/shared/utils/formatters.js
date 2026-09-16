/**
 * Formats large numbers into the Indian numbering system (Crores, Lakhs, thousands).
 * 
 * @param {number} num 
 * @returns {string} Formatted string like "1.50 Cr", "3.20 L", or "12.5 k"
 */
export const formatIndianNumber = (num) => {
    if (num === null || num === undefined) return '';
    const n = Number(num);
    if (isNaN(n)) return '';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 10000000) return sign + (abs / 10000000).toFixed(2) + ' Cr';
    if (abs >= 100000) return sign + (abs / 100000).toFixed(2) + ' L';
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + ' k';
    return sign + abs.toString();
};

export const formatCurrency = (num) => {
    if (num === null || num === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const formatCompactCurrency = (num) => {
    if (num === null || num === undefined) return '₹0';
    const n = Number(num);
    if (isNaN(n)) return '₹0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-₹' : '₹';
    if (abs >= 10000000) return sign + (abs / 10000000).toFixed(2) + ' Cr';
    if (abs >= 100000) return sign + (abs / 100000).toFixed(2) + ' L';
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + ' k';
    return sign + abs.toFixed(0);
};

export const formatPercentage = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0%';
    const n = Number(num);
    const prefix = n > 0 ? '+' : '';
    return prefix + n.toFixed(decimals) + '%';
};

export const formatDecimal = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0.00';
    return Number(num).toFixed(decimals);
};

/**
 * Formats a timestamp into time (if today) or "Date, Time" (if older than today).
 *
 * @param {string|number|Date} ts - Timestamp to format
 * @param {Object} [options]
 * @param {boolean} [options.includeSeconds=false] - Whether to include seconds
 * @param {boolean} [options.hour12=true] - Whether to use 12-hour format
 * @returns {string|null} Formatted string like "02:11:02 AM" or "Sep 15, 02:11:02 AM"
 */
export const formatTimestampWithDate = (ts, { includeSeconds = false, hour12 = true } = {}) => {
    if (!ts) return null;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeOptions = {
        hour: includeSeconds ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12,
        ...(includeSeconds ? { second: '2-digit' } : {})
    };

    const timeStr = date.toLocaleTimeString('en-US', timeOptions);

    if (isToday) {
        return timeStr;
    }

    const sameYear = date.getFullYear() === now.getFullYear();
    const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: '2-digit' })
    });

    return `${dateStr}, ${timeStr}`;
};

