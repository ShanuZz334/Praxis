import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthBackground from "../ui/backgrounds/AuthBackground";
import GlitchText from "../ui/backgrounds/GlitchText";
import TextType from "../ui/backgrounds/TextType";
import stockTips from "../../constants/stockTips";

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === "/login";

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">

      {/* 🌈 BACKGROUND */}
      <AuthBackground />

      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">

        <div className="w-[92%] max-w-[1150px] mx-auto rounded-4xl overflow-hidden shadow-3xl backdrop-blur border border-white/30">
          <div className="flex flex-col md:flex-row w-full">

            {/* LEFT SIDE */}
            <div
              className={`md:w-1/2 p-10 transition-all duration-500 bg-linear-to-br from-white/10 to-white/10.5
              ${isLogin ? "rounded-r-[180px]" : "rounded-r-[90px]"}`}
            >
              <div className="flex flex-col items-center justify-center h-full text-center">

                {/* 🔥 GLITCH TITLE */}
                <GlitchText
                  speed={0.6}
                  enableShadows
                  enableOnHover={true}
                  className="text-[clamp(5rem,10vw,12rem)] font-extrabold text-[#4828ff]"
                >
                  Stocky
                </GlitchText>

                {/* 🧠 STOCK TIPS */}
                <div className="h-[22px] overflow-hidden text-white/80 text-sm tracking-wide">
                  <TextType
                    text={stockTips}
                    typingSpeed={90}
                    pauseDuration={3800}
                    showCursor={true}
                    cursorCharacter="|"
                  />
                </div>

              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="md:w-1/2 p-10 flex flex-col items-center justify-center">

              <div className="flex items-center justify-end w-full mb-6 gap-3">
                <button
                  className={`px-5 py-2 rounded-full text-sm transition-all
                  ${isLogin ? "bg-white text-slate-900" : "bg-slate-700/40 text-white/80"}`}
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>

                <button
                  className={`px-5 py-2 rounded-full text-sm transition-all
                  ${!isLogin ? "bg-white text-slate-900" : "bg-slate-700/40 text-white/80"}`}
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </button>
              </div>

              <div className="w-full max-w-[400px] p-8">
                {children}
              </div>

              <div className="mt-6 flex justify-center gap-5">
                {["linkedin", "facebook", "github", "instagram"].map((icon) => (
                  <a
                    key={icon}
                    href="#"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center
                      text-white/80 backdrop-blur-md hover:bg-white/20 transition"
                  >
                    <i className={`bx bxl-${icon} text-xl`} />
                  </a>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
