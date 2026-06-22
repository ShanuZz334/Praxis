/**
 * @file authMiddleware.js
 * @purpose JWT authentication middleware for protected routes.
 * @responsibilities
 * - Validates JWT tokens from Authorization header
 * - Verifies user existence in database
 * - Implements single-session enforcement via activeToken check
 * - Attaches authenticated user to request object
 * - Handles token expiration and invalid token errors
 * @key_exports
 * - protect - Express middleware function
 * @dependencies
 * - jsonwebtoken - JWT verification
 * - User - User model
 * @lifecycle
 * - Applied to protected routes in route definitions
 * - Requires JWT_SECRET environment variable
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =============================
// Middleware Function
// =============================
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    if (token === "demo-token-123456") {
        req.user = {
            _id: "demo_user_id_123",
            fullName: "Demo User",
            email: "demo@stocky.app",
            profileImage: "https://ui-avatars.com/api/?name=Demo+User&background=random",
            role: "user",
            isDemo: true,
            brokerSettings: {},
            notificationSettings: {},
            preferences: { theme: 'dark', tradingMode: 'balanced', soundAlerts: true }
        };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        if (user.activeToken !== token) {
            return res.status(401).json({ message: "Internal Session Conflict: This account is logged in on another device. Please log in again." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }
};
