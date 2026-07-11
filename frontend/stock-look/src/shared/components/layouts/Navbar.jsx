/**
 * @file Navbar.jsx
 * @purpose Main desktop top navigation bar.
 * @responsibilities
 * - Displays market indices (NIFTY/SENSEX) and account balance summaries (Empty State).
 * - Provides global actions: Search, Notifications, Settings, Theme Toggle.
 * - Links to external brokers (NSE, Zerodha).
 * - Manages sidebar toggle state.
 * @key_exports
 * - Navbar (Default)
 * @dependencies
 * - UserContext, ThemeContext
 * - ThemeToggle
 * @lifecycle
 * - Rendered by DashboardLayout on desktop viewports.
 */

import React, { useContext } from "react";
import { FiBell, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/shared/context/ThemeContext";

import nseLogo from "@/assets/images/nse.png";
import upstoxLogo from "@/assets/images/Upstox.png";
import logo1Bgless from "@/assets/icons/praxis logo 1 bgless.png"; // light mode P icon (black)
import logo2Bgless from "@/assets/icons/praxis logo 2 bgless.png"; // dark mode P icon (blue)
import praxisBgless1 from "@/assets/icons/praxis bgless 1.png"; // light mode Praxis text (black)
import praxisBgless2 from "@/assets/icons/praxis bgless 2.png"; // dark mode Praxis text (blue)
import ThemeToggle from "@/shared/components/ui/ThemeToggle";

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <header
      className="
        fixed top-0 left-0 w-full
        h-[73px]
        flex items-center
        z-50
        bg-transparent
      "
    >
      {/* LEFT COLUMN — SIDEBAR TOGGLE */}
      <div className="w-16 h-full flex items-center justify-center">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="
            w-14 h-14
            flex items-center justify-center
            rounded-xl
            transition-all
            hover:opacity-80 active:scale-95
          "
        >
          <img
            src={theme === 'light' ? logo1Bgless : logo2Bgless}
            alt="Menu"
            className="w-[50px] h-[50px] transition-transform hover:scale-110"
          />
        </button>
      </div>

      {/* LEFT CONTENT — MARKET DATA (CLEAN STATE) */}
      <div className="flex items-center gap-6 px-4">
        <div className="hidden sm:flex flex-col text-xs leading-tight">
          <span className="text-text-secondary">NIFTY 50</span>
          <span className="text-text-tertiary font-semibold">
            —
          </span>
        </div>

        <div className="hidden md:flex flex-col text-xs leading-tight">
          <span className="text-text-secondary">BANK NIFTY</span>
          <span className="text-text-tertiary font-semibold">
            —
          </span>
        </div>

        <div className="hidden lg:flex flex-col text-xs leading-tight">
          <span className="text-text-secondary">
            Balance: —
          </span>
          <span className="text-text-tertiary font-semibold">
            Today: —
          </span>
        </div>
      </div>

      {/* CENTER — PRAXIS LOGO */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        {/* Mobile: Blue Text */}
        <span className="md:hidden text-2xl font-bold text-blue-500 tracking-tight">
          Praxis
        </span>
        {/* Desktop: Theme-aware Praxis written logo */}
        <img
          src={theme === 'light' ? praxisBgless1 : praxisBgless2}
          alt="Praxis"
          className="hidden md:block h-16 object-contain scale-[1.3]"
        />
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-6 pr-5">

        {/* NSE */}
        <button
          className="text-text-tertiary transition-colors"
          onClick={() => window.open("https://www.nseindia.com", "_blank")}
        >
          <img
            src={nseLogo}
            alt="NSE"
            className="w-6 h-6 object-contain transition-transform hover:scale-110"
          />
        </button>

        {/* Upstox */}
        <button
          className="text-text-tertiary transition-colors"
          onClick={() => window.open("https://pro.upstox.com", "_blank")}
        >
          <img
            src={upstoxLogo}
            alt="Upstox"
            className="w-9 h-9 object-contain transition-transform hover:scale-110"
          />
        </button>

        <div className="w-5" />

        {/* Animated Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={() => navigate("/dashboard/messages")}
          className="
            text-text-tertiary
            transition-colors
            hover:text-accent-primary
          "
        >
          <FiBell className="text-xl transition-transform hover:scale-110" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="
            text-text-tertiary
            transition-colors
            hover:text-accent-primary
          "
        >
          <FiSettings className="text-xl transition-transform hover:scale-110" />
        </button>

      </div>
    </header>
  );
};

export default Navbar;
