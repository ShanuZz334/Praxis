import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Moneycontrol Scraper Service
 * Scrapes real-time financial news, market reports, and intelligence feeds.
 * Includes in-memory TTL caching to prevent rate-limits and optimize response times.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const memoryCache = {
    latestNews: { data: null, expiresAt: 0 },
    marketReports: { data: null, expiresAt: 0 },
    businessNews: { data: null, expiresAt: 0 }
};

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
};

function parseRssXml(xmlString, limit = 10) {
    const $ = cheerio.load(xmlString, { xmlMode: true });
    const items = [];
    $('item').slice(0, limit).each((i, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const pubDate = $(el).find('pubDate').text().trim();
        const description = $(el).find('description').text().replace(/<[^>]*>?/gm, '').trim();
        if (title) {
            items.push({ title, link, pubDate, description });
        }
    });
    return items;
}

export const moneycontrolService = {
    /**
     * Ping Moneycontrol server to measure genuine round-trip latency
     */
    async ping() {
        const start = performance.now();
        try {
            const res = await axios.get('https://www.moneycontrol.com/rss/latestnews.xml', {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            const latency = Math.max(1, Math.round(performance.now() - start));
            const items = parseRssXml(res.data, 1);
            const topHeadline = items[0]?.title 
                ? (items[0].title.length > 35 ? items[0].title.slice(0, 35) + '...' : items[0].title)
                : 'Feed Active';
            return {
                status: 'UP',
                latency,
                sampleData: `Latest: ${topHeadline}`
            };
        } catch (error) {
            const latency = Math.max(1, Math.round(performance.now() - start));
            return {
                status: 'OFFLINE',
                latency,
                error: error.message || 'Moneycontrol connection failed'
            };
        }
    },

    /**
     * Get Latest News feed
     */
    async getLatestNews(limit = 10) {
        const now = Date.now();
        if (memoryCache.latestNews.data && memoryCache.latestNews.expiresAt > now) {
            return memoryCache.latestNews.data.slice(0, limit);
        }

        try {
            const res = await axios.get('https://www.moneycontrol.com/rss/latestnews.xml', {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            const items = parseRssXml(res.data, 25);
            memoryCache.latestNews = {
                data: items,
                expiresAt: now + CACHE_TTL_MS
            };
            return items.slice(0, limit);
        } catch (error) {
            console.warn('[Moneycontrol] Error fetching latest news:', error.message);
            if (memoryCache.latestNews.data) return memoryCache.latestNews.data.slice(0, limit);
            return [];
        }
    },

    /**
     * Get Market Reports feed
     */
    async getMarketReports(limit = 10) {
        const now = Date.now();
        if (memoryCache.marketReports.data && memoryCache.marketReports.expiresAt > now) {
            return memoryCache.marketReports.data.slice(0, limit);
        }

        try {
            const res = await axios.get('https://www.moneycontrol.com/rss/marketreports.xml', {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            const items = parseRssXml(res.data, 25);
            memoryCache.marketReports = {
                data: items,
                expiresAt: now + CACHE_TTL_MS
            };
            return items.slice(0, limit);
        } catch (error) {
            console.warn('[Moneycontrol] Error fetching market reports:', error.message);
            if (memoryCache.marketReports.data) return memoryCache.marketReports.data.slice(0, limit);
            return [];
        }
    },

    /**
     * Get Business & Economy News feed
     */
    async getBusinessNews(limit = 10) {
        const now = Date.now();
        if (memoryCache.businessNews.data && memoryCache.businessNews.expiresAt > now) {
            return memoryCache.businessNews.data.slice(0, limit);
        }

        try {
            const res = await axios.get('https://www.moneycontrol.com/rss/business.xml', {
                headers: DEFAULT_HEADERS,
                timeout: 7000
            });
            const items = parseRssXml(res.data, 25);
            memoryCache.businessNews = {
                data: items,
                expiresAt: now + CACHE_TTL_MS
            };
            return items.slice(0, limit);
        } catch (error) {
            console.warn('[Moneycontrol] Error fetching business news:', error.message);
            if (memoryCache.businessNews.data) return memoryCache.businessNews.data.slice(0, limit);
            return [];
        }
    },

    clearCache() {
        memoryCache.latestNews = { data: null, expiresAt: 0 };
        memoryCache.marketReports = { data: null, expiresAt: 0 };
        memoryCache.businessNews = { data: null, expiresAt: 0 };
    }
};
