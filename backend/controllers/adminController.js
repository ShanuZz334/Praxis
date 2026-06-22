import { query } from "../config/postgres.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { z } from "zod";

// Validation schema for credentials
const credentialSchema = z.object({
    provider: z.string().min(1),
    label: z.string().optional(),
    key: z.string().min(1),
    secret: z.string().optional(),
    extra: z.record(z.any()).nullable().optional()
});

/**
 * @desc    Add or Update API Credential
 * @route   POST /api/v1/admin/credentials
 * @access  Private (Admin)
 */
export const upsertCredential = async (req, res) => {
    try {
        const validation = credentialSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Validation Error",
                errors: validation.error.errors
            });
        }

        const { provider, label, key, secret, extra } = validation.data;

        // Encrypt sensitive data
        const keyEncrypted = encrypt(key);
        const secretEncrypted = secret ? encrypt(secret) : null;
        const extraEncrypted = extra ? encrypt(JSON.stringify(extra)) : null;

        // Upsert into DB
        const result = await query(`
            INSERT INTO api_credentials (provider, label, key_encrypted, secret_encrypted, extra_json_encrypted, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (provider) 
            DO UPDATE SET 
                label = EXCLUDED.label,
                key_encrypted = EXCLUDED.key_encrypted,
                secret_encrypted = EXCLUDED.secret_encrypted,
                extra_json_encrypted = EXCLUDED.extra_json_encrypted,
                updated_at = NOW()
            RETURNING id, provider, label, is_enabled, updated_at
        `, [provider.toUpperCase(), label, keyEncrypted, secretEncrypted, extraEncrypted]);

        res.status(200).json({
            message: "Credential saved safely.",
            credential: result.rows[0]
        });

    } catch (err) {
        console.error("Error saving credential:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @desc    List All Credentials (Masked)
 * @route   GET /api/v1/admin/credentials
 * @access  Private (Admin)
 */
export const listCredentials = async (req, res) => {
    try {
        const result = await query(`
            SELECT id, provider, label, is_enabled, created_at, updated_at 
            FROM api_credentials 
            ORDER BY provider ASC
        `);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error listing credentials:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @desc    Toggle Credential Status
 * @route   PATCH /api/v1/admin/credentials/:provider/toggle
 * @access  Private (Admin)
 */
export const toggleCredential = async (req, res) => {
    try {
        const { provider } = req.params;
        const result = await query(`
            UPDATE api_credentials 
            SET is_enabled = NOT is_enabled, updated_at = NOW()
            WHERE provider = $1
            RETURNING provider, is_enabled
        `, [provider.toUpperCase()]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Provider not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error toggling credential:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
