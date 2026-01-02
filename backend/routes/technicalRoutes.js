import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllTechnicals,
  getTechnicalById,
  createTechnical,
  updateTechnical,
  deleteTechnical,
} from "../controllers/technicalController.js";

const router = express.Router();

// Public: fetch all technicals (dashboard or symbol-specific)
router.get("/", getAllTechnicals);

// Protected: fetch single technical entry by ID
router.get("/:id", protect, getTechnicalById);

// Protected: create new technical entry
router.post("/", protect, createTechnical);

// Protected: update technical entry
router.put("/:id", protect, updateTechnical);

// Protected: delete technical entry
router.delete("/:id", protect, deleteTechnical);

export default router;
