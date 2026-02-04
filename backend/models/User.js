/**
 * @file User.js
 * @purpose MongoDB schema for User entity.
 * @responsibilities
 * - Defines user schema structure with profile, settings, and broker integration
 * - Implements password hashing via pre-save hook
 * - Provides password comparison instance method
 * - Manages broker credentials with encryption (select: false)
 * - Handles notification settings and user preferences
 * - Tracks email verification status and active session tokens
 * @key_exports
 * - User - Mongoose model (default export)
 * @dependencies
 * - mongoose - ODM
 * - bcryptjs - Password hashing
 * @lifecycle
 * - Used by controllers for database operations
 * - Password auto-hashed on save
 * - Timestamps auto-managed by Mongoose
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// =============================
// Schema Definition
// =============================
const UserSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImage: { type: String, default: null },
        brokerSettings: {
            broker: { type: String, default: "" },
            apiKey: { type: String, default: "" },
            apiSecret: { type: String, default: "" },
            clientId: { type: String, default: "" },
        },
        notificationSettings: {
            tradeAlerts: { type: Boolean, default: true },
            portfolioAlerts: { type: Boolean, default: true },
            systemMessages: { type: Boolean, default: true },
            deliveryApp: { type: Boolean, default: true },
            deliveryEmail: { type: Boolean, default: false },
        },
        isEmailVerified: { type: Boolean, default: false },
        preferences: {
            tradingMode: { type: String, default: "balanced" },
            theme: { type: String, default: "dark" },
            soundAlerts: { type: Boolean, default: true },
        },
        broker: {
            type: String,
            enum: ['zerodha', 'upstox', 'angelone', null],
            default: null
        },
        apiKey: { type: String, select: false },
        apiSecret: { type: String, select: false },
        clientId: { type: String, select: false },
        brokerAccessToken: { type: String, select: false },
        brokerRefreshToken: { type: String, select: false },
        brokerTokenExpiry: { type: Date },
        activeToken: { type: String, default: null },
    },
    { timestamps: true }
);

// =============================
// Pre-save Hooks
// =============================
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// =============================
// Instance Methods
// =============================
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// =============================
// Model Export
// =============================
const User = mongoose.model("User", UserSchema);
export default User;
