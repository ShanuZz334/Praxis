import React from "react";
import { FiInfo } from "react-icons/fi";

const DemoModeModal = ({ isOpen, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-2xl border border-[#1E1BFF]/20 bg-white dark:bg-[#0b1220] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1E1BFF]/10 mb-6">
                    <FiInfo className="h-10 w-10 text-[#1E1BFF]" />
                </div>

                <h3 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">Demo Mode</h3>

                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    This is a demo mode working on demo data for experiencing the app easily. Any changes you make will not be saved.
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full rounded-xl bg-[#1E1BFF] py-4 text-lg font-bold text-white hover:bg-[#1720cc] transition-all shadow-lg shadow-[#1E1BFF]/20 active:scale-95"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default DemoModeModal;
