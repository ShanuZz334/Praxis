import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    symbols: [{ type: String }] // Array of instrumentKeys
}, { timestamps: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
export default Watchlist;
