import { encrypt, decrypt } from '../utils/encryption.js';
import User from '../models/User.js';

/**
 * Save broker credentials
 * @route POST /api/broker/credentials
 */
export const saveBrokerCredentials = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!broker || !apiKey || !apiSecret) {
            return res.status(400).json({
                error: 'Missing required fields: broker, apiKey, apiSecret'
            });
        }

        // Encrypt sensitive data
        const encryptedApiKey = encrypt(apiKey);
        const encryptedApiSecret = encrypt(apiSecret);
        const encryptedClientId = clientId ? encrypt(clientId) : null;

        // Update user's broker credentials
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

/**
 * Get user's broker credentials (decrypted)
 * @route GET /api/broker/credentials
 */
export const getBrokerCredentials = async (req, res) => {
    try {
        const userId = req.user.id;

        // Explicitly select the fields that are marked select: false
        const user = await User.findById(userId).select('+apiKey +apiSecret +clientId');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Decrypt credentials
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

/**
 * Test broker connection
 * @route POST /api/broker/test
 */
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
                // Handle basic validation for other brokers
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

// Helper functions
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
