import React from "react";

export default function TradePermissionBanner({ permission }) {
    if (!permission) return null;

    const bg = permission.status === "BLOCKED" ? "bg-red-500"
        : permission.status === "REDUCED_SIZE" ? "bg-yellow-500"
            : "bg-emerald-500";

    const msgColor = permission.status === "REDUCED_SIZE" ? "text-yellow-950" : "text-white";

    return (
        <div className={`w-full ${bg} p-1 mb-6 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-top-2 duration-500`}>
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{permission.status === "BLOCKED" ? "⛔" : permission.status === "REDUCED_SIZE" ? "⚠️" : "✅"}</span>
                    <div>
                        <div className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Trade Permission Status</div>
                        <div className={`text-lg font-bold ${msgColor} tracking-tight`}>{permission.status.replace("_", " ")}</div>
                    </div>
                </div>
                <div className={`text-sm font-medium ${msgColor} text-right hidden md:block`}>
                    {permission.reason}
                </div>
            </div>
        </div>
    );
}
