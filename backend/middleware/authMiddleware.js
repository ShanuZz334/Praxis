import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        // Single Session Check
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
