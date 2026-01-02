import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllOptions,
  getOptionById,
  createOption,
  updateOption,
  deleteOption,
} from "../controllers/optionsController.js";

const router = express.Router();

// Public: fetch all options data (dashboard or symbol-specific)
router.get("/", getAllOptions);

// Protected: fetch single option entry by ID
router.get("/:id", protect, getOptionById);

// Protected: create new option entry
router.post("/", protect, createOption);

// Protected: update option entry
router.put("/:id", protect, updateOption);

// Protected: delete option entry
router.delete("/:id", protect, deleteOption);

export default router;
