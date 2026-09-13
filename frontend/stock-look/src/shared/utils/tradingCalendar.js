/**
 * @file tradingCalendar.js
 * @purpose Canonical NSE Trading Calendar & Market Holiday Engine for Praxis.
 *          Handles holiday detection, weekend skipping, session rolling,
 *          and awareness of Indian market closed days.
 */

// Official NSE Market Holidays (2025 - 2027)
export const NSE_HOLIDAYS = [
    // 2025
    { date: "2025-01-26", description: "Republic Day" },
    { date: "2025-02-26", description: "Maha Shivaratri" },
    { date: "2025-03-14", description: "Holi" },
    { date: "2025-03-31", description: "Id-Ul-Fitr (Ramzan Id)" },
    { date: "2025-04-10", description: "Mahavir Jayanti" },
    { date: "2025-04-14", description: "Dr. Baba Saheb Ambedkar Jayanti" },
    { date: "2025-04-18", description: "Good Friday" },
    { date: "2025-05-01", description: "Maharashtra Day" },
    { date: "2025-06-07", description: "Bakri Id" },
    { date: "2025-08-15", description: "Independence Day" },
    { date: "2025-08-27", description: "Ganesh Chaturthi" },
    { date: "2025-10-02", description: "Mahatma Gandhi Jayanti" },
    { date: "2025-10-21", description: "Diwali-Laxmi Pujan" },
    { date: "2025-10-22", description: "Diwali-Balipratipada" },
    { date: "2025-11-05", description: "Gurunanak Jayanti" },
    { date: "2025-12-25", description: "Christmas" },

    // 2026
    { date: "2026-01-26", description: "Republic Day" },
    { date: "2026-03-03", description: "Maha Shivaratri" },
    { date: "2026-03-24", description: "Holi" },
    { date: "2026-04-03", description: "Good Friday" },
    { date: "2026-04-14", description: "Dr. Baba Saheb Ambedkar Jayanti" },
    { date: "2026-04-20", description: "Ramzan Id (Id-Ul-Fitr)" },
    { date: "2026-05-01", description: "Maharashtra Day" },
    { date: "2026-06-27", description: "Bakri Id (Id-Ul-Zuha)" },
    { date: "2026-08-15", description: "Independence Day" },
    { date: "2026-09-14", description: "Ganesh Chaturthi" },
    { date: "2026-10-02", description: "Mahatma Gandhi Jayanti" },
    { date: "2026-10-18", description: "Dussehra" },
    { date: "2026-11-08", description: "Diwali-Laxmi Pujan" }, // Muhurat Trading
    { date: "2026-11-10", description: "Diwali-Balipratipada" },
    { date: "2026-11-24", description: "Gurunanak Jayanti" },
    { date: "2026-12-25", description: "Christmas" },

    // 2027
    { date: "2027-01-26", description: "Republic Day" },
    { date: "2027-03-22", description: "Holi" },
    { date: "2027-03-26", description: "Good Friday" },
    { date: "2027-04-14", description: "Dr. Baba Saheb Ambedkar Jayanti" },
    { date: "2027-05-01", description: "Maharashtra Day" },
    { date: "2027-08-15", description: "Independence Day" },
    { date: "2027-09-04", description: "Ganesh Chaturthi" },
    { date: "2027-10-02", description: "Mahatma Gandhi Jayanti" },
    { date: "2027-10-09", description: "Dussehra" },
    { date: "2027-10-29", description: "Diwali-Laxmi Pujan" },
    { date: "2027-12-25", description: "Christmas" }
];

const dynamicHolidaysMap = new Map();
NSE_HOLIDAYS.forEach(h => dynamicHolidaysMap.set(h.date, h.description));

/**
 * Merges holidays dynamically fetched from Upstox or backend Journal API.
 */
export function registerDynamicHolidays(holidays) {
    if (!Array.isArray(holidays)) return;
    holidays.forEach(h => {
        if (h && h.date) {
            dynamicHolidaysMap.set(h.date, h.description || h.reason || h.name || "Market Holiday");
        }
    });
}

/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
export function formatDateKey(dateObj) {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * Formats a Date object to YYYY-MM-DD in UTC time.
 */
export function formatDateKeyUTC(dateObj) {
    if (!dateObj) return "";
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * Checks if a date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(dateObj) {
    if (!dateObj) return false;
    const day = dateObj.getDay();
    return day === 0 || day === 6;
}

/**
 * Checks if a UTC date falls on a weekend.
 */
export function isWeekendUTC(dateObj) {
    if (!dateObj) return false;
    const day = dateObj.getUTCDay();
    return day === 0 || day === 6;
}

/**
 * Returns the description of a holiday if the given date is an official NSE holiday, or null.
 */
export function getHolidayReason(dateObjOrStr, isUtc = false) {
    if (!dateObjOrStr) return null;
    let key = "";
    if (typeof dateObjOrStr === "string") {
        key = dateObjOrStr.split("T")[0];
    } else if (dateObjOrStr instanceof Date) {
        key = isUtc ? formatDateKeyUTC(dateObjOrStr) : formatDateKey(dateObjOrStr);
    } else if (typeof dateObjOrStr === "object" && dateObjOrStr.year) {
        key = `${dateObjOrStr.year}-${String(dateObjOrStr.month).padStart(2, "0")}-${String(dateObjOrStr.day).padStart(2, "0")}`;
    } else if (typeof dateObjOrStr === "number") {
        const d = new Date(dateObjOrStr < 10000000000 ? dateObjOrStr * 1000 : dateObjOrStr);
        key = isUtc ? formatDateKeyUTC(d) : formatDateKey(d);
    }
    return dynamicHolidaysMap.get(key) || null;
}

/**
 * Checks if a date is an official NSE market holiday.
 */
export function isTradingHoliday(dateObjOrStr, isUtc = false) {
    return !!getHolidayReason(dateObjOrStr, isUtc);
}

/**
 * Checks if a date is a market-closed day (Weekend OR NSE Holiday).
 */
export function isMarketClosedDay(dateObjOrStr, isUtc = false) {
    let d;
    if (dateObjOrStr instanceof Date) {
        d = dateObjOrStr;
    } else if (typeof dateObjOrStr === "number") {
        d = new Date(dateObjOrStr < 10000000000 ? dateObjOrStr * 1000 : dateObjOrStr);
    } else if (typeof dateObjOrStr === "string") {
        d = new Date(dateObjOrStr);
    } else if (dateObjOrStr && dateObjOrStr.year) {
        d = new Date(dateObjOrStr.year, dateObjOrStr.month - 1, dateObjOrStr.day);
    } else {
        return false;
    }

    const weekend = isUtc ? isWeekendUTC(d) : isWeekend(d);
    if (weekend) return true;
    return isTradingHoliday(d, isUtc);
}

/**
 * Advances a daily Date forward to the next active trading day (skips weekends and NSE holidays).
 */
export function getNextTradingDay(startDate) {
    const d = new Date(startDate);
    do {
        d.setDate(d.getDate() + 1);
    } while (isMarketClosedDay(d, false));
    return d;
}

export const getNextTradingDate = getNextTradingDay;

/**
 * Advances a UTC Date forward to the next active trading day.
 */
export function getNextTradingDayUTC(startDate) {
    const d = new Date(startDate);
    do {
        d.setUTCDate(d.getUTCDate() + 1);
    } while (isMarketClosedDay(d, true));
    return d;
}

/**
 * Computes the next valid intraday candle timestamp in UTC seconds for NSE equity/index trading.
 *
 * Strict NSE Hours:
 *   - Market Open:  09:15 IST = 03:45 UTC = 225 UTC minutes
 *   - Market Close: 15:30 IST = 10:00 UTC = 600 UTC minutes
 *
 * If nextTime lands on/after 15:30 IST or before 09:15 IST, it rolls forward to 09:15 IST
 * of the NEXT VALID TRADING DAY (skipping weekends and NSE holidays).
 */
export function getNextIntradayCandleTime(currentTimeSeconds, barSizeSeconds, minUtcMins = 225, maxUtcMins = 600) {
    let nextTime = currentTimeSeconds + barSizeSeconds;
    let date = new Date(nextTime * 1000);
    let tm = date.getUTCHours() * 60 + date.getUTCMinutes();

    if (tm >= maxUtcMins || tm < minUtcMins) {
        // Roll to next trading day
        do {
            date.setUTCDate(date.getUTCDate() + 1);
        } while (isMarketClosedDay(date, true));

        date.setUTCHours(Math.floor(minUtcMins / 60), minUtcMins % 60, 0, 0);
        nextTime = Math.floor(date.getTime() / 1000);
    }
    return nextTime;
}

/**
 * Validates and heals future candle times so that no forecast candle falls on a weekend or NSE holiday.
 * If any future candle lands on a market-closed day, the future timeline is re-anchored from lastRealCandleTime.
 */
export function healFutureCandleTimes(times = [], lastRealCandleTime = null, barSizeSeconds = 900, isDailyOrAbove = false) {
    if (!times || times.length === 0) return times;

    const hasClosedDay = times.some(t => isMarketClosedDay(t, !isDailyOrAbove));
    if (!hasClosedDay) return times;

    console.log("[TradingCalendar] Detected market-closed day in ghost candles. Re-aligning forecast timeline past holidays/weekends...");

    const healed = [];
    if (isDailyOrAbove) {
        let current = lastRealCandleTime
            ? (typeof lastRealCandleTime === "string" ? new Date(lastRealCandleTime) : new Date(lastRealCandleTime.year, lastRealCandleTime.month - 1, lastRealCandleTime.day))
            : new Date();

        for (let i = 0; i < times.length; i++) {
            current = getNextTradingDay(current);
            if (typeof times[i] === "string") {
                healed.push(formatDateKey(current));
            } else {
                healed.push({ year: current.getFullYear(), month: current.getMonth() + 1, day: current.getDate() });
            }
        }
    } else {
        let curSec = typeof lastRealCandleTime === "number"
            ? lastRealCandleTime
            : (lastRealCandleTime ? Math.floor(new Date(lastRealCandleTime).getTime() / 1000) : Math.floor(Date.now() / 1000));

        for (let i = 0; i < times.length; i++) {
            curSec = getNextIntradayCandleTime(curSec, barSizeSeconds);
            healed.push(curSec);
        }
    }

    return healed;
}
