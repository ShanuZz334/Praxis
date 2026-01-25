// src/features/dashboard/fundamentals/ui/EmptyState.jsx

import React from "react";

export default function EmptyState({ label = "Loading fundamentals…" }) {
  return (
    <div className="w-full py-24 flex items-center justify-center">
      <span className="text-sm text-white/50 animate-pulse">
        {label}
      </span>
    </div>
  );
}
