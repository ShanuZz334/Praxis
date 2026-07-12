import React from "react";
import flipperIcon from "@/assets/icons/flipper.png";

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
                        zIndex: isFlipped ? 0 : 1
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
                        zIndex: isFlipped ? 1 : 0
                    }}
                >
                    {back}
                </div>
            </motion.div>
        </motion.div>
    );
}

/**
 * Reusable flip trigger button to place in headers
 */
export function FlipTrigger({ onClick, className = "" }) {
    return (
        <button
            onClick={onClick}
            className={`p-0 rounded-md hover:bg-background-surface/50 transition-colors opacity-70 hover:opacity-100 ${className}`}
            title="Flip Card"
        >
            <img src={flipperIcon} alt="Flip" className="w-9 h-9 object-contain" />
        </button>
    );
}
