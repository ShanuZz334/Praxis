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

import React, { useContext, useEffect, useState, useCallback } from "react";
import { FiBell, FiSettings, FiCrosshair } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { usePaiWidget } from "@/shared/context/PaiWidgetContext";
import { useNotificationStore } from "@/shared/context/NotificationContext";
import DetachableInstrumentSelector from "@/shared/components/controls/DetachableInstrumentSelector";
import CalculatorWidget from "@/shared/components/controls/CalculatorWidget";
import { Calculator, FlaskConical, BrainCircuit } from "lucide-react";
import { MdPointOfSale } from "react-icons/md";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { updateGlobalInsightCache } from "@/shared/components/ui/AiInsightSection";
import { toast } from "sonner";

import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import nseLogo from "@/assets/images/nse.png";
import upstoxLogo from "@/assets/images/Upstox.png";
import logo1Bgless from "@/assets/icons/praxis logo 1 bgless.png"; // light mode P icon (black)
import logo2Bgless from "@/assets/icons/praxis logo 2 bgless.png"; // dark mode P icon (blue)
import praxisBgless1 from "@/assets/icons/praxis bgless 1.png"; // light mode Praxis text (black)
import praxisBgless2 from "@/assets/icons/praxis bgless 2.png"; // dark mode Praxis text (blue)
import ThemeToggle from "@/shared/components/ui/ThemeToggle";
import { Unplug, Headset } from 'lucide-react';
import { upstoxService } from "@/shared/services/upstoxService";
import { useVoice } from "@/shared/context/VoiceContext";
import OrderTicket from "@/features/trading/ui/OrderTicket";

const ANALYSIS_PAGES = {
  '/dashboard/fundamental': { module: 'Fundamentals', pageId: 'fundamentals', label: 'Fundamental Intelligence' },
  '/dashboard/technical':   { module: 'Technical',    pageId: 'technical',    label: 'Technical Confluence' },
  '/dashboard/options':     { module: 'Options',      pageId: 'options',      label: 'Options Structure' },
  '/dashboard/events':      { module: 'Events',       pageId: 'events',       label: 'Corporate Events' },
  '/dashboard/foreign':     { module: 'Global',       pageId: 'foreign',      label: 'Global Macro Cues' },
};

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardPage = location.pathname === '/dashboard/home' || location.pathname === '/dashboard';
  const currentAnalysisPage = Object.entries(ANALYSIS_PAGES).find(([path]) => location.pathname.startsWith(path));
  const isAnalysisPage = Boolean(currentAnalysisPage);
  const { theme, useOrbNav } = useTheme();
  const { isStandbyMode, toggleStandby } = useVoice();
  const { unreadCount } = useNotificationStore();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [upstoxConnected, setUpstoxConnected] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkUpstox = async () => {
      const status = await upstoxService.checkStatus();
      if (isMounted) {
          const currentMode = status.mode || 'live';
          const isConnected = currentMode === 'live' ? status.liveConnected : status.sandboxConnected;
          setUpstoxConnected(isConnected);
      }
    };
    checkUpstox();
    const interval = setInterval(checkUpstox, 300000); // Check every 5 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const { livePrices: prices, selectedInstrument, filteredInstruments, globalOrderTicket, setGlobalOrderTicket } = useDashboardContext();
  const { getPageStructuredData, getPageSnapshot } = useDataRegistry();
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [recentlySyncedModule, setRecentlySyncedModule] = useState(null);

  const handleDirectTelemetrySync = useCallback(() => {
    if (!currentAnalysisPage) return;
    const [, pageInfo] = currentAnalysisPage;
    const { module, pageId, label } = pageInfo;

    setIsSyncingTelemetry(true);

    try {
      const isIndex = selectedInstrument?.startsWith('NSE_INDEX|');
      let targetId = 'praxis_composite_header';
      if (pageId === 'fundamentals') targetId = isIndex ? 'fundamentals_index_header' : 'fundamentals_company_header';
      else if (pageId === 'technical') targetId = isIndex ? 'technical_index_header' : 'technical_company_header';
      else if (pageId === 'options') targetId = 'options_header';
      else if (pageId === 'events') targetId = 'events_header';
      else if (pageId === 'foreign') targetId = 'foreign_header';

      // Symbol resolution
      let cleanSymbol = selectedInstrument?.split('|').pop() || selectedInstrument || 'NIFTY';
      const allInst = [...FO_INDICES, ...FO_EQUITIES];
      const match = allInst.find(i => i.value === selectedInstrument);
      if (match) cleanSymbol = match.label;

      let symbolSuffix = cleanSymbol;
      if (pageId === 'foreign') symbolSuffix = 'GLOBAL';
      if (pageId === 'events') symbolSuffix = 'EVENTS';

      const cacheKey = `${targetId}_${symbolSuffix}`;

      // Pull structured page data from DataRegistry
      const structured = getPageStructuredData ? getPageStructuredData(pageId) : null;
      const snapshot = getPageSnapshot ? getPageSnapshot(pageId) : {};

      const compScore = structured?.compositeScore ?? 75;
      const regime = compScore >= 65 ? 'Bullish' : compScore <= 45 ? 'Bearish' : 'Neutral';

      // Build compact, institutional telemetry narrative for Future Vision
      const cardSummaries = [];
      if (structured?.sections) {
        structured.sections.forEach(sec => {
          (sec.cards || []).forEach(c => {
            if (c.value != null || c.signal != null) {
              const valStr = typeof c.value === 'number' ? c.value.toFixed(2) : (c.value ?? '');
              cardSummaries.push(`${c.displayName || c.id}: ${valStr}${c.signal ? ` (${c.signal})` : ''}`);
            }
          });
        });
      }

      // If no cards registered yet, fallback to snapshot entries
      if (cardSummaries.length === 0 && snapshot) {
        Object.entries(snapshot).forEach(([id, snap]) => {
          if (snap.value != null || snap.score != null) {
            cardSummaries.push(`${snap.displayName || id}: ${snap.value ?? ''}${snap.score != null ? ` (Score: ${snap.score})` : ''}`);
          }
        });
      }

      const telemetrySummary = `[INSTITUTIONAL TELEMETRY SYNTHESIS: ${module.toUpperCase()}] Instrument: ${symbolSuffix} | Composite Score: ${compScore}/100 (${regime}). Metrics: ${cardSummaries.slice(0, 15).join(' | ') || 'Live metrics synchronized.'}`;

      // Commit directly to global insight cache (both memory & localStorage)
      updateGlobalInsightCache(cacheKey, {
        score: compScore,
        symbol: symbolSuffix,
        regime,
        insightText: telemetrySummary,
        timestamp: Date.now(),
        isDirectTelemetrySync: true
      });

      // Broadcast event so any mounted page header AI insight updates immediately without waiting
      window.dispatchEvent(new CustomEvent('praxis:fv:telemetry-synced', {
        detail: {
          cacheKey,
          module,
          targetId,
          symbol: symbolSuffix,
          score: compScore,
          regime,
          text: telemetrySummary
        }
      }));

      // Visual feedback
      setRecentlySyncedModule(module);
      setTimeout(() => setRecentlySyncedModule(null), 3000);

      toast.success(`${label} Synced to Future Vision`, {
        description: `Verified telemetry for ${symbolSuffix} committed directly to Future Vision context.`,
        duration: 3500
      });
    } catch (err) {
      console.error('[Navbar] Telemetry direct sync error:', err);
      toast.error('Failed to sync telemetry', { description: err.message });
    } finally {
      setIsSyncingTelemetry(false);
    }
  }, [currentAnalysisPage, selectedInstrument, getPageStructuredData, getPageSnapshot]);

  const getResolvedPrice = (instrumentKey) => {
    let priceData = prices?.[instrumentKey];
    if (!priceData || !priceData.ltp) {
      try {
        const cache = JSON.parse(localStorage.getItem('praxis_quotes_cache') || '{}');
        if (cache[instrumentKey] && cache[instrumentKey].data) {
          const q = cache[instrumentKey].data;
          priceData = {
            ltp: q.last_price || 0,
            netChange: q.net_change || 0,
            pctChange: (q.net_change && q.last_price && (q.last_price - q.net_change) !== 0) 
              ? (q.net_change / (q.last_price - q.net_change)) * 100 
              : 0,
            status: q.net_change > 0 ? 'up' : q.net_change < 0 ? 'down' : 'neutral'
          };
        }
      } catch (e) {
        // ignore cache errors
      }
    }
    return priceData;
  };

  const niftyPrice = getResolvedPrice("NSE_INDEX|Nifty 50");
  const niftyStatus = niftyPrice?.status || 'neutral';
  const niftyColor = niftyStatus === 'up' ? 'text-emerald-400' : niftyStatus === 'down' ? 'text-rose-400' : 'text-text-tertiary';

  const bankNiftyPrice = getResolvedPrice("NSE_INDEX|Nifty Bank");
  const bankNiftyStatus = bankNiftyPrice?.status || 'neutral';
  const bankNiftyColor = bankNiftyStatus === 'up' ? 'text-emerald-400' : bankNiftyStatus === 'down' ? 'text-rose-400' : 'text-text-tertiary';

  // Selected instrument — show after BANK NIFTY if it's not one of the two pinned indices
  const PINNED_KEYS = new Set(["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"]);
  const showSelected = selectedInstrument && !PINNED_KEYS.has(selectedInstrument);
  const selectedPrice = showSelected ? getResolvedPrice(selectedInstrument) : null;
  const selectedStatus = selectedPrice?.status || 'neutral';
  const selectedColor = selectedStatus === 'up' ? 'text-emerald-400' : selectedStatus === 'down' ? 'text-rose-400' : 'text-text-tertiary';
  // Find human-readable label from the context instruments array
  const foundInstrument = filteredInstruments?.find(i => i.value === selectedInstrument);
  const selectedLabel = foundInstrument
    ? foundInstrument.label.toUpperCase()
    : selectedInstrument
      ? selectedInstrument.split('|').pop().toUpperCase()
      : '';

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
        {!useOrbNav && (
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
        )}
      </div>

      {/* LEFT CONTENT — MARKET DATA */}
      <div className="flex items-center gap-6 px-4 tabular-nums">
        <div className="flex flex-col text-xs leading-tight min-w-[90px]">
          <span className="text-text-secondary tracking-wide">NIFTY 50</span>
          <div className="flex flex-col mt-0.5">
            <span className={`font-semibold transition-colors duration-300 ${niftyColor}`}>
              {niftyPrice?.ltp > 0 ? "₹" + niftyPrice.ltp.toFixed(2) : "—"}
            </span>
            {niftyPrice?.ltp > 0 && (
              <span className={`text-[9px] ${niftyColor} opacity-90 tracking-tight`}>
                {niftyPrice.netChange > 0 ? '+' : ''}{niftyPrice.netChange.toFixed(2)} ({niftyPrice.pctChange.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col text-xs leading-tight min-w-[95px]">
          <span className="text-text-secondary tracking-wide">BANK NIFTY</span>
          <div className="flex flex-col mt-0.5">
            <span className={`font-semibold transition-colors duration-300 ${bankNiftyColor}`}>
              {bankNiftyPrice?.ltp > 0 ? "₹" + bankNiftyPrice.ltp.toFixed(2) : "—"}
            </span>
            {bankNiftyPrice?.ltp > 0 && (
              <span className={`text-[9px] ${bankNiftyColor} opacity-90 tracking-tight`}>
                {bankNiftyPrice.netChange > 0 ? '+' : ''}{bankNiftyPrice.netChange.toFixed(2)} ({bankNiftyPrice.pctChange.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        {/* SELECTED INSTRUMENT TICKER — only shown when not a pinned index */}
        {showSelected && (
          <>
            {/* Divider */}
            <div className="h-6 w-px bg-border-subtle opacity-50" />
            <div className="flex flex-col text-xs leading-tight min-w-[100px] animate-in fade-in duration-300">
              <div className="flex items-center gap-1">
                <span className="text-text-tertiary tracking-wide text-[10px] font-medium truncate max-w-[120px]">{selectedLabel}</span>
              </div>
              <div className="flex flex-col mt-0.5">
                <span className={`font-semibold transition-colors duration-300 ${selectedColor}`}>
                  {selectedPrice?.ltp > 0 ? "₹" + selectedPrice.ltp.toFixed(2) : "—"}
                </span>
                {selectedPrice?.ltp > 0 && (
                  <span className={`text-[9px] ${selectedColor} opacity-90 tracking-tight`}>
                    {selectedPrice.netChange > 0 ? '+' : ''}{selectedPrice.netChange?.toFixed(2)} ({selectedPrice.pctChange?.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
          </>
        )}

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
          className="h-16 object-contain scale-[1.3] cursor-pointer"
          onClick={() => navigate('/dashboard/home')}
        />
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-6 pr-5">

        {/* API Status Indicator */}
        {!upstoxConnected && (
            <button 
                onClick={() => navigate('/dashboard/admin')}
                className="text-rose-500 hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer p-1.5 rounded-md hover:bg-rose-500/10"
                title="Upstox API Disconnected. Go to Data Center to re-authenticate."
            >
                <Unplug size={20} className="animate-pulse" />
            </button>
        )}

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

        {/* Global Standby Mode Toggle */}
        <button
          onClick={() => toggleStandby(!isStandbyMode)}
          className={`transition-colors rounded-full hover:bg-background-elevated ${isStandbyMode ? 'text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'text-text-tertiary hover:text-text-primary'}`}
          title="Global 'Hey Pai' Standby Mode"
        >
          <Headset size={18} className={`text-lg transition-transform hover:scale-110 ${isStandbyMode ? 'animate-pulse' : ''}`} />
        </button>

        {/* Global Controls Widget Toggle */}
        <button
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className={`
            transition-colors
            hover:text-accent-primary
            ${isWidgetOpen ? 'text-blue-500' : 'text-text-tertiary'}
          `}
          title="Global Controls"
        >
          <FiCrosshair className="text-lg transition-transform hover:scale-110" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/dashboard/messages")}
          className="
            relative p-1 rounded-lg
            text-text-tertiary
            transition-colors
            hover:text-accent-primary hover:bg-slate-100 dark:hover:bg-white/5
          "
          title={`Inbox & Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <FiBell className="text-lg transition-transform hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm ring-2 ring-background-app tabular-nums animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>


        {/* Settings */}
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="
            w-[18px] h-[18px] flex items-center justify-center
            text-text-tertiary
            transition-colors
            hover:text-accent-primary
          "
        >
          <FiSettings className="w-[18px] h-[18px] transition-transform hover:scale-110" />
        </button>

      </div>

      {/* Floating Utilities Column (Below Settings) */}
      <div className="fixed top-[85px] right-[14px] w-[30px] flex flex-col items-center justify-center gap-3 z-40">
        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="
            w-[30px] h-[30px] flex items-center justify-center rounded-xl
            text-text-tertiary
            transition-all
            hover:text-accent-primary
            hover:bg-background-surface/80
            active:scale-95
          "
          title="Calculator"
        >
          <Calculator className="w-[18px] h-[18px] transition-transform hover:scale-110" />
        </button>

        {/* Order Ticket Toggle */}
        <button
          onClick={() => {
            if (globalOrderTicket) {
              setGlobalOrderTicket(null);
            } else {
              const allInst = [...FO_INDICES, ...FO_EQUITIES];
              const match = allInst.find(i => i.value === selectedInstrument);
              setGlobalOrderTicket({
                type: 'QUICK',
                data: {
                  instrument_token: selectedInstrument || "NSE_INDEX|Nifty 50",
                  value: selectedInstrument || "NSE_INDEX|Nifty 50",
                  tradingsymbol: match ? match.label : (selectedLabel || "NIFTY 50"),
                  name: match ? match.label : (selectedLabel || "NIFTY 50"),
                  exchange: match?.exchange || "NSE"
                }
              });
            }
          }}
          className={`
            relative
            w-[30px] h-[30px] flex items-center justify-center rounded-xl
            transition-all
            hover:bg-background-surface/80
            active:scale-95
            ${globalOrderTicket ? 'text-accent-primary' : 'text-text-tertiary hover:text-accent-primary'}
          `}
          title="Order Ticket (T)"
        >
          <MdPointOfSale className="text-xl transition-transform hover:scale-110" />
          {globalOrderTicket && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
          )}
        </button>

        {/* Backtesting Workshop Direct Launcher — Positioned Directly Under the Tickets Icon, ONLY on Dashboard Page */}
        {isDashboardPage && (
          <button
            onClick={() => navigate('/backtest')}
            className="
              w-[30px] h-[30px] flex items-center justify-center rounded-xl
              text-text-tertiary
              transition-all
              hover:text-accent-primary
              hover:bg-background-surface/80
              active:scale-95
            "
            title="Backtesting Workshop"
          >
            <FlaskConical className="w-[18px] h-[18px] transition-transform hover:scale-110" />
          </button>
        )}

        {/* Future Vision Direct Telemetry Sync — Positioned Directly Under the Tickets Icon, ONLY on Analysis Pages */}
        {isAnalysisPage && (
          <button
            onClick={handleDirectTelemetrySync}
            disabled={isSyncingTelemetry}
            className={`
              relative
              w-[30px] h-[30px] flex items-center justify-center rounded-xl
              transition-all
              active:scale-95
              ${isSyncingTelemetry
                ? 'bg-accent-primary/20 text-accent-primary animate-pulse'
                : recentlySyncedModule
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'text-text-tertiary hover:text-accent-primary hover:bg-background-surface/80'}
            `}
            title={`Direct Sync to Future Vision (${currentAnalysisPage[1].label})`}
          >
            <BrainCircuit className={`w-[18px] h-[18px] transition-transform hover:scale-110 ${isSyncingTelemetry ? 'animate-spin' : ''}`} />
            {recentlySyncedModule && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-background-app" />
            )}
          </button>
        )}
      </div>

      {/* Detachable Magnetic Instrument Selector (Floating Widget) */}
      <DetachableInstrumentSelector isOpen={isWidgetOpen} onClose={() => setIsWidgetOpen(false)} />
      
      {/* Calculator Widget */}
      <CalculatorWidget isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
    </header>
  );
};

export default Navbar;
