/**
 * @file MountReveal.jsx
 * @purpose Provides a subtle enter animation for components when they mount.
 * @responsibilities
 * - Wraps children in a Framer Motion div.
 * - Animates opacity and vertical slide-in on mount.
 * - Accepts configurable delay.
 * @key_exports
 * - MountReveal (Default)
 * @dependencies
 * - framer-motion
 * @lifecycle
 * - Wraps page content or list items for smooth transitions.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import { motion } from "framer-motion";

// =============================
// Component
// =============================

const MountReveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.35,
      delay,
      ease: "easeOut",
    }}
  >
    {children}
  </motion.div>
);

export default MountReveal;
