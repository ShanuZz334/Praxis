import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventsController.js";

const router = express.Router();

// Public: fetch upcoming or important events (dashboard)
router.get("/", getAllEvents);

// Protected: get a single event by ID
router.get("/:id", protect, getEventById);

// Protected: create a new event
router.post("/", protect, createEvent);

// Protected: update an existing event
router.put("/:id", protect, updateEvent);

// Protected: delete an event
router.delete("/:id", protect, deleteEvent);

export default router;
