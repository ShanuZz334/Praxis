import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import uploadImage from "@/shared/utils/uploadImage";
import { validateEmail } from "@/shared/utils/helper";
import { VerificationContext } from "@/shared/context/VerificationContextInstance";

import Loader from "@/shared/components/ui/Loader";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { updateUser } = useContext(UserContext);
  const { isVerified, initiateVerification, error: verifyError, signupToken, resetVerification, loading: otpLoading } = useContext(VerificationContext);
  const navigate = useNavigate();

  // Reset verification state when entering the page
  useEffect(() => {
    resetVerification();
  }, [resetVerification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName) return setError("Enter full name.");
    if (!validateEmail(email)) return setError("Invalid email.");
    if (!password) return setError("Enter password.");
    if (!isVerified) return setError("Please verify with Admin TOTP first.");

    setIsSigningUp(true);
    let profileImage = "";

    try {
      // Upload profile image if provided
      if (profilePic) {
        const uploadRes = await uploadImage(profilePic, true);
        profileImage = uploadRes?.imageUrl || "";
      }

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

      // Single source of truth
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

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-semibold text-white mb-2">
          Create Account
        </h2>
        <p className="text-sm text-white/70">
          Your edge in the markets starts here
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* PROFILE IMAGE (Desktop Only) */}
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

        {/* FULL NAME */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Full Name
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-3 flex items-center">
            <input
              type="text"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Email
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-3 flex items-center justify-between">
            <input
              type="email"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40"
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
                  className="p-1 hover:bg-white/10 rounded-full transition text-[#1E1BFF] flex items-center justify-center shadow-lg shadow-[#1E1BFF]/20"
                  title="Verify Admin TOTP"
                  disabled={otpLoading}
                >
                  <i className="bx bx-shield-quarter text-xl" />
                </button>
              )
            )}
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Password
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-3 flex items-center">
            <input
              type="password"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              placeholder="Min 8 Characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {
          (error || verifyError) && (
            <p className="text-red-400 text-sm">{error || verifyError}</p>
          )
        }

        <button
          type="submit"
          disabled={isSigningUp}
          className={`w-full py-3 rounded-md text-white font-medium shadow-md transition flex items-center justify-center
            ${!isSigningUp && isVerified
              ? "bg-[#1E1BFF] hover:bg-[#1720cc]"
              : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
        >
          {isSigningUp ? <Loader size="xxs" color="white" /> : "Sign Up"}
        </button>

        <p className="text-center text-white/60 text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-[#1E1BFF] font-bold hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </form >
    </div >
  );
};

export default SignUp;
