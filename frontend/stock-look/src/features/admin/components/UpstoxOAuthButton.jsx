import React, { useState } from "react";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "@/shared/utils/axiosInstance";
import { toast } from "sonner";

const UpstoxOAuthButton = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [authUrl, setAuthUrl] = useState(null);

    const handleInitiateAuth = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/api/v1/oauth/upstox/authorize");
            setAuthUrl(res.data.authUrl);
            // Open in new window
            window.open(res.data.authUrl, "_blank", "width=600,height=700");
            toast.success("Upstox authorization window opened");
        } catch (err) {
            toast.error("Failed to initiate Upstox OAuth");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleInitiateAuth}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/5 disabled:opacity-50"
        >
            <ExternalLink size={14} />
            {loading ? "Opening..." : "Connect Upstox"}
        </button>
    );
};

export default UpstoxOAuthButton;
