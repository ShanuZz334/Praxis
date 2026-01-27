import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    registerUser,
    loginUser,
    getUserInfo,
    verifyCredentials,
} from "../controllers/authController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect, getUserInfo);
router.post("/verify-credentials", verifyCredentials);

// Upload route moved to userRoutes.js

export default router;
