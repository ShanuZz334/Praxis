import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Screener.in Scraper Service
 * Scrapes 10-year financial metrics, ROCE, ROE, historical valuation multiples,
 * 12-quarter shareholding trend breakdowns, sector peer comparisons, and AI qualitative pros/cons.
 * Features in-memory caching to eliminate redundant HTTP requests.
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

const memoryCache = {
    companies: new Map() // symbol -> { data, expiresAt }
};

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
};

function parseNumber(str) {
    if (!str) return null;
    const cleaned = str.replace(/[₹,%\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function parseFinancialTable($, sectionSelector) {
    const section = $(sectionSelector);
    if (!section.length) return null;

    const table = section.find('table.data-table').first();
    const targetTable = table.length ? table : section.find('table').first();
    if (!targetTable.length) return null;

    const years = targetTable.find('thead th').map((_, th) => $(th).text().trim()).get().filter(Boolean);
    const rows = {};

    targetTable.find('tbody tr').each((_, tr) => {
        const rowName = $(tr).find('td').first().text().trim().replace(/[+]/g, '').trim();
        const values = $(tr).find('td').slice(1).map((_, td) => {
            const raw = $(td).text().trim();
            const num = parseNumber(raw);
            return num !== null ? num : raw;
        }).get();
        if (rowName && values.length > 0) {
            rows[rowName] = values;
        }
    });

    return { years, rows };
}

function parseCompoundedGrowth($) {
    const section = $('section#profit-loss');
    if (!section.length) return null;

    const categories = [
        { key: 'salesGrowth', title: 'Compounded Sales Growth' },
        { key: 'profitGrowth', title: 'Compounded Profit Growth' },
        { key: 'priceCagr', title: 'Stock Price CAGR' },
        { key: 'roe', title: 'Return on Equity' }
    ];

    const result = {};
    section.find('table.ranges-table').each((i, table) => {
        if (i >= categories.length) return;
        const cat = categories[i];
        const data = {};
        $(table).find('tr').each((_, tr) => {
            const period = $(tr).find('td').eq(0).text().trim().replace(':', '').trim();
            const val = $(tr).find('td').eq(1).text().trim();
            if (period && val) {
                data[period] = val;
            }
        });
        if (Object.keys(data).length > 0) {
            result[cat.key] = { title: cat.title, periods: data };
        }
    });

    return Object.keys(result).length > 0 ? result : null;
}

export const screenerService = {
    /**
     * Ping Screener.in to measure genuine round-trip latency
     */
    async ping() {
        const start = performance.now();
        try {
            const res = await axios.get('https://www.screener.in/api/company/search/?q=RELIANCE', {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            const latency = Math.max(1, Math.round(performance.now() - start));
            const hasData = Array.isArray(res.data) && res.data.length > 0;
            const topMatch = hasData ? res.data[0].name : 'Verified';
            return {
                status: 'UP',
                latency,
                sampleData: `Search Verified: ${topMatch}`
            };
        } catch (error) {
            const latency = Math.max(1, Math.round(performance.now() - start));
            return {
                status: 'OFFLINE',
                latency,
                error: error.message || 'Screener.in connection failed'
            };
        }
    },

    /**
     * Search company on Screener.in
     */
    async searchCompany(query) {
        if (!query) return [];
        try {
            const res = await axios.get(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`, {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            return Array.isArray(res.data) ? res.data : [];
        } catch (error) {
            console.warn(`[Screener] Search failed for query "${query}":`, error.message);
            return [];
        }
    },

    /**
     * Get comprehensive company fundamentals (10-year financials, 12-quarter shareholding trend, peer comparisons, ratios)
     */
    async getCompanyDetails(symbol) {
        if (!symbol) return null;
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
        const now = Date.now();

        const cached = memoryCache.companies.get(cleanSymbol);
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }

        try {
            let res;
            try {
                res = await axios.get(`https://www.screener.in/company/${cleanSymbol}/consolidated/`, {
                    headers: DEFAULT_HEADERS,
                    timeout: 9000
                });
            } catch (firstErr) {
                // If consolidated 404s, fallback to standalone page
                if (firstErr.response?.status === 404) {
                    res = await axios.get(`https://www.screener.in/company/${cleanSymbol}/`, {
                        headers: DEFAULT_HEADERS,
                        timeout: 9000
                    });
                } else {
                    throw firstErr;
                }
            }

            const html = res.data;
            const $ = cheerio.load(html);

            // 1. Top Core Ratios
            const rawRatios = {};
            $('#top-ratios li').each((i, el) => {
                const name = $(el).find('.name').text().trim();
                const value = $(el).find('.now-value, .value').text().trim().replace(/\s+/g, '');
                if (name && value) {
                    rawRatios[name] = value;
                }
            });

            const ratios = {
                marketCapCr: parseNumber(rawRatios['Market Cap']),
                currentPrice: parseNumber(rawRatios['Current Price']),
                highLow: rawRatios['High / Low'] || null,
                stockPe: parseNumber(rawRatios['Stock P/E']),
                bookValue: parseNumber(rawRatios['Book Value']),
                dividendYieldPct: parseNumber(rawRatios['Dividend Yield']),
                rocePct: parseNumber(rawRatios['ROCE']),
                roePct: parseNumber(rawRatios['ROE']),
                faceValue: parseNumber(rawRatios['Face Value'])
            };

            // 2. Sector & Industry Classification
            const peersSection = $('#peers');
            const sectorData = {
                broadSector: peersSection.find('a[title="Broad Sector"]').text().trim() || null,
                sector: peersSection.find('a[title="Sector"]').text().trim() || null,
                broadIndustry: peersSection.find('a[title="Broad Industry"]').text().trim() || null,
                industry: peersSection.find('a[title="Industry"]').text().trim() || null
            };

            // 3. Pros and Cons
            const pros = $('.pros li').map((i, el) => $(el).text().trim()).get();
            const cons = $('.cons li').map((i, el) => $(el).text().trim()).get();

            // 4. 10+ Years Cleaned Financial Statements
            const financials10Year = {
                profitLoss: parseFinancialTable($, 'section#profit-loss'),
                balanceSheet: parseFinancialTable($, 'section#balance-sheet'),
                cashFlow: parseFinancialTable($, 'section#cash-flow'),
                ratiosTrajectory: parseFinancialTable($, 'section#ratios'),
                compoundedGrowth: parseCompoundedGrowth($)
            };

            // 5. 12-Quarter Shareholding Trend Breakdown
            const shareholdingSection = $('section#shareholding');
            const quartersTable = shareholdingSection.find('table.data-table').first();
            const quartersList = quartersTable.find('thead th').map((_, th) => $(th).text().trim()).get().filter(Boolean);

            const shareholdingTrend = {
                quarters: quartersList,
                categories: {}
            };

            quartersTable.find('tbody tr').each((_, tr) => {
                const category = $(tr).find('td').first().text().trim().replace(/[+]/g, '').trim();
                const values = $(tr).find('td').slice(1).map((_, td) => {
                    const num = parseNumber($(td).text().trim());
                    return num !== null ? num : 0;
                }).get();
                if (category) {
                    shareholdingTrend.categories[category] = values;
                }
            });

            // Latest snapshot shortcut
            const latestQuarterIndex = quartersList.length - 1;
            const shareholdingSnapshot = {
                latestQuarter: quartersList[latestQuarterIndex] || null,
                promoters: shareholdingTrend.categories['Promoters']?.[latestQuarterIndex] ?? null,
                fiis: shareholdingTrend.categories['FIIs']?.[latestQuarterIndex] ?? null,
                diis: shareholdingTrend.categories['DIIs']?.[latestQuarterIndex] ?? null,
                government: shareholdingTrend.categories['Government']?.[latestQuarterIndex] ?? null,
                public: shareholdingTrend.categories['Public']?.[latestQuarterIndex] ?? null,
                shareholdersCountLakhs: shareholdingTrend.categories['No. of Shareholders']?.[latestQuarterIndex] ?? null
            };

            // 6. Sector Peer Comparison Multiples
            let peers = [];
            const warehouseIdMatch = html.match(/data-warehouse-id=["'](\d+)["']/);
            const warehouseId = warehouseIdMatch ? warehouseIdMatch[1] : null;

            if (warehouseId) {
                try {
                    const peerRes = await axios.get(`https://www.screener.in/api/company/${warehouseId}/peers/`, {
                        headers: DEFAULT_HEADERS,
                        timeout: 6000
                    });
                    const $p = cheerio.load(peerRes.data);
                    $p('table tbody tr').each((_, tr) => {
                        const cols = $p(tr).find('td').map((_, td) => $p(td).text().trim()).get();
                        if (cols.length >= 7) {
                            peers.push({
                                companyName: cols[1]?.replace(/\s+/g, ' ').trim() || '',
                                cmp: parseNumber(cols[2]),
                                pe: parseNumber(cols[3]),
                                marketCapCr: parseNumber(cols[4]),
                                divYieldPct: parseNumber(cols[5]),
                                qtrNetProfitCr: parseNumber(cols[6]),
                                qtrProfitVarPct: parseNumber(cols[7]),
                                qtrSalesCr: parseNumber(cols[8]),
                                qtrSalesVarPct: parseNumber(cols[9]),
                                rocePct: parseNumber(cols[10])
                            });
                        }
                    });
                } catch (peerErr) {
                    console.warn(`[Screener] Failed to fetch peers for warehouseId ${warehouseId}:`, peerErr.message);
                }
            }

            const result = {
                symbol: cleanSymbol,
                ratios,
                sector: sectorData,
                pros,
                cons,
                shareholding: shareholdingSnapshot,
                shareholdingTrend,
                financials10Year,
                peers,
                scrapedAt: new Date().toISOString()
            };

            memoryCache.companies.set(cleanSymbol, {
                data: result,
                expiresAt: now + CACHE_TTL_MS
            });

            return result;
        } catch (error) {
            console.warn(`[Screener] Error scraping company details for ${cleanSymbol}:`, error.message);
            if (cached) return cached.data;
            return null;
        }
    },

    clearCache() {
        memoryCache.companies.clear();
    }
};
