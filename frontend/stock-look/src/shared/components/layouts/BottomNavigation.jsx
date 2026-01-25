import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiTrendingUp, FiActivity, FiBookOpen, FiMenu, FiCreditCard } from "react-icons/fi";
import { UserContext } from "@/shared/context/UserContext";

const BottomNavigation = ({ onMoreClick }) => {
    const location = useLocation();
    const { user } = useContext(UserContext);

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: FiGrid, path: "/dashboard/home" },
        { id: "options", label: "Options", icon: FiActivity, path: "/dashboard/options" },
        { id: "technical", label: "Technical", icon: FiTrendingUp, path: "/dashboard/technical" },
        { id: "journal", label: "Journal", icon: FiBookOpen, path: "/dashboard/journal" },
        // { id: "wallet", label: "Wallet", icon: FiCreditCard, path: "/dashboard/wallet" }, // Future
        { id: "more", label: "More", icon: FiMenu, action: onMoreClick },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/10 pb-safe-area-bottom md:hidden">
            <div className="flex items-center justify-between px-2">
                {navItems.map((item) => {
                    const isActive = item.path && location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={item.action ? item.action : undefined}
                            className="flex-1"
                        >
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300 ${isActive ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    <div className={`relative ${isActive ? "-translate-y-1" : ""}`}>
                                        <Icon className={`text-xl ${isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : ""}`} />
                                        {isActive && (
                                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium ${isActive ? "opacity-100" : "opacity-0"}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            ) : (
                                <div
                                    className={`flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300 text-gray-500 hover:text-gray-300`}
                                >
                                    <Icon className="text-xl" />
                                    <span className="text-[10px] font-medium opacity-0">
                                        {item.label}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavigation;
