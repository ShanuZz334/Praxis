import React, { useContext, useState, useRef, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import GlitchText from "@/shared/components/backgrounds/GlitchText";
import logoBgless from "@/assets/icons/logo_bgless.png";
import { useTheme } from "../../context/ThemeContext";
import MobileQuickNav from "./MobileQuickNav";
import { AnimatePresence } from "framer-motion";

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
    const { toggleTheme } = useTheme();

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

            <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 h-18 flex items-center justify-between md:hidden">

                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        if (!isQuickNavActiveRef.current) {
                            onMenuClick();
                        }
                    }}
                    className="p-2 -ml-2 transition-all hover:opacity-80 active:scale-95 select-none touch-none"
                    aria-label="Menu"
                >
                    <img
                        src={logoBgless}
                        alt="Menu"
                        className="w-10 h-10 transition-transform hover:scale-110 pointer-events-none" // prevent img from capturing drag
                    />
                </button>

                {/* Center: Brand Static Glitch Text */}
                <div className="flex items-center justify-center">
                    <GlitchText
                        speed={1}
                        enableShadows={false}
                        enableOnHover={true}
                        className="text-2xl font-extrabold text-[#1E1BFF]"
                    >
                        Stocky
                    </GlitchText>
                </div>

                {/* Right: Settings Switch */}
                <button
                    onClick={() => navigate("/dashboard/settings")}
                    className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Settings"
                >
                    <FiSettings className="text-xl" />
                </button>

            </div>
        </>
    );
};

export default MobileHeader;
