import express from "express";
const router = express.Router();

// Empty temporarily
router.get("/", (req, res) => {
  res.json({ message: "Fundamentals API disabled temporarily" });
});

export default router;
