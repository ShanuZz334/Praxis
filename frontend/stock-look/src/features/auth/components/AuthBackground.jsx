/**
 * @file AuthBackground.jsx
 * @purpose Renders the visual background layer for all authentication-related screens.
 * @responsibilities
 * - Hosts the generative ColorBends component with specific auth-themed parameters.
 * - Ensures fixed-position, full-viewport coverage for the background effect.
 * - Manages the stacking context (z-index) for the background layer.
 * @key_exports
 * - AuthBackground (Default): Visual container component for auth backgrounds.
 * @dependencies
 * - ColorBends: Custom canvas-based background animation component.
 * @lifecycle
 * - Mounted as a persistent background in AuthLayout.
 * - Stays active during transitions between Login and SignUp views.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import ColorBends from "@/shared/components/backgrounds/ColorBends";

// =============================
// Main Component
// =============================
const AuthBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <ColorBends
        colors={["red", "violet", "#6D28FF"]}
        rotation={18}
        speed={0.15}
        scale={1.1}
        frequency={2}
        warpStrength={1.1}
        mouseInfluence={0.22}
        parallax={0.3}
        noise={0.05}
        transparent
      />
    </div>
  );
};

// =============================
// Exports
// =============================
export default AuthBackground;
