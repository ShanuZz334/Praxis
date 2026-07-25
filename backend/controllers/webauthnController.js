import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Passkey from '../models/Passkey.js';

const rpName = 'Praxis Dashboard';
const rpID = process.env.NODE_ENV === 'production' ? 'praxis-dashboard.com' : 'localhost';
const origin = process.env.CLIENT_URL || `http://${rpID}:5173`;

// ==========================================
// REGISTRATION (Requires logged-in user)
// ==========================================

export const generateRegistration = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const userPasskeys = await Passkey.find({ userId: user._id });

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: new Uint8Array(Buffer.from(user._id.toString())),
            userName: user.email,
            userDisplayName: user.fullName,
            attestationType: 'none',
            excludeCredentials: userPasskeys.map(passkey => ({
                id: passkey.credentialID,
                type: 'public-key',
                transports: passkey.transports,
            })),
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'required',
                userVerification: 'preferred',
            },
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.json(options);
    } catch (error) {
        console.error("Error generating registration options:", error);
        res.status(500).json({ message: "Failed to generate registration options", error: error.message });
    }
};

export const verifyRegistration = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.currentChallenge) {
            return res.status(400).json({ message: "No active registration challenge" });
        }

        const expectedChallenge = user.currentChallenge;
        const body = req.body;

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: false,
            });
        } catch (error) {
            console.error("Verification failed:", error);
            return res.status(400).json({ message: error.message });
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;
            
            const newPasskey = new Passkey({
                userId: user._id,
                credentialID: credential.id,
                credentialPublicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                credentialDeviceType,
                credentialBackedUp,
                transports: credential.transports || [],
                deviceName: 'Registered Device'
            });

            await newPasskey.save();

            user.currentChallenge = null;
            await user.save();

            return res.json({ verified: true });
        } else {
            return res.status(400).json({ message: "Verification failed" });
        }
    } catch (error) {
        console.error("Error verifying registration:", error);
        res.status(500).json({ message: "Failed to verify registration", error: error.message });
    }
};

// ==========================================
// AUTHENTICATION (Public - Discoverable Credentials)
// ==========================================

export const generateAuthentication = async (req, res) => {
    try {
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred',
        });

        // Sign the challenge so we can verify it statelessly
        const challengeToken = jwt.sign(
            { challenge: options.challenge },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({ options, challengeToken });
    } catch (error) {
        console.error("Error generating authentication options:", error);
        res.status(500).json({ message: "Failed to generate authentication options", error: error.message });
    }
};

export const verifyAuthentication = async (req, res) => {
    try {
        const { response, challengeToken } = req.body;

        if (!challengeToken || !response) {
            return res.status(400).json({ message: "Missing challenge token or response" });
        }

        let expectedChallenge;
        try {
            const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
            expectedChallenge = decoded.challenge;
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired challenge token" });
        }

        const credentialID = response.id;
        const passkey = await Passkey.findOne({ credentialID });

        if (!passkey) {
            return res.status(404).json({ message: "Passkey not found" });
        }

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: passkey.credentialID,
                    publicKey: new Uint8Array(passkey.credentialPublicKey),
                    counter: passkey.counter,
                    transports: passkey.transports,
                },
                requireUserVerification: false,
            });
        } catch (error) {
            console.error("Authentication verification failed:", error);
            return res.status(400).json({ message: error.message });
        }

        const { verified, authenticationInfo } = verification;

        if (verified) {
            // Update the counter
            passkey.counter = authenticationInfo.newCounter;
            await passkey.save();

            // Log the user in
            const user = await User.findById(passkey.userId);
            if (!user) {
                return res.status(404).json({ message: "User associated with this passkey no longer exists" });
            }

            // Generate Login Token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "30d",
            });
            user.activeToken = token;
            await user.save();

            const userResponse = {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profileImage: user.profileImage,
                isDemo: user.isDemo
            };

            return res.json({ verified: true, user: userResponse, token });
        } else {
            return res.status(400).json({ message: "Verification failed" });
        }
    } catch (error) {
        console.error("Error verifying authentication:", error);
        res.status(500).json({ message: "Failed to verify authentication", error: error.message });
    }
};
