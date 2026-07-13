import React from "react";

/**
 * @file FlipContainer.jsx
 * @purpose A 3D flippable container matching the Dart implementation.
 */

import { motion } from "framer-motion";

export function FlipContainer({ isFlipped, front, back, className = "" }) {
    return (
        <motion.div 
            layout 
            className={`relative w-full ${className}`} 
            style={{ perspective: "1000px" }}
            transition={{ duration: 0.5, type: "spring", bounce: 0 }}
        >
            <motion.div
                layout
                className="w-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0 }}
                style={{
                    transformStyle: "preserve-3d",
                }}
            >
                {/* FRONT */}
                <div
                    className="w-full"
                    style={{ 
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        position: "relative", // Always relative to hold height
                        zIndex: isFlipped ? 0 : 50
                    }}
                >
                    {front}
                </div>

                {/* BACK */}
                <div
                    className="w-full h-full"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        position: "absolute", // Always absolute to match front's height
                        top: 0,
                        left: 0,
                        zIndex: isFlipped ? 50 : 0
                    }}
                >
                    {back}
                </div>
            </motion.div>
        </motion.div>
    );
}

const CustomFlipIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 3H16.5C17.88 3 19 4.12 19 5.5V18.5C19 19.88 17.88 21 16.5 21H9" />
        <path d="M9 3H7.5C6.12 3 5 4.12 5 5.5V8" />
        <path d="M9 21H7.5C6.12 21 5 19.88 5 18.5V16" />
        <path d="M2 13C2 9 4 8 9 8" />
        <path d="M6 5L10 8L6 11" />
    </svg>
);

/**
 * Reusable flip trigger button to place in headers
 */
export function FlipTrigger({ onClick, className = "" }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-md hover:bg-background-surface/50 transition-colors text-text-secondary hover:text-text-primary ${className}`}
            title="Manual Overrides"
        >
            <CustomFlipIcon className="w-5 h-5" />
        </button>
    );
}
