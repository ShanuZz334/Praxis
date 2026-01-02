// backend/models/Token.js
import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  raw: { type: Object }
});

const Token = mongoose.model("Token", tokenSchema);

export default Token;
