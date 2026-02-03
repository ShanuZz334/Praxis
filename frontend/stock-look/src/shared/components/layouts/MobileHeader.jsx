/**
 * @file MobileHeader.jsx
 * @purpose Top header bar for mobile devices.
 * @responsibilities
 * - Displays the logo/branding for mobile users.
 * - Provides access to the Sidebar Menu and Settings.
 * - Hosts the "Quick Navigation" gesture-based overlay.
 * - Manages touch interactions for long-press menus.
 * @key_exports
 * - MobileHeader (Default)
 * @dependencies
 * - MobileQuickNav, GlitchText
 * - UserContext, ThemeContext
 * @lifecycle
 * - Rendered by DashboardLayout on small screens.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useContext, useState, useRef, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import GlitchText from "@/shared/components/backgrounds/GlitchText";
import logoBgless from "@/assets/icons/logo_bgless.png";
import { useTheme } from "../../context/ThemeContext";
import MobileQuickNav from "./MobileQuickNav";

// =============================
// Component
// =============================

const MobileHeader = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(UserContext);

    // QuickNav Refs
    const buttonRef = useRef(null);
    const timerRef = useRef(null);
    const isQuickNavActiveRef = useRef(false);
    const hoveredPathRef = useRef(null);

    // QuickNav State
    const [isQuickNavActive, setIsQuickNavActive] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);

    // Helper for safe vibration
    const safeVibrate = (pattern) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore vibration errors (likely blocked by browser)
            }
        }
    };

    // Use actual theme toggle from context
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const button = buttonRef.current;
        if (!button) return;

        const handleTouchStart = (e) => {
            // Long press timer
            timerRef.current = setTimeout(() => {
                setIsQuickNavActive(true);
                isQuickNavActiveRef.current = true;
                safeVibrate(50);
            }, 500);
        };

        const handleTouchMove = (e) => {
            if (isQuickNavActiveRef.current) {
                if (e.cancelable) e.preventDefault(); // Prevent scrolling

                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);

                const navItem = target?.closest('[data-quick-nav-path]');
                if (navItem) {
                    const path = navItem.dataset.quickNavPath;
                    setHoveredPath(path);
                    hoveredPathRef.current = path;
                } else {
                    setHoveredPath(null);
                    hoveredPathRef.current = null;
                }
            } else {
                // Cancel long press if moving too much before activation
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            }
        };

        const handleTouchEnd = (e) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            if (isQuickNavActiveRef.current) {
                if (e.cancelable) e.preventDefault();

                const path = hoveredPathRef.current;

                // 1. Close Menu Immediately for responsiveness
                setIsQuickNavActive(false);
                setHoveredPath(null);
                isQuickNavActiveRef.current = false;
                hoveredPathRef.current = null;

                // 2. Defer heavy actions (Navigation/Theme) slightly to let UI update
                if (path) {
                    setTimeout(() => {
                        if (path === 'theme-toggle') {
                            toggleTheme();
                        } else {
                            navigate(path);
                        }
                    }, 50);
                }
            }
        };

        // Passive: false is crucial for preventing scroll
        button.addEventListener('touchstart', handleTouchStart, { passive: true });
        button.addEventListener('touchmove', handleTouchMove, { passive: false });
        button.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            button.removeEventListener('touchstart', handleTouchStart);
            button.removeEventListener('touchmove', handleTouchMove);
            button.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigate, toggleTheme]);

    return (
        <>
            {/* QuickNav Overlay */}
            <AnimatePresence>
                {isQuickNavActive && (
                    <MobileQuickNav activePath={location.pathname} hoveredPath={hoveredPath} />
                )}
            </AnimatePresence>

            <div className={`
                fixed top-3 left-3 right-3 z-50 
                h-16 flex items-center justify-between pl-0.5 pr-2 
                rounded-2xl backdrop-blur-xl border transition-all duration-300 md:hidden
                ${theme === 'dark'
                    ? 'bg-[#0C1224]/80 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                    : 'bg-white/70 border-gray-200/50 shadow-[0_8px_32px_rgba(31,38,135,0.1)]'}
            `}>

                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        if (!isQuickNavActiveRef.current) {
                            onMenuClick();
                        }
                    }}
                    className="p-1 -ml-1.5 transition-all hover:opacity-80 active:scale-95 select-none touch-none"
                    aria-label="Menu"
                >
                    <img
                        src={logoBgless}
                        alt="Menu"
                        className="w-12 h-12 transition-transform hover:scale-110 pointer-events-none" // prevent img from capturing drag
                    />
                </button>

                {/* Center: Brand Static Glitch Text */}
                <div className="flex items-center justify-center">
                    <GlitchText
                        speed={1}
                        enableShadows={false}
                        enableOnHover={true}
                        className="text-3xl font-extrabold text-[#1E1BFF]"
                    >
                        Stocky
                    </GlitchText>
                </div>

                <button
                    onClick={() => navigate("/dashboard/settings")}
                    className="p-1 -mr-1 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Settings"
                >
                    <FiSettings className="text-2xl" />
                </button>

            </div>
        </>
    );
};

export default MobileHeader;
