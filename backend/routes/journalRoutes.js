import express from "express";
import { getJournalLogs, addJournalLog, getJournalAnalytics, getDailyNotes, saveDailyNote } from "../controllers/journalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJournalLogs);
router.post("/", protect, addJournalLog);
router.get("/analytics", protect, getJournalAnalytics);
router.get("/notes", protect, getDailyNotes);
router.post("/notes", protect, saveDailyNote);

export default router;
