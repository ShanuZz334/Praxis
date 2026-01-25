import React, { useContext } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { FiBell, FiSettings } from "react-icons/fi";
import { UserContext } from "../../context/userContext";

import {
  niftySeries,
  bankNiftySeries,
  accountOverview,
} from "../../utils/fakeFundData";

import TextType from "../ui/backgrounds/TextType";
import marketNews from "../../constants/marketNews";

import nseLogo from "../../assets/images/nse.png";
import zerodhaLogo from "../../assets/images/zerodha.png";
import logo from "../../assets/images/logo1.png";

const Navbar = ({ openSideMenu, setOpenSideMenu }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="w-full px-5 pt-5 sticky top-0 z-30">
      <div
        className="
          flex items-center justify-between
          px-7 py-4
          bg-white/10 backdrop-blur-xl
          border border-white/20
          shadow-[0_8px_25px_rgba(0,0,0,0.3)]
          rounded-2xl
          text-white
        "
      >
        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-6">
          {/* Sidebar Toggle */}
          {!openSideMenu ? (
            <button
              onClick={() => setOpenSideMenu(true)}
              className="text-white/80 hover:text-white transition"
              aria-label="Open sidebar"
            >
              <HiOutlineMenu className="text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => setOpenSideMenu(false)}
              className="text-white/80 hover:text-white transition"
              aria-label="Close sidebar"
            >
              <HiOutlineX className="text-2xl" />
            </button>
          )}

          {/* NIFTY */}
          <div className="hidden md:flex flex-col text-xs leading-tight">
            <span className="text-white/60">{niftySeries.symbol}</span>
            <span
              className={`font-semibold ${
                niftySeries.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              ₹{niftySeries.latest}
              <span className="ml-1 text-[11px]">
                {niftySeries.change > 0 ? "+" : ""}
                {niftySeries.change}%
              </span>
            </span>
          </div>

          {/* BANK NIFTY */}
          <div className="hidden md:flex flex-col text-xs leading-tight">
            <span className="text-white/60">{bankNiftySeries.symbol}</span>
            <span
              className={`font-semibold ${
                bankNiftySeries.change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              ₹{bankNiftySeries.latest}
              <span className="ml-1 text-[11px]">
                {bankNiftySeries.change > 0 ? "+" : ""}
                {bankNiftySeries.change}%
              </span>
            </span>
          </div>

          {/* ACCOUNT */}
          <div className="hidden md:flex flex-col text-xs text-right">
            <span className="text-white/60">
              Balance: ₹{accountOverview.closing_balance.toLocaleString()}
            </span>
            <span
              className={`font-semibold ${
                accountOverview.profitToday >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              Today {accountOverview.profitToday >= 0 ? "+" : ""}
              ₹{accountOverview.profitToday.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ================= CENTER ================= */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <img
            src={logo}
            alt="Stocky"
            className="h-33 w-auto object-contain"
          />
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-5">
          {/* MARKET NEWS */}
          <div
            className="
              hidden lg:flex
              items-center
              max-w-[300px]
              h-[38px]
              overflow-hidden
              mr-6
            "
          >
            <TextType
              text={marketNews}
              typingSpeed={100}
              deletingSpeed={65}
              pauseDuration={4500}
              showCursor={true}
              cursorCharacter="|"
              className="
                text-xs
                text-white/60
                leading-5
                line-clamp-2
              "
            />
          </div>

          {/* NSE */}
          <button
            className="w-8 h-8 hover:scale-110 transition"
            onClick={() => window.open("https://www.nseindia.com", "_blank")}
          >
            <img src={nseLogo} alt="NSE" className="w-8 h-8 rounded-md" />
          </button>

          {/* Zerodha */}
          <button
            className="w-8 h-8 hover:scale-110 transition"
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
          <button className="hover:text-violet-400 transition">
            <FiBell className="text-xl" />
          </button>

          {/* Settings */}
          <button className="hover:text-violet-400 transition">
            <FiSettings className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
