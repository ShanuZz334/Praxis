/**
 * @file AppShell.jsx
 * @purpose Provides the top-level layout grid and containment for the application's core content.
 * @responsibilities
 * - Enforces responsive horizontal containment across all views.
 * - Standardizes vertical and horizontal padding for the main workspace.
 * - Provides a semantic <main> entry point for accessibility and SEO.
 * @key_exports
 * - AppShell (Default): Higher-order component for content wrapping.
 * @dependencies
 * - React: Core library for component rendering.
 * @lifecycle
 * - Rendered by App.jsx as a persistent container.
 * - Re-renders when children (routes/pages) change.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import OverrideUpdateModal from "@/features/dashboard/messages/ui/OverrideUpdateModal";

// =============================
// Main Component
// =============================
const AppShell = ({ children }) => {
  return (
    <main
      className="
                flex-1
                px-4 sm:px-6 lg:px-8
                py-6
                w-full
                mx-auto
                w-full
            "
    >
      {children}
      <OverrideUpdateModal />
    </main>
  );
};

// =============================
// Exports
// =============================
export default AppShell;
