/**
 * @file SignUp.jsx
 * @purpose Registration portal for creating new user accounts with integrated security verification.
 * @responsibilities
 * - Manages user onboarding data (Name, Email, Password, Profile Picture).
 * - Enforces mandatory Admin TOTP verification via VerificationContext.
 * - Handles asynchronous image uploads via Cloudinary/Utility services.
 * - Synchronizes with the backend registration engine.
 * @key_exports
 * - SignUp (Default): Entry view for user registration.
 * @dependencies
 * - VerificationContext: Core security layer for multi-stage registration.
 * - axiosInstance: API client for registration payloads.
 * - uploadImage: Specialized utility for binary asset handling.
 * - UserContext: For bootstrapping the user session post-registration.
 * @lifecycle
 * - Rendered by AppRoutes.
 * - Resets verification state on mount to ensure a clean security context.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import uploadImage from "@/shared/utils/uploadImage";
import { validateEmail } from "@/shared/utils/helper";
import { VerificationContext } from "@/shared/context/VerificationContextInstance";
import Loader from "@/shared/components/ui/Loader";

// =============================
// Main Component
// =============================
const SignUp = () => {
  // -----------------------------
  // Local State
  // -----------------------------
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // -----------------------------
  // External Contexts
  // -----------------------------
  const { updateUser } = useContext(UserContext);
  const {
    isVerified,
    initiateVerification,
    error: verifyError,
    signupToken,
    resetVerification,
    loading: otpLoading
  } = useContext(VerificationContext);

  const navigate = useNavigate();

  // -----------------------------
  // Lifecycle Effects
  // -----------------------------
  useEffect(() => {
    resetVerification();
  }, [resetVerification]);

  // -----------------------------
  // Business Logic Handlers
  // -----------------------------
  /**
   * handleSubmit
   * Orchestrates the registration sequence including verification checks and image uploads.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation Checks
    if (!fullName) return setError("Enter full name.");
    if (!validateEmail(email)) return setError("Invalid email.");
    if (!password) return setError("Enter password.");
    if (!isVerified) return setError("Please verify with Admin TOTP first.");

    setIsSigningUp(true);
    let profileImage = "";

    try {
      // Asset Processing
      if (profilePic) {
        const uploadRes = await uploadImage(profilePic, true);
        profileImage = uploadRes?.imageUrl || "";
      }

      // API Registration
      const res = await axiosInstance.post(
        API_PATHS.AUTH.REGISTER,
        {
          fullName,
          email,
          password,
          profileImage: profileImage || undefined,
        },
        {
          headers: {
            "x-signup-token": signupToken
          }
        }
      );

      const { user, token } = res.data;
      updateUser(user, token);
      navigate("/dashboard/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create account. Please try again."
      );
    } finally {
      setIsSigningUp(false);
    }
  };

  // -----------------------------
  // Component UI
  // -----------------------------
  return (
    <div className="w-full max-w-[320px] md:max-w-md mx-auto p-2 md:p-0">
      <div className="hidden md:block text-center mb-5 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
          Create Account
        </h2>
        <p className="text-sm text-white/70">
          Your edge in the markets starts here
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-3">
        {/* Profile Image Section (Desktop) */}
        <div className="hidden md:flex justify-center mb-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-indigo-400 transition-colors cursor-pointer">
              {previewPic ? (
                <img
                  src={previewPic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="bx bx-camera text-2xl text-white/40 group-hover:text-white/80 transition-colors" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setProfilePic(file);
                  setPreviewPic(URL.createObjectURL(file));
                }
              }}
            />
            {previewPic && (
              <button
                type="button"
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition"
                onClick={() => {
                  setProfilePic(null);
                  setPreviewPic(null);
                }}
              >
                <i className="bx bx-x text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Account Details */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Full Name
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="text"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40 h-6"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        {/* Identity & Verification */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Email
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 md:py-3 flex items-center justify-between transition-colors focus-within:border-blue-500/50">
            <input
              type="email"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40 h-6"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isVerified ? (
              <i className="bx bxs-check-circle text-green-400 text-xl" />
            ) : (
              validateEmail(email) && (
                <button
                  type="button"
                  onClick={() => initiateVerification(email)}
                  className="p-1 transition text-white/50 hover:text-white/90 flex items-center justify-center"
                  title="Verify Admin TOTP"
                  disabled={otpLoading}
                >
                  <i className="bx bx-shield-quarter text-xl" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Security Section */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Password
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="password"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40 h-6"
              placeholder="Min 8 Characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {(error || verifyError) && (
          <p className="text-red-400 text-sm">{error || verifyError}</p>
        )}

        {/* Submission Control */}
        <button
          type="submit"
          disabled={isSigningUp}
          className={`w-full py-2.5 md:py-3 rounded-md text-white font-medium shadow-md transition flex items-center justify-center active:scale-[0.98]
                        ${!isSigningUp && isVerified
              ? "bg-[#1E1BFF] hover:bg-[#1720cc]"
              : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
        >
          {isSigningUp ? <Loader size="xxs" color="white" /> : "Sign Up"}
        </button>

        <p className="hidden md:block text-center text-white/60 text-sm pt-2">
          Already have an account?{" "}
          <button
            type="button"
            className="text-blue-400/80 font-bold hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
};

// =============================
// Exports
// =============================
export default SignUp;
