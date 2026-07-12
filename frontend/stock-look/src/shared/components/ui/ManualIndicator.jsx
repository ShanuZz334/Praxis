import React from 'react';
import PortalTooltip from "./PortalTooltip";

/**
 * A standard, reusable indicator dot to identify UI elements whose data is manually overridden
 * or user-controlled, rather than fetched directly from a live API.
 */
export default function ManualIndicator({ 
    className = "top-2 right-2", 
    label = "Manual Override Data" 
}) {
    return (
        <div className={`absolute ${className} z-10`}>
            <PortalTooltip content={<div className="text-xs text-text-secondary">{label}</div>}>
                <div className="w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_4px_rgba(250,204,21,0.8)] cursor-help"></div>
            </PortalTooltip>
        </div>
    );
}
