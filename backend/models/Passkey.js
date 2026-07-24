import mongoose from "mongoose";

const PasskeySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        credentialID: {
            type: String,
            required: true,
            unique: true
        },
        credentialPublicKey: {
            type: Buffer,
            required: true
        },
        counter: {
            type: Number,
            required: true,
            default: 0
        },
        credentialDeviceType: {
            type: String,
            required: true,
            default: 'singleDevice'
        },
        credentialBackedUp: {
            type: Boolean,
            required: true,
            default: false
        },
        transports: {
            type: [String],
            default: []
        },
        deviceName: {
            type: String,
            default: 'Unknown Device'
        }
    },
    { timestamps: true }
);

const Passkey = mongoose.model("Passkey", PasskeySchema);
export default Passkey;
