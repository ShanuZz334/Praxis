import React from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { useTheme } from "../../context/ThemeContext";

import MobileThemeToggle from "../../components/ui/MobileThemeToggle";

import { motion } from "framer-motion";

const MobileQuickNav = ({ activePath, hoveredPath }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-start pl-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`absolute inset-0 bg-black/20 backdrop-blur-[2px]`}
            />

            {/* Icon Strip */}
            <motion.div
                initial={{ x: -20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    relative z-10 flex flex-col items-center justify-center gap-3 px-3 py-6 h-auto max-h-[85vh] overflow-y-auto rounded-2xl no-scrollbar
                    ${isDark ? 'bg-[#0C1224]/80 backdrop-blur-md border border-white/10' : 'bg-white/60 backdrop-blur-md border border-gray-200'}
                    shadow-2xl
                `}
            >
                {/* Theme Toggle at Top */}
                <div
                    className="pb-2 border-b border-white/10 w-full flex justify-center"
                    data-quick-nav-path="theme-toggle"
                >
                    <MobileThemeToggle />
                </div>

                {SIDE_MENU_DATA.filter(i => i.key !== 'logout').map((item) => {
                    const isActive = activePath === item.path;
                    const isHovered = hoveredPath === item.path;

                    return (
                        <div
                            key={item.id}
                            data-quick-nav-path={item.path}
                            className={`
                                p-3 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0
                                ${isActive ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}
                                ${isHovered ? 'scale-125 shadow-lg ring-2 ring-blue-500/50 z-20 bg-blue-500 text-white' : ''}
                                ${!isActive && !isHovered ? (isDark ? 'text-text-secondary' : 'text-text-tertiary') : ''}
                            `}
                        >
                            <item.icon className="text-2xl" />
                        </div>
                    );
                })}
            </motion.div>

            {/* Helper Text (Optional) */}
            <div className="absolute left-24 top-1/2 -translate-y-1/2 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: hoveredPath ? 1 : 0, x: hoveredPath ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                    className={`
                        px-4 py-2 rounded-lg backdrop-blur-md shadow-lg font-bold text-sm
                        ${isDark ? 'bg-[#0C1224]/80 text-white' : 'bg-white/80 text-slate-900'}
                    `}
                >
                    {SIDE_MENU_DATA.find(i => i.path === hoveredPath)?.label || ""}
                </motion.div>
            </div>
        </div>
    );
};

export default MobileQuickNav;
