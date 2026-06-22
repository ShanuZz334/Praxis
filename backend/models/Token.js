/**
 * @file Token.js
 * @purpose MongoDB schema for broker OAuth tokens.
 * @responsibilities
 * - Stores broker OAuth access and refresh tokens
 * - Tracks token expiration dates
 * - Stores raw token response data
 * - Supports multiple broker providers
 * @key_exports
 * - Token - Mongoose model (default export)
 * @dependencies
 * - mongoose - ODM
 * @lifecycle
 * - Used by broker services for OAuth token management
 * - Stores tokens for Zerodha, Upstox, Angel One, etc.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import mongoose from "mongoose";

// =============================
// Schema Definition
// =============================
const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  raw: { type: Object }
});

// =============================
// Model Export
// =============================
const Token = mongoose.model("Token", tokenSchema);

export default Token;
