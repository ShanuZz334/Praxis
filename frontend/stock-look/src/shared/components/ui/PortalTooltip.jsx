import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from "@/shared/context/ThemeContext";

/**
 * PortalTooltip
 * 
 * Renders tooltip content into a portal (document.body) to avoid
 * distinct stacking contexts and overflow clipping.
 * 
 * Uses direct ThemeContext access to ensure correct styling (light/dark)
 * even when rendered outside the main app root.
 */
export default function PortalTooltip({
    content,
    children,
    className = "",
    offset = 8
}) {
    const { theme } = useTheme(); // 'light' or 'dark'
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [placement, setPlacement] = useState('top');

    // Refs
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const hoverTimeout = useRef(null);

    // Positioning Logic
    const updatePosition = () => {
        if (!triggerRef.current || !isVisible) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        // Use optional chaining for safety if ref not attached yet
        const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { width: 200, height: 100 };

        // Default: Top Center
        let top = triggerRect.top - tooltipRect.height - offset;
        let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        let newPlacement = 'top';

        // 1. Vertical Flip Check
        if (top < 10) {
            top = triggerRect.bottom + offset;
            newPlacement = 'bottom';
        }

        // 2. Horizontal Clamp Check
        const padding = 10;
        if (left < padding) left = padding;
        else if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }

        setCoords({ top, left });
        setPlacement(newPlacement);
    };

    // Events
    const show = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsVisible(true);
    };

    const hide = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsVisible(false);
        }, 300);
    };

    // Effects
    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    useEffect(() => {
        if (isVisible) {
            requestAnimationFrame(updatePosition);
        }
    }, [isVisible]);

    // Simplified Styling: Relies on CSS keys in index.css
    // --bg-tooltip resolves to Solid Grey in Light Mode, Solid Dark Blue in Dark Mode
    const bgClass = 'bg-[var(--bg-tooltip)]';
    const textClass = 'text-text-primary';
    const borderClass = 'border-border-default';

    return (
        <>
            <div
                ref={triggerRef}
                className={className}
                onMouseEnter={show}
                onMouseLeave={hide}
            >
                {children}
            </div>

            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    // Apply theme class to wrapper to ensure inner variables (text colors) resolve correctly
                    className={`fixed z-[9999] pointer-events-auto transition-opacity duration-200 ${theme}`}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        opacity: isVisible ? 1 : 0
                    }}
                    onMouseEnter={show}
                    onMouseLeave={hide}
                >
                    <div className={`${bgClass} ${textClass} border ${borderClass} rounded-xl shadow-xl p-4 overflow-hidden`}>
                        {content}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
