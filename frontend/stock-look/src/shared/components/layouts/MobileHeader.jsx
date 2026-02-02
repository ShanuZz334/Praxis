import React, { useContext, useState, useRef } from "react";
import { FiSettings } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import GlitchText from "@/shared/components/backgrounds/GlitchText";
import logoBgless from "@/assets/icons/logo_bgless.png";
import MobileQuickNav from "./MobileQuickNav";

const MobileHeader = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(UserContext);

    // QuickNav Logic
    const [isQuickNavActive, setIsQuickNavActive] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);
    const timerRef = useRef(null);
    const isQuickNavActiveRef = useRef(false); // Ref for immediate access in touchmove

    const handleTouchStart = (e) => {
        // Don't prevent default yet to allow click if short tap
        timerRef.current = setTimeout(() => {
            setIsQuickNavActive(true);
            isQuickNavActiveRef.current = true;
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
        }, 500); // 500ms long press
    };

    const handleTouchEnd = (e) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isQuickNavActiveRef.current) {
            // It was a long press
            e.preventDefault(); // Prevent click
            if (hoveredPath) {
                navigate(hoveredPath);
            }

            // Reset
            setIsQuickNavActive(false);
            setHoveredPath(null);
            isQuickNavActiveRef.current = false;
        } else {
            // It was a short tap -> handled by onClick
            // No action needed here, onClick will fire
        }
    };

    const handleTouchMove = (e) => {
        if (isQuickNavActiveRef.current) {
            e.preventDefault(); // Prevent scrolling while dragging
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);

            // Find the closest parent with the data attribute
            const navItem = target?.closest('[data-quick-nav-path]');
            if (navItem) {
                const path = navItem.dataset.quickNavPath;
                setHoveredPath(path);
            } else {
                setHoveredPath(null);
            }
        } else {
            // Detect if finger moved significantly -> cancel long press
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    return (
        <>
            {/* QuickNav Overlay */}
            {isQuickNavActive && (
                <MobileQuickNav activePath={location.pathname} hoveredPath={hoveredPath} />
            )}

            <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 h-18 flex items-center justify-between md:hidden">

                <button
                    onClick={(e) => {
                        // Only trigger standard menu if QuickNav wasn't active
                        if (!isQuickNavActiveRef.current) {
                            onMenuClick();
                        }
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    className="p-2 -ml-2 transition-all hover:opacity-80 active:scale-95 select-none touch-none" // touch-none is important
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
