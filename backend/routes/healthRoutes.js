import express from "express";
import { checkProvidersHealth } from "../controllers/healthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/providers", protect, checkProvidersHealth);

export default router;
