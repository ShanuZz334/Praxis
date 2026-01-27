import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImage: { type: String, default: null },
        profileImageUrl: { type: String, default: null },
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
        // Broker Integration
        broker: {
            type: String,
            enum: ['zerodha', 'upstox', 'angelone', null],
            default: null
        },
        apiKey: { type: String, select: false }, // Encrypted
        apiSecret: { type: String, select: false }, // Encrypted
        clientId: { type: String, select: false }, // Encrypted
        brokerAccessToken: { type: String, select: false },
        brokerRefreshToken: { type: String, select: false },
        brokerTokenExpiry: { type: Date },
    },
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
