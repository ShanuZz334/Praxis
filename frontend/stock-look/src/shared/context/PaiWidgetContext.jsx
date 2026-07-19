import React, { createContext, useState, useContext } from 'react';

export const PaiWidgetContext = createContext(null);

export const PaiWidgetProvider = ({ children }) => {
    // isDocked: True when in sidebar, False when floating
    const [isDocked, setIsDocked] = useState(true);
    
    // isChatOpen: True when the quick chat panel is visible
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // Position of the floating widget. Default to roughly where it detaches.
    const [floatingPos, setFloatingPos] = useState({ x: 80, y: 250 });

    // The bounding rect of the sidebar placeholder to snap to
    const [sidebarRect, setSidebarRect] = useState(null);
    
    // Is Sidebar Expanded?
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    return (
        <PaiWidgetContext.Provider 
            value={{ 
                isDocked, setIsDocked,
                isChatOpen, setIsChatOpen,
                floatingPos, setFloatingPos,
                sidebarRect, setSidebarRect,
                isSidebarExpanded, setIsSidebarExpanded
            }}
        >
            {children}
        </PaiWidgetContext.Provider>
    );
};

export const usePaiWidget = () => {
    const context = useContext(PaiWidgetContext);
    if (!context) {
        throw new Error("usePaiWidget must be used within a PaiWidgetProvider");
    }
    return context;
};
