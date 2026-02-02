import React, { useContext } from "react";
import { FiSettings } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";
import { useNavigate } from "react-router-dom";
import GlitchText from "@/shared/components/backgrounds/GlitchText";
import logoBgless from "@/assets/icons/logo_bgless.png";

const MobileHeader = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 h-18 flex items-center justify-between md:hidden">

            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 transition-all hover:opacity-80 active:scale-95"
                aria-label="Menu"
            >
                <img
                    src={logoBgless}
                    alt="Menu"
                    className="w-10 h-10 transition-transform hover:scale-110"
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
    );
};

export default MobileHeader;
