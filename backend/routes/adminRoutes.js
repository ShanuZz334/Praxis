import express from "express";
import { upsertCredential, listCredentials, toggleCredential } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected (add RBAC later if needed)
router.post("/credentials", protect, upsertCredential);
router.get("/credentials", protect, listCredentials);
router.patch("/credentials/:provider/toggle", protect, toggleCredential);

export default router;
