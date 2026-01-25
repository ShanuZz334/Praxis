import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import uploadImage from "@/shared/utils/uploadImage";
import { validateEmail } from "@/shared/utils/helper";
import { VerificationContext } from "@/shared/context/VerificationContext";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const { updateUser } = useContext(UserContext);
  const { isVerified, requestOTP, error: verifyError, signupToken, resetVerification } = useContext(VerificationContext);
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
    if (!isVerified) return setError("Verification required.");
    if (!password) return setError("Enter password.");

    let profileImageUrl = "";

    try {
      // Upload profile image if provided
      if (profilePic) {
        const uploadRes = await uploadImage(profilePic, true);
        profileImageUrl = uploadRes?.imageUrl || "";
      }

      const res = await axiosInstance.post(
        API_PATHS.AUTH.REGISTER,
        {
          fullName,
          email,
          password,
          profileImage: profileImageUrl || undefined,
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


        {/* FULL NAME */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Full Name
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center">
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
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center justify-between">
            <input
              type="email"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={isVerified}
            />
            {isVerified ? (
              <i className="bx bxs-check-circle text-green-400 text-xl" />
            ) : (
              validateEmail(email) && (
                <button
                  type="button"
                  onClick={() => requestOTP(email)}
                  className="p-1 hover:bg-white/10 rounded-full transition text-indigo-300"
                  title="Verify Email"
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
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center">
            <input
              type="password"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              placeholder="Min 8 Characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {(error || verifyError) && (
          <p className="text-red-400 text-sm">{error || verifyError}</p>
        )}

        <button
          type="submit"
          disabled={!isVerified}
          className={`w-full py-3 rounded-md text-white font-medium shadow-md transition
            ${isVerified
              ? "bg-[#1E1BFF] hover:bg-[#1720cc]"
              : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
        >
          Sign Up
        </button>

        <p className="text-center text-white/60 text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-indigo-300 underline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
