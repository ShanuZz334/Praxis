import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@/shared/utils/axiosInstance";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const UpstoxCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("Exchanging authorization code...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setStatus("error");
                setMessage(`Authorization failed: ${error}`);
                toast.error("Upstox authorization failed");
                setTimeout(() => navigate("/dashboard/admin"), 3000);
                return;
            }

            if (!code) {
                setStatus("error");
                setMessage("No authorization code received");
                setTimeout(() => navigate("/dashboard/admin"), 3000);
                return;
            }

            try {
                const res = await axiosInstance.post("/api/v1/oauth/upstox/callback", { code });
                setStatus("success");
                setMessage("Upstox connected successfully!");
                toast.success("Upstox connected successfully");
                setTimeout(() => navigate("/dashboard/admin"), 2000);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Failed to connect Upstox");
                toast.error("Failed to connect Upstox");
                setTimeout(() => navigate("/dashboard/admin"), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-background-surface border border-border-subtle rounded-2xl p-8 text-center">
                {status === "processing" && (
                    <>
                        <Loader size={48} className="mx-auto mb-4 text-accent-primary animate-spin" />
                        <h2 className="text-xl font-bold mb-2">Processing...</h2>
                        <p className="text-text-muted">{message}</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                        <h2 className="text-xl font-bold mb-2 text-green-500">Success!</h2>
                        <p className="text-text-muted">{message}</p>
                        <p className="text-xs text-text-disabled mt-4">Redirecting to Admin Dashboard...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <XCircle size={48} className="mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold mb-2 text-red-500">Error</h2>
                        <p className="text-text-muted">{message}</p>
                        <p className="text-xs text-text-disabled mt-4">Redirecting...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default UpstoxCallback;
