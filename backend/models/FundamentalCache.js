import mongoose from "mongoose";

const FundamentalCacheSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    data: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("FundamentalCache", FundamentalCacheSchema);
