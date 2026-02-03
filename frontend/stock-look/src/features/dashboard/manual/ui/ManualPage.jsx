/**
 * @file ManualPage.jsx
 * @purpose The root wrapper for the Manual feature.
 * @responsibilities
 * - Acts as the layout container if needed.
 * - Currently serves as a pass-through or index redirect depending on routing configuration.
 * - Maintains consistency with other feature page architectures.
 * @key_exports
 * - ManualPage (Default Component)
 * @dependencies
 * - React
 * @lifecycle
 * - Main route for /dashboard/manual.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import ManualDashboard from "./ManualDashboard";

// =============================
// Main Component
// =============================

export default function ManualPage() {
    return (
        <div className="max-w-[1920px] mx-auto min-h-screen">
            {/* 
              Currently rendering the Dashboard directly. 
              If sub-routes are handled by a Router in App.jsx, 
              this might just be the Index Page.
            */}
            <ManualDashboard />
        </div>
    );
}
