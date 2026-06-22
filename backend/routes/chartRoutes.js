import express from "express";
import { getChartData, upsertChartData } from "../controllers/chartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:metricKey", getChartData);
router.post("/", protect, upsertChartData); // Protect write access

export default router;
