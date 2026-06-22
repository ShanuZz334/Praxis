import JournalLog from "../models/JournalLog.js";
import DailyNote from "../models/DailyNote.js";

/**
 * @desc    Get all journal logs for logged in user
 * @route   GET /api/v1/journal
 * @access  Private
 */
export const getJournalLogs = async (req, res) => {
    try {
        const logs = await JournalLog.find({ user: req.user._id }).sort({ date: -1 });
        res.status(200).json(logs);
    } catch (err) {
        console.error("Error fetching journal logs:", err.message);
        res.status(500).json({ message: "Failed to fetch journal logs" });
    }
};

/**
 * @desc    Add a new journal log
 * @route   POST /api/v1/journal
 * @access  Private
 */
export const addJournalLog = async (req, res) => {
    try {
        const {
            date, instrument, type, direction,
            entry, exit, sl, target,
            size, riskPct, pnl, pnlPct, rMultiple,
            strategy, outcome,
            context, execution, psychology,
            verdict, failureAttribution, counterfactual, ruleInjection, emotionalFlow
        } = req.body;

        const log = new JournalLog({
            user: req.user._id,
            date, instrument, type, direction,
            entry, exit, sl, target,
            size, riskPct, pnl, pnlPct, rMultiple,
            strategy, outcome,
            context, execution, psychology,
            verdict, failureAttribution, counterfactual, ruleInjection, emotionalFlow
        });

        const createdLog = await log.save();
        res.status(201).json(createdLog);
    } catch (err) {
        console.error("Error adding journal log:", err.message);
        res.status(500).json({ message: "Failed to add journal log" });
    }
};

/**
 * @desc    Get Journal Analytics (Aggregated)
 * @route   GET /api/v1/journal/analytics
 * @access  Private
 */
export const getJournalAnalytics = async (req, res) => {
    try {
        const logs = await JournalLog.find({ user: req.user._id });

        // Basic calculation logic (can be expanded)
        const totalTrades = logs.length;
        const wins = logs.filter(l => l.outcome === 'Win').length;
        const losses = logs.filter(l => l.outcome === 'Loss').length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

        let totalPnL = 0;
        let totalR = 0;
        logs.forEach(l => {
            totalPnL += l.pnl;
            totalR += l.rMultiple || 0;
        });

        const avgRR = totalTrades > 0 ? totalR / totalTrades : 0; // Simplified

        res.status(200).json({
            totalTrades,
            wins,
            losses,
            winRate,
            totalPnL,
            avgRR,
            // Add more stats as needed by frontend
        });
    } catch (err) {
        console.error("Error fetching analytics:", err.message);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
};

/**
 * @desc    Get Daily Notes for User
 * @route   GET /api/v1/journal/notes
 * @access  Private
 */
export const getDailyNotes = async (req, res) => {
    try {
        const notes = await DailyNote.find({ user: req.user._id });

        // Transform to object { "YYYY-MM-DD": "content" } for frontend
        const notesMap = {};
        notes.forEach(n => {
            notesMap[n.date] = n.content;
        });

        res.status(200).json(notesMap);
    } catch (err) {
        console.error("Error fetching notes:", err.message);
        res.status(500).json({ message: "Failed to fetch notes" });
    }
};

/**
 * @desc    Save/Update Daily Note
 * @route   POST /api/v1/journal/notes
 * @access  Private
 */
export const saveDailyNote = async (req, res) => {
    try {
        const { date, content } = req.body;

        if (!date || content === undefined) {
            return res.status(400).json({ message: "Date and content are required" });
        }

        const note = await DailyNote.findOneAndUpdate(
            { user: req.user._id, date },
            { content },
            { new: true, upsert: true } // Create if not exists
        );

        res.status(200).json(note);
    } catch (err) {
        console.error("Error saving note:", err.message);
        res.status(500).json({ message: "Failed to save note" });
    }
};
