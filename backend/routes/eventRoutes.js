import express from "express";
import { getEvents, addEvent } from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/", protect, addEvent);

export default router;
