import React, { createContext, useState, useCallback } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

export const VerificationContext = createContext(null);

export const VerificationProvider = ({ children }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [signupToken, setSignupToken] = useState(null);

    const requestOTP = useCallback(async (userEmail) => {
        setLoading(true);
        setError('');
        try {
            await axiosInstance.post(API_PATHS.AUTH.REQUEST_OTP, { email: userEmail });
            setEmail(userEmail);
            setIsVerifying(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyCredentials = useCallback(async (email, otp, totp) => {
        setLoading(true);
        setError('');

        if (!email || !otp || !totp) {
            setError("Missing required verification details");
            setLoading(false);
            return false;
        }

        try {
            const res = await axiosInstance.post(API_PATHS.AUTH.VERIFY_CREDENTIALS, { email, otp, totp });
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

    return (
        <VerificationContext.Provider value={{
            isVerifying,
            isVerified,
            signupToken, // Expose token
            email,
            loading,
            error,
            requestOTP,
            verifyCredentials,
            resetVerification
        }}>
            {children}
        </VerificationContext.Provider>
    );
};
