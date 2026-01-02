import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getPnL } from "../controllers/pnlController.js";

const router = express.Router();

// Protected route: fetch live PnL and trades
router.get("/", protect, getPnL);

export default router;
