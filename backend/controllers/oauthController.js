import axios from "axios";
import { query } from "../config/postgres.js";
import { encrypt, decrypt } from "../utils/encryption.js";

const UPSTOX_AUTH_URL = "https://api.upstox.com/v2/login/authorization/dialog";
const UPSTOX_TOKEN_URL = "https://api.upstox.com/v2/login/authorization/token";

/**
 * @desc    Initiate Upstox OAuth Flow
 * @route   GET /api/v1/oauth/upstox/authorize
 * @access  Private (Admin)
 */
export const initiateUpstoxAuth = async (req, res) => {
    try {
        const apiKey = process.env.UPSTOX_API_KEY?.trim();
        const redirectUri = process.env.UPSTOX_REDIRECT_URI?.trim();
        const state = Math.random().toString(36).substring(7); // Recommended state parameter

        console.log("[Upstox OAuth] Initiating auth flow");
        console.log("[Upstox OAuth] API Key:", apiKey);
        console.log("[Upstox OAuth] Redirect URI:", redirectUri);

        if (!apiKey || !redirectUri) {
            return res.status(500).json({ message: "Upstox credentials not configured" });
        }

        // Build authorization URL exactly as per documentation sample
        const authUrl = `${UPSTOX_AUTH_URL}?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

        res.status(200).json({
            authUrl,
            message: "Redirect user to this URL to authorize Upstox"
        });
    } catch (err) {
        console.error("Error initiating Upstox OAuth:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @desc    Handle Upstox OAuth Callback
 * @route   POST /api/v1/oauth/upstox/callback
 * @access  Private (Admin)
 */
export const handleUpstoxCallback = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const apiKey = process.env.UPSTOX_API_KEY;
        const apiSecret = process.env.UPSTOX_API_SECRET;
        const redirectUri = process.env.UPSTOX_REDIRECT_URI;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ message: "Upstox credentials not configured" });
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(UPSTOX_TOKEN_URL, {
            code,
            client_id: apiKey,
            client_secret: apiSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        if (!access_token) {
            return res.status(500).json({ message: "Failed to obtain access token" });
        }

        // Encrypt and store in database
        const accessTokenEncrypted = encrypt(access_token);
        const refreshTokenEncrypted = refresh_token ? encrypt(refresh_token) : null;

        // Store in api_credentials table
        await query(`
            INSERT INTO api_credentials (provider, label, key_encrypted, secret_encrypted, extra_json_encrypted, is_enabled, updated_at)
            VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
            ON CONFLICT (provider) 
            DO UPDATE SET 
                key_encrypted = EXCLUDED.key_encrypted,
                secret_encrypted = EXCLUDED.secret_encrypted,
                extra_json_encrypted = EXCLUDED.extra_json_encrypted,
                is_enabled = TRUE,
                updated_at = NOW()
        `, [
            'UPSTOX',
            'Upstox (Official)',
            encrypt(apiKey),
            encrypt(apiSecret),
            encrypt(JSON.stringify({
                access_token,
                refresh_token,
                expires_in,
                obtained_at: Date.now()
            }))
        ]);

        res.status(200).json({
            message: "Upstox connected successfully",
            expiresIn: expires_in
        });

    } catch (err) {
        console.error("Error handling Upstox callback:", err.response?.data || err.message);
        res.status(500).json({
            message: "Failed to exchange authorization code",
            error: err.response?.data?.message || err.message
        });
    }
};

/**
 * @desc    Get stored Upstox access token
 * @route   GET /api/v1/oauth/upstox/token
 * @access  Private (Admin)
 */
export const getUpstoxToken = async (req, res) => {
    try {
        const result = await query(`
            SELECT extra_json_encrypted 
            FROM api_credentials 
            WHERE provider = 'UPSTOX' AND is_enabled = TRUE
        `);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Upstox not connected" });
        }

        const extraJson = JSON.parse(decrypt(result.rows[0].extra_json_encrypted));
        const { access_token, expires_in, obtained_at } = extraJson;

        // Check if token is expired
        const expiresAt = obtained_at + (expires_in * 1000);
        const isExpired = Date.now() > expiresAt;

        res.status(200).json({
            hasToken: true,
            isExpired,
            expiresAt: new Date(expiresAt).toISOString()
        });

    } catch (err) {
        console.error("Error fetching Upstox token:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
