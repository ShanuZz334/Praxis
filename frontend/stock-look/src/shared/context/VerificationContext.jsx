/**
 * @file VerificationContext.jsx
 * @purpose Manages multi-step verification state (Email OTP, TOTP).
 * @responsibilities
 * - Tracks verification status (`isVerifying`, `isVerified`).
 * - Handles credential verification API calls.
 * - Stores `signupToken` temporarily during the process.
 * @key_exports
 * - VerificationProvider
 * @dependencies
 * - axiosInstance, API_PATHS
 * - VerificationContext (Instance)
 * @lifecycle
 * - Wraps Auth components usually during Signup/Login flows.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import React, { useState, useCallback } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { VerificationContext } from './VerificationContextInstance';

// =============================
// Provider Component
// =============================

export const VerificationProvider = ({ children }) => {

    // --- State ---
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [signupToken, setSignupToken] = useState(null);

    // --- Actions ---

    const initiateVerification = useCallback((userEmail) => {
        setEmail(userEmail);
        setIsVerifying(true);
        setError('');
    }, []);

    const verifyCredentials = useCallback(async (email, totp) => {
        setLoading(true);
        setError('');

        if (!email || !totp) {
            setError("Missing required verification details");
            setLoading(false);
            return false;
        }

        try {
            const res = await axiosInstance.post(API_PATHS.AUTH.VERIFY_CREDENTIALS, { email, totp });
            setSignupToken(res.data.signupToken); // Store the token
            setIsVerified(true);
            setIsVerifying(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetVerification = useCallback(() => {
        setIsVerifying(false);
        setIsVerified(false);
        setSignupToken(null);
        setError('');
    }, []);

    // --- Render ---

    const contextValue = React.useMemo(() => ({
        isVerifying,
        isVerified,
        signupToken, // Expose token
        email,
        loading,
        error,
        initiateVerification,
        verifyCredentials,
        resetVerification
    }), [isVerifying, isVerified, signupToken, email, loading, error, initiateVerification, verifyCredentials, resetVerification]);

    return (
        <VerificationContext.Provider value={contextValue}>
            {children}
        </VerificationContext.Provider>
    );
};

