import mongoose from "mongoose";

const upstoxAuthSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // If multiple users aren't connecting individually, we can just store one global token or map it to the admin. For now, we'll store a global token for the platform since it's a proprietary engine.
    },
    accessToken: {
        type: String,
        required: true
    },
    authCode: {
        type: String,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const UpstoxAuth = mongoose.model("UpstoxAuth", upstoxAuthSchema);

export default UpstoxAuth;
