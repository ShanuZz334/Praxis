import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    registerUser,
    loginUser,
    getUserInfo,
    requestOTP,
    verifyCredentials,
} from "../controllers/authController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect, getUserInfo);
router.post("/request-otp", requestOTP);
router.post("/verify-credentials", verifyCredentials);

// Upload route moved to userRoutes.js

export default router;
