/**
 * @file Login.jsx
 * @purpose Primary user authentication portal for existing account access.
 * @responsibilities
 * - Captures and validates user credentials (email, password).
 * - Interfaces with the backend auth API for session creation.
 * - Updates global user context upon successful authentication.
 * - Manages local UI states (loading, errors, input data).
 * @key_exports
 * - Login (Default): Secondary navigation target for authentication.
 * @dependencies
 * - axiosInstance: Pre-configured API client.
 * - UserContext: For updating global session state.
 * - API_PATHS: Centralized endpoint registry.
 * - validateEmail: Utility for RFC-compliant email validation.
 * @lifecycle
 * - Rendered by AppRoutes within AuthLayout.
 * - Transitions to Dashboard upon successful login.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import { validateEmail } from "@/shared/utils/helper";
import Loader from "@/shared/components/ui/Loader";
import { startAuthentication } from "@simplewebauthn/browser";
import { generateAuthenticationOptions, verifyAuthentication } from "@/services/userService";
import { Fingerprint } from "lucide-react";

// =============================
// Main Component
// =============================
const Login = () => {
  // -----------------------------
  // State & Context
  // -----------------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fingerprintFailCount, setFingerprintFailCount] = useState(0);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  // -----------------------------
  // Event Handlers
  // -----------------------------
  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const { options, challengeToken } = await generateAuthenticationOptions();
      
      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
      } catch (err) {
        throw new Error("Biometric sign in cancelled or failed.");
      }

      const verificationResp = await verifyAuthentication({
        response: asseResp,
        challengeToken
      });

      if (verificationResp && verificationResp.verified) {
        updateUser(verificationResp.user, verificationResp.token);
        navigate("/dashboard/home");
      } else {
        throw new Error("Biometric verification failed.");
      }
    } catch (err) {
      console.error(err);
      setFingerprintFailCount(prev => prev + 1);
      setError(err.message || "Failed to authenticate with biometrics.");
    } finally {
      setIsLoading(false);
    }
  };
  // -----------------------------
  /**
   * handleLogin
   * Processes the submission of the login form.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateEmail(email)) {
      setIsLoading(false);
      return setError("Invalid email.");
    }

    if (!password) {
      setIsLoading(false);
      return setError("Please enter your password.");
    }

    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { user, token } = res.data;
      updateUser(user, token);
      navigate("/dashboard/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // Component UI
  // -----------------------------
  return (
    <div className="w-full max-w-[335px] md:max-w-md mx-auto p-2 md:p-0">
      <h2 className="hidden md:block text-2xl md:text-3xl font-bold text-white mb-2">
        Login
      </h2>
      <p className="hidden md:block text-sm text-white/70 mb-6 md:mb-8">
        Access your trading dashboard
      </p>

      {fingerprintFailCount < 4 ? (
        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500 min-h-[300px]">
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isLoading}
            className="group relative flex flex-col items-center justify-center text-blue-400 hover:text-blue-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader size="sm" color="blue" />
            ) : (
              <Fingerprint size={64} strokeWidth={1.5} className="group-hover:animate-pulse" />
            )}
          </button>
          
          <div className="flex flex-col items-center mt-auto space-y-3 pt-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white/90">Biometric Sign In</h3>
            </div>
            
            {error && <p className="text-red-400/90 text-sm text-center max-w-[250px]">{error}</p>}
            
            <button
              type="button"
              onClick={() => setFingerprintFailCount(4)}
              className="text-xs text-white/30 hover:text-white/70 transition-colors underline pt-2"
            >
              Use Email & Password instead
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-3 md:space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Email Section */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Email
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2.5 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 h-6"
            />
          </div>
        </div>

        {/* Password Section */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Password
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2.5 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 Characters"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 h-6"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Action Section */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 md:py-3 rounded-md bg-[#1E1BFF] text-white font-medium shadow-md hover:bg-[#1720cc] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader size="xxs" color="white" />
          ) : (
            "Login"
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            className="text-xs text-white/30 hover:text-white/70 transition-colors underline"
            onClick={() => setFingerprintFailCount(0)}
          >
            Use Biometric Sign In
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

// =============================
// Exports
// =============================
export default Login;
