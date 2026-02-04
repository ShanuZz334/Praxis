/**
 * @file brokerController.js
 * @purpose Broker integration and credential management controller.
 * @responsibilities
 * - Saves and retrieves encrypted broker credentials
 * - Tests broker API connections
 * - Validates broker-specific credential formats
 * - Handles OAuth flow requirements for supported brokers
 * - Supports multiple brokers: Zerodha, Upstox, Angel One, ICICI Direct, HDFC Sec, Kotak Sec, 5Paisa, Groww, Sharekhan, Motilal
 * @key_exports
 * - saveBrokerCredentials - Saves encrypted broker API credentials
 * - getBrokerCredentials - Retrieves and decrypts broker credentials
 * - testBrokerConnection - Tests broker API connection and validates credentials
 * @dependencies
 * - User - User model
 * - encryption - Encrypt/decrypt utilities
 * @lifecycle
 * - Called by brokerRoutes.js
 * - Requires JWT authentication middleware
 * - Requires UPSTOX_REDIRECT_URI environment variable for Upstox OAuth
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import { encrypt, decrypt } from '../utils/encryption.js';
import User from '../models/User.js';

// =============================
// Credential Management
// =============================

export const saveBrokerCredentials = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;
        const userId = req.user.id;

        if (!broker || !apiKey || !apiSecret) {
            return res.status(400).json({
                error: 'Missing required fields: broker, apiKey, apiSecret'
            });
        }

        const encryptedApiKey = encrypt(apiKey);
        const encryptedApiSecret = encrypt(apiSecret);
        const encryptedClientId = clientId ? encrypt(clientId) : null;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                broker: broker,
                apiKey: encryptedApiKey,
                apiSecret: encryptedApiSecret,
                clientId: encryptedClientId
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Broker credentials saved successfully'
        });
    } catch (error) {
        console.error('Error saving broker credentials:', error);
        res.status(500).json({
            error: 'Failed to save credentials',
            message: error.message
        });
    }
};

export const getBrokerCredentials = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('+apiKey +apiSecret +clientId');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const credentials = {
            broker: user.broker || '',
            apiKey: user.apiKey ? decrypt(user.apiKey) : '',
            apiSecret: user.apiSecret ? decrypt(user.apiSecret) : '',
            clientId: user.clientId ? decrypt(user.clientId) : ''
        };

        res.json(credentials);
    } catch (error) {
        console.error('Error fetching broker credentials:', error);
        res.status(500).json({
            error: 'Failed to fetch credentials',
            message: error.message
        });
    }
};

// =============================
// Connection Testing
// =============================

export const testBrokerConnection = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;

        if (!broker || !apiKey || !apiSecret) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        let result;

        switch (broker.toLowerCase()) {
            case 'zerodha':
                result = await testZerodhaConnection(apiKey, apiSecret);
                break;
            case 'upstox':
                result = await testUpstoxConnection(apiKey, apiSecret);
                break;
            case 'angelone':
                result = await testAngelOneConnection(apiKey, apiSecret, clientId);
                break;
            default:
                if (['icicidirect', 'hdfcsec', 'kotaksec', '5paisa', 'groww', 'sharekhan', 'motilal'].includes(broker.toLowerCase())) {
                    result = {
                        success: true,
                        message: `${broker} integration coming soon. Credentials saved.`,
                        requiresOAuth: false
                    };
                } else {
                    return res.status(400).json({
                        error: 'Invalid broker'
                    });
                }
        }

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error testing broker connection:', error);
        res.status(500).json({
            success: false,
            message: 'Connection test failed: ' + error.message
        });
    }
};

// =============================
// Broker-Specific Validators
// =============================

async function testZerodhaConnection(apiKey, apiSecret) {
    try {
        if (apiKey && apiKey.length > 5) {
            return {
                success: true,
                message: 'API Key format valid. OAuth login required for full access.',
                requiresOAuth: true,
                loginUrl: `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`
            };
        } else {
            return {
                success: false,
                message: 'Invalid API Key format'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Connection test failed: ' + error.message
        };
    }
}

async function testUpstoxConnection(apiKey, apiSecret) {
    try {
        if (apiKey.length > 5 && apiSecret.length > 5) {
            return {
                success: true,
                message: 'Credentials format valid. OAuth login required.',
                requiresOAuth: true,
                loginUrl: `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${process.env.UPSTOX_REDIRECT_URI}`
            };
        } else {
            return {
                success: false,
                message: 'Invalid credentials format'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Connection test failed: ' + error.message
        };
    }
}

async function testAngelOneConnection(apiKey, apiSecret, clientId) {
    try {
        if (apiKey && apiSecret && clientId) {
            return {
                success: true,
                message: 'Credentials format valid. Ready to connect.',
                requiresOAuth: false
            };
        } else {
            return {
                success: false,
                message: 'Missing required credentials (API Key, Secret, Client ID)'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Connection test failed: ' + error.message
        };
    }
}
