/**
 * @file authRoutes.js
 * @purpose API route definitions for authentication.
 * @responsibilities
 * - Defines authentication endpoints (register, login, verify)
 * - Applies authentication middleware to protected routes
 * - Routes requests to authController
 * @key_exports
 * - Express router (default export)
 * @dependencies
 * - express - Router
 * - authController - Request handlers
 * - authMiddleware - Authentication middleware
 * - uploadMiddleware - File upload handling
 * @lifecycle
 * - Registered in server.js as /api/v1/auth
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    registerUser,
    loginUser,
    getUserInfo,
    verifyCredentials,
} from "../controllers/authController.js";
import upload from "../middleware/uploadMiddleware.js";

// =============================
// Router Setup
// =============================
const router = express.Router();

// =============================
// Route Definitions
// =============================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect, getUserInfo);
router.post("/verify-credentials", verifyCredentials);

// =============================
// Export
// =============================
export default router;
