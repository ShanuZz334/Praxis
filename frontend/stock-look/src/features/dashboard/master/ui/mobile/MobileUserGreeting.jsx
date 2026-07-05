import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "@/shared/context/UserContext";

export default function MobileUserGreeting() {
    const { user } = useContext(UserContext);
    const firstName = user?.fullName?.split(" ")[0] || "Muhammed";

    const [timeString, setTimeString] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            setTimeString(time);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex justify-between items-end mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <p className="text-text-secondary text-sm mb-1">Good Morning,</p>
                <h1 className="text-text-primary text-3xl font-bold mb-1">{firstName}</h1>
                <p className="text-text-secondary text-xs">
                    Markets are open &bull; {timeString}
                </p>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                <span className="text-text-secondary text-xs font-medium">Live</span>
            </div>
        </div>
    );
}
