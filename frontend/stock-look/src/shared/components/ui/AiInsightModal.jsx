import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import PaiChatArea from "@/features/dashboard/pai/ui/PaiChatArea";

export default function AiInsightModal({ open, onClose, targetId }) {
    const { theme } = useTheme();

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open || !targetId) return null;

    const formattedTitle = targetId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    return createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 ${theme}`}>
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* MODAL CONTAINER */}
            <div className="
                relative flex flex-col pointer-events-auto
                bg-background-app
                border border-border-default
                rounded-2xl
                shadow-2xl
                overflow-hidden
                w-full max-w-4xl
                h-[85vh]
            ">
                <button
                    onClick={onClose}
                    className="
                        group absolute top-4 right-4 z-50
                        w-8 h-8 flex items-center justify-center
                        rounded-full bg-background-elevated text-text-tertiary
                        hover:text-text-primary hover:bg-background-subtle
                        hover:scale-105 active:scale-95 transition-all duration-200
                        border border-border-subtle hover:border-border-default
                    "
                >
                    <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
                </button>
                <PaiChatArea 
                    activeChatId={targetId} 
                    chatTitle={`${formattedTitle} Insight`} 
                    chatType="header" 
                    isPopup={true}
                />
            </div>
        </div>,
        document.body
    );
}
