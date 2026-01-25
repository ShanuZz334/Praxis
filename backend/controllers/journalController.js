import Journal from '../models/Journal.js';

// Create new journal entry
export const createEntry = async (req, res) => {
    try {
        const entry = new Journal({
            ...req.body,
            userId: req.user.id
        });
        await entry.save();
        res.status(201).json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all journal entries with filters
export const getEntries = async (req, res) => {
    try {
        const { symbol, status, startDate, endDate } = req.query;
        let query = { userId: req.user.id };

        if (symbol) query.symbol = new RegExp(symbol, 'i');
        if (status) query.status = status;
        if (startDate || endDate) {
            query.entryDate = {};
            if (startDate) query.entryDate.$gte = new Date(startDate);
            if (endDate) query.entryDate.$lte = new Date(endDate);
        }

        const entries = await Journal.find(query).sort({ entryDate: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single entry
export const getEntryById = async (req, res) => {
    try {
        const entry = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update entry
export const updateEntry = async (req, res) => {
    try {
        const entry = await Journal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete entry
export const deleteEntry = async (req, res) => {
    try {
        const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
