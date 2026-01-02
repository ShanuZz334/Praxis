// routes/foreignMarketRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
} from "../controllers/foreignController.js"; // updated here

const router = express.Router();

router.get("/", getAllMarkets);
router.get("/:id", protect, getMarketById);
router.post("/", protect, createMarket);
router.put("/:id", protect, updateMarket);
router.delete("/:id", protect, deleteMarket);

export default router;
