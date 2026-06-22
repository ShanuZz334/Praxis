/**
 * @file AuthLayout.jsx
 * @purpose Specialized layout wrapper for authentication pages (Login/Signup).
 * @responsibilities
 * - Renders the 3D AuthBackground.
 * - Manages the split-screen layout (Visuals vs Form).
 * - Handles security verification UI (TOTP overlay) via VerificationContext.
 * - Provides quick links (Socials, Tips) within the visual area.
 * @key_exports
 * - AuthLayout (Default)
 * @dependencies
 * - VerificationContext (Security state)
 * - AuthBackground, GlitchText, TextType (Visuals)
 * - react-router-dom
 * @lifecycle
 * - Wraps Login and SignUp pages in AppRoutes.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VerificationContext } from "@/shared/context/VerificationContextInstance";
import { UserContext } from "@/shared/context/UserContext";

import AuthBackground from "@/features/auth/components/AuthBackground";
import GlitchText from "@/shared/components/backgrounds/GlitchText";
import TextType from "@/shared/components/backgrounds/TextType";

import stockTips from "@/shared/constants/stockTips";
import DemoModeModal from "@/shared/components/modals/DemoModeModal";

// =============================
// Component
// =============================

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isVerifying, verifyCredentials, loading, error, resetVerification, email } = useContext(VerificationContext);
  const { updateUser } = useContext(UserContext);

  const [totp, setTotp] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleDemoConfirm = () => {
    setShowDemoModal(false);
    updateUser({
      _id: "demo_user_id_123",
      fullName: "Demo User",
      email: "demo@stocky.app",
      profileImage: "https://ui-avatars.com/api/?name=Demo+User&background=random",
      role: "user",
      isDemo: true
    }, "demo-token-123456");
    navigate("/dashboard/home");
  };

  const isSignup = location.pathname === "/signup";
  const isLogin = location.pathname === "/login";

  return (
    <div className="fixed inset-0 w-full bg-black overflow-hidden sm:overflow-auto md:overflow-hidden">
      {/* 🌈 BACKGROUND */}
      <AuthBackground />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex items-center justify-center overflow-y-auto md:overflow-visible">
        <div className="w-[95%] md:w-[92%] max-w-[1150px] mx-auto rounded-3xl md:rounded-4xl overflow-hidden shadow-3xl backdrop-blur border border-white/30 my-4 md:my-0">
          <div className="flex flex-col md:flex-row w-full">

            {/* LEFT SIDE */}
            <div
              className={`md:w-1/2 p-6 md:p-10 transition-all duration-500
              bg-linear-to-br from-white/10 to-white/10.5
              ${isLogin ? "rounded-b-[60px] md:rounded-r-[180px] md:rounded-bl-none" : "rounded-b-[60px] md:rounded-r-[90px] md:rounded-bl-none"}`}
            >
              <div className="flex flex-col items-center justify-center h-full text-center py-6 md:py-0">
                {isVerifying && isSignup ? (
                  <div className="w-full max-w-[320px] space-y-4 animate-in fade-in slide-in-from-left duration-500">
                    <div className="text-center">
                      <div className="mx-auto w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <i className="bx bx-shield-quarter text-xl text-white/80"></i>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Security Check</h3>
                      <p className="text-white/60 text-xs hidden md:block">
                        Please enter the verification codes.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="group">
                        <label className="text-[10px] font-medium text-indigo-300/80 block mb-1 ml-1 uppercase tracking-wider">Admin TOTP</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center text-lg tracking-[0.5em] outline-none group-hover:border-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900/80 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all placeholder:text-white/10 font-mono"
                            value={totp}
                            onChange={(e) => setTotp(e.target.value.replace(/[^0-9]/g, ''))}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {totp.length === 6 && <i className="bx bxs-check-circle text-green-500 text-base animate-in zoom-in spin-in-90 duration-300"></i>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <i className="bx bx-error-circle text-red-400 mt-0.5 text-xs"></i>
                        <p className="text-red-300 text-[10px] leading-4">{error}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={() => verifyCredentials(email, totp)}
                        className="w-full py-3 rounded-xl bg-[#1E1BFF] hover:bg-[#1720cc] text-white font-bold shadow-lg shadow-[#1E1BFF]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
                        disabled={loading || totp.length !== 6}
                        id="verify-button-left"
                      >
                        {loading ? (
                          <>
                            <i className="bx bx-loader-alt animate-spin text-lg"></i>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Unlock</span>
                            <i className="bx bx-right-arrow-alt text-lg"></i>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between px-1">
                        <button
                          onClick={resetVerification}
                          className="text-white/40 text-[10px] hover:text-white transition flex items-center gap-1 group"
                        >
                          <i className="bx bx-arrow-back group-hover:-translate-x-0.5 transition-transform"></i>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <GlitchText
                      speed={0.6}
                      enableShadows
                      enableOnHover
                      className="text-[3rem] md:text-[clamp(5rem,10vw,12rem)] font-extrabold text-[#1E1BFF]"
                    >
                      Stocky
                    </GlitchText>

                    <div className="h-[22px] overflow-hidden text-white/80 text-sm tracking-wide">
                      <TextType
                        text={stockTips}
                        typingSpeed={90}
                        pauseDuration={3800}
                        showCursor
                        cursorCharacter="|"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className={`md:w-1/2 p-6 md:p-10 flex-col items-center justify-center ${isVerifying ? "hidden md:flex" : "flex"}`}>

              {/* Login / Signup buttons */}
              <div className="flex items-center justify-end w-full mb-6 gap-3">
                {isSignup && (
                  <button
                    onClick={() => setShowDemoModal(true)}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all bg-[#1E1BFF] text-white hover:bg-[#1720cc] shadow-[0_0_15px_rgba(30,27,255,0.4)]"
                  >
                    Demo
                  </button>
                )}

                <button
                  onClick={() => navigate("/login")}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all
                    ${isLogin
                      ? "bg-gray-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all
                    ${!isLogin
                      ? "bg-gray-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Auth Form */}
              <div className="w-full max-w-[335px] md:max-w-[400px] p-6 md:p-8">
                {children}
              </div>

              {/* SOCIAL ICONS */}
              <div className="mt-6 flex justify-center gap-5">
                {[
                  {
                    icon: "instagram",
                    link: "https://www.instagram.com/stock._y",
                  },
                  {
                    icon: "x",
                    link: "https://x.com/@StockyProp",
                  },
                  {
                    icon: "telegram",
                    link: "https://t.me/+bzO4XSrXfgsyYTY1",
                  },
                  {
                    icon: "youtube",
                    link: "https://www.youtube.com/@Stocky-s6v",
                  },
                ].map(({ icon, link }) => (
                  <a
                    key={icon}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      w-10 h-10
                      bg-white/10
                      rounded-full
                      flex items-center justify-center
                      text-white/80
                      backdrop-blur-md
                      hover:bg-white/20
                      hover:scale-110
                      transition
                    "
                  >
                    {icon === "x" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M18.244 2H21.552L14.168 10.42L22.85 22H16.02L10.655 14.965L4.57 22H1.26L9.16 13.01L0.85 2H7.85L12.73 8.53L18.244 2ZM17.13 20.13H18.96L6.86 3.78H4.9L17.13 20.13Z" />
                      </svg>
                    ) : (
                      <i className={`bx bxl-${icon} text-xl`} />
                    )}
                  </a>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      <DemoModeModal 
        isOpen={showDemoModal} 
        onConfirm={handleDemoConfirm} 
      />
    </div>
  );
};

export default AuthLayout;
