import express from "express";
import { initiateUpstoxAuth, handleUpstoxCallback, getUpstoxToken } from "../controllers/oauthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upstox OAuth routes
router.get("/upstox/authorize", protect, initiateUpstoxAuth);
router.post("/upstox/callback", protect, handleUpstoxCallback);
router.get("/upstox/token", protect, getUpstoxToken);

export default router;
