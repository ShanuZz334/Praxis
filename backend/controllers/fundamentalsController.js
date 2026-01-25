import { fetchCompanyOverview, fetchBalanceSheet } from '../services/fundamentalsService.js';

// Get company overview
export const getOverview = async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

        const data = await fetchCompanyOverview(symbol);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get financial statements
export const getFinancials = async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

        const data = await fetchBalanceSheet(symbol);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
