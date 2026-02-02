import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const SessionConflictModal = ({ isOpen, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white dark:bg-[#0b1220] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-6">
                    <FiAlertTriangle className="h-10 w-10 text-red-500" />
                </div>

                <h3 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Conflict</h3>

                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    This account has been logged in on another device. Your current session has been terminated to ensure your account security.
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default SessionConflictModal;
