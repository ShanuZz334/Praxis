import React from "react";
import { RotateCcw } from "lucide-react";

/**
 * @file FlipContainer.jsx
 * @purpose A 3D flippable container matching the Dart implementation.
 */

export function FlipContainer({ isFlipped, front, back, className = "" }) {
    return (
        <div className={`relative w-full h-full ${className}`} style={{ perspective: "1000px" }}>
            <div
                className="w-full h-full transition-transform duration-700 relative"
                style={{
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* FRONT */}
                <div
                    className="w-full h-full"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    {front}
                </div>

                {/* BACK */}
                <div
                    className="w-full h-full absolute inset-0"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {back}
                </div>
            </div>
        </div>
    );
}

/**
 * Reusable flip trigger button to place in headers
 */
export function FlipTrigger({ onClick, className = "" }) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-md hover:bg-background-surface/50 transition-colors text-text-tertiary hover:text-text-primary ${className}`}
            title="Flip Card"
        >
            <RotateCcw className="w-3.5 h-3.5" />
        </button>
    );
}
