/**
 * @file uploadMiddleware.js
 * @purpose Multer middleware for image upload handling.
 * @responsibilities
 * - Configures Cloudinary storage for uploaded images
 * - Validates file types (JPEG, PNG, JPG only)
 * - Enforces 5MB file size limit
 * - Provides multer instance for route handlers
 * @key_exports
 * - upload - Multer instance (default export)
 * @dependencies
 * - multer - File upload middleware
 * - cloudinaryConfig - Cloudinary storage configuration
 * @lifecycle
 * - Used in userRoutes for image upload endpoints
 * - Requires Cloudinary configuration
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import multer from "multer";
import { storage } from "../config/cloudinaryConfig.js";

// =============================
// File Filter
// =============================
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .jpg, .png formats are allowed"), false);
    }
};

// =============================
// Multer Configuration
// =============================
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// =============================
// Export
// =============================
export default upload;
