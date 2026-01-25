import React from "react";
import { FiBell, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  niftySeries,
  bankNiftySeries,
  accountOverview,
} from "@/shared/utils/fakeFundData";

import nseLogo from "@/assets/images/nse.png";
import zerodhaLogo from "@/assets/images/zerodha.png";
import logo from "@/assets/images/logo1.png";
import logoBgless from "@/assets/icons/logo_bgless.png";

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();

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
      <div className="w-17 h-full flex items-center justify-center">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="
            w-25 h-25
            flex items-center justify-center
            rounded-xl
            transition-all
            hover:opacity-80 active:scale-95
          "
        >
          <img
            src={logoBgless}
            alt="Menu"
            className="w-17 h-17 transition-transform hover:scale-110"
          />
        </button>
      </div>

      {/* LEFT CONTENT — MARKET DATA */}
      <div className="flex items-center gap-6 px-4">
        <div className="hidden sm:flex flex-col text-xs leading-tight">
          <span className="text-(--text-muted)">NIFTY 50</span>
          <span className="text-(--success) font-semibold">
            ₹{niftySeries.latest} +{niftySeries.change}%
          </span>
        </div>

        <div className="hidden md:flex flex-col text-xs leading-tight">
          <span className="text-(--text-muted)">BANK NIFTY</span>
          <span className="text-(--danger) font-semibold">
            ₹{bankNiftySeries.latest} {bankNiftySeries.change}%
          </span>
        </div>

        <div className="hidden lg:flex flex-col text-xs leading-tight">
          <span className="text-(--text-muted)">
            Balance: ₹{accountOverview.closing_balance.toLocaleString()}
          </span>
          <span className="text-(--success) font-semibold">
            Today +₹{accountOverview.profitToday}
          </span>
        </div>
      </div>

      {/* CENTER — STOCKY LOGO */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        {/* Mobile: Blue Text */}
        <span className="md:hidden text-2xl font-bold text-blue-500 tracking-tight">
          Stocky
        </span>
        {/* Desktop: Image Logo */}
        <img
          src={logo}
          alt="Stocky"
          className="hidden md:block h-34"
        />
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-6 pr-5">

        {/* NSE */}
        <button
          className="w-8 h-8 rounded-md transition navbar-icon"
          onClick={() => window.open("https://www.nseindia.com", "_blank")}
        >
          <img src={nseLogo} alt="NSE" className="w-8 h-8 rounded-md" />
        </button>

        {/* Zerodha */}
        <button
          className="w-8 h-8 rounded-md transition navbar-icon"
          onClick={() => window.open("https://kite.zerodha.com", "_blank")}
        >
          <img
            src={zerodhaLogo}
            alt="Zerodha"
            className="w-8 h-8 rounded-md"
          />
        </button>

        <div className="w-5" />

        {/* Notifications */}
        <button
          onClick={() => navigate("/dashboard/messages")}
          className="
            text-(--text-muted)
            transition-colors
            hover:text-(--hover-primary)
          "
        >
          <FiBell className="text-xl transition-transform hover:scale-110" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="
            text-(--text-muted)
            transition-colors
            hover:text-(--hover-primary)
          "
        >
          <FiSettings className="text-xl transition-transform hover:scale-110" />
        </button>

      </div>
    </header>
  );
};

export default Navbar;
