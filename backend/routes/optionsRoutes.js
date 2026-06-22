import express from "express";
import { getOptionsChain, upsertOptionsChain } from "../controllers/optionsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:symbol", getOptionsChain);
router.post("/", protect, upsertOptionsChain);

export default router;
