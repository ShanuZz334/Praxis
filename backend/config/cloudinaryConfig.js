/**
 * @file cloudinaryConfig.js
 * @purpose Cloudinary cloud storage configuration.
 * @responsibilities
 * - Configures Cloudinary SDK with API credentials
 * - Sets up Multer storage engine for Cloudinary
 * - Defines upload folder and file transformations
 * - Restricts allowed file formats (jpg, png, jpeg)
 * - Applies image size limits (500x500px)
 * @key_exports
 * - cloudinary - Cloudinary SDK instance
 * - storage - Multer-Cloudinary storage engine
 * @dependencies
 * - cloudinary - Cloud storage SDK
 * - multer-storage-cloudinary - Multer storage adapter
 * - dotenv - Environment variable loader
 * @lifecycle
 * - Loaded on server startup
 * - Used by uploadMiddleware
 * - Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET environment variables
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// =============================
// Environment Configuration
// =============================
dotenv.config();

// =============================
// Cloudinary Configuration
// =============================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================
// Storage Configuration
// =============================
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'stocky_profiles',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
    },
});

// =============================
// Exports
// =============================
export { cloudinary, storage };
