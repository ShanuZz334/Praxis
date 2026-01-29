import React, { useContext } from "react";
import { FiMenu, FiSettings } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";
import { useNavigate } from "react-router-dom";

const MobileHeader = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 h-14 flex items-center justify-between md:hidden">

            {/* Left: Hamburger (Menu) */}
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Menu"
            >
                <FiMenu className="text-2xl" />
            </button>

            {/* Center: Brand (Optional, maybe small logo) */}
            <div className="text-lg font-brand font-bold text-blue-500 tracking-wide">
                Stocky
            </div>

            {/* Right: Settings Switch */}
            <button
                onClick={() => navigate("/dashboard/settings")}
                className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Settings"
            >
                <FiSettings className="text-xl" />
            </button>

        </div>
    );
};

export default MobileHeader;
