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

import React, { useContext, useEffect, useState } from "react";
import { FiBell, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import socket from "@/shared/utils/socket";

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

  const [prices, setPrices] = useState({
      "NSE_INDEX|Nifty 50": { ltp: 0, close: 0, status: 'neutral' },
      "NSE_INDEX|Nifty Bank": { ltp: 0, close: 0, status: 'neutral' }
  });

  useEffect(() => {
      // 1. Fetch initial prices (in case market is closed and websocket isn't streaming)
      const fetchInitialPrices = async () => {
          try {
              const res = await fetch(`http://localhost:5000/api/v1/upstox/market-quote?instruments=NSE_INDEX|Nifty%2050,NSE_INDEX|Nifty%20Bank`);
              const json = await res.json();
              if (json.data) {
                  setPrices(prev => {
                      const newPrices = { ...prev };
                      // Upstox API returns keys with a colon instead of a pipe!
                      if (json.data["NSE_INDEX:Nifty 50"]) {
                          const quote = json.data["NSE_INDEX:Nifty 50"];
                          const prevClose = quote.ohlc?.close || 0;
                          const ltp = quote.last_price;
                          newPrices["NSE_INDEX|Nifty 50"] = { 
                              ltp: ltp, 
                              close: prevClose,
                              status: ltp > prevClose ? 'up' : ltp < prevClose ? 'down' : 'neutral' 
                          };
                      }
                      if (json.data["NSE_INDEX:Nifty Bank"]) {
                          const quote = json.data["NSE_INDEX:Nifty Bank"];
                          const prevClose = quote.ohlc?.close || 0;
                          const ltp = quote.last_price;
                          newPrices["NSE_INDEX|Nifty Bank"] = { 
                              ltp: ltp, 
                              close: prevClose,
                              status: ltp > prevClose ? 'up' : ltp < prevClose ? 'down' : 'neutral' 
                          };
                      }
                      return newPrices;
                  });
              }
          } catch (error) {
              console.error("Failed to fetch initial quotes:", error);
          }
      };
      fetchInitialPrices();

      // 2. Listen to real-time socket updates
      const handleUpdate = ({ instrumentKey, data }) => {
          setPrices(prev => {
              if (instrumentKey !== "NSE_INDEX|Nifty 50" && instrumentKey !== "NSE_INDEX|Nifty Bank") {
                  return prev;
              }

              const newLtp = data.ltp;
              const prevClose = prev[instrumentKey]?.close || 0;
              
              if (prev[instrumentKey]?.ltp === newLtp) return prev;

              return {
                  ...prev,
                  [instrumentKey]: { 
                      ...prev[instrumentKey], 
                      ltp: newLtp, 
                      status: newLtp > prevClose ? 'up' : newLtp < prevClose ? 'down' : 'neutral'
                  }
              };
          });
      };

      socket.on("market:update", handleUpdate);
      return () => socket.off("market:update", handleUpdate);
  }, []);

  const niftyStatus = prices["NSE_INDEX|Nifty 50"].status;
  const niftyColor = niftyStatus === 'up' ? 'text-emerald-400' : niftyStatus === 'down' ? 'text-rose-400' : 'text-text-tertiary';

  const bankNiftyStatus = prices["NSE_INDEX|Nifty Bank"].status;
  const bankNiftyColor = bankNiftyStatus === 'up' ? 'text-emerald-400' : bankNiftyStatus === 'down' ? 'text-rose-400' : 'text-text-tertiary';

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

      {/* LEFT CONTENT — MARKET DATA */}
      <div className="flex items-center gap-6 px-4">
        <div className="flex flex-col text-xs leading-tight min-w-[70px]">
          <span className="text-text-secondary">NIFTY 50</span>
          <span className={`font-semibold transition-colors duration-300 ${niftyColor}`}>
            {prices["NSE_INDEX|Nifty 50"].ltp > 0 ? "₹" + prices["NSE_INDEX|Nifty 50"].ltp.toFixed(2) : "—"}
          </span>
        </div>

        <div className="flex flex-col text-xs leading-tight min-w-[80px]">
          <span className="text-text-secondary">BANK NIFTY</span>
          <span className={`font-semibold transition-colors duration-300 ${bankNiftyColor}`}>
            {prices["NSE_INDEX|Nifty Bank"].ltp > 0 ? "₹" + prices["NSE_INDEX|Nifty Bank"].ltp.toFixed(2) : "—"}
          </span>
        </div>

        <div className="flex flex-col text-xs leading-tight ml-2">
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
        {/* Desktop: Theme-aware Praxis written logo */}
        <img
          src={theme === 'light' ? praxisBgless1 : praxisBgless2}
          alt="Praxis"
          className="h-16 object-contain scale-[1.3]"
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
