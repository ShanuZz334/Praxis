/**
 * @file PortalTooltip.jsx
 * @purpose Renders tooltip content into a top-level React Portal.
 * @responsibilities
 * - Teleports tooltip content to `document.body` to avoid z-index/overflow clipping.
 * - Auto-calculates positioning relative to the trigger element.
 * - Flips placement (top/bottom) based on viewport availability.
 * - Inherits global theme context explicitly.
 * @key_exports
 * - PortalTooltip (Default)
 * @dependencies
 * - React (createPortal, hooks)
 * - ThemeContext
 * @lifecycle
 * - Wraps elements needing contextual help text.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from "@/shared/context/ThemeContext";

// =============================
// Component
// =============================

export default function PortalTooltip({
    content,
    children,
    className = "",
    offset = 8,
    variant = "default",
    trigger = "hover" // 'hover' or 'click'
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
        if (trigger !== 'hover') return;
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsVisible(true);
    };

    const hide = () => {
        if (trigger !== 'hover') return;
        hoverTimeout.current = setTimeout(() => {
            setIsVisible(false);
        }, 100);
    };

    const toggle = (e) => {
        if (trigger !== 'click') return;
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(prev => !prev);
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

    useEffect(() => {
        if (trigger !== 'click' || !isVisible) return;
        const handleClickOutside = (e) => {
            if (
                tooltipRef.current && !tooltipRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setIsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isVisible, trigger]);

    // Simplified Styling: Relies on CSS keys in index.css
    // --bg-tooltip resolves to Solid Grey in Light Mode, Solid Dark Blue in Dark Mode
    const bgClass = 'bg-background-tooltip';
    const textClass = 'text-text-primary';
    const borderClass = 'border-border-default';

    return (
        <>
            <div
                ref={triggerRef}
                className={`${className} ${trigger === 'click' ? 'cursor-pointer' : ''}`}
                onMouseEnter={show}
                onMouseLeave={hide}
                onClick={toggle}
            >
                {children}
            </div>

            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    className={`fixed z-[9999] pointer-events-auto transition-opacity duration-200 ${theme}`}
                    data-theme={theme}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        opacity: isVisible ? 1 : 0
                    }}
                    onMouseEnter={show}
                    onMouseLeave={hide}
                    onClick={(e) => {
                        // Prevent click inside tooltip from bubbling to outside listener
                        if (trigger === 'click') e.stopPropagation();
                    }}
                >
                    {variant === 'minimal' ? (
                        <div className="bg-[#1a1f2e] border border-white/10 text-white/90 text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-xl pointer-events-none whitespace-nowrap">
                            {content}
                        </div>
                    ) : (
                        <div className={`${bgClass} ${textClass} border ${borderClass} rounded-xl shadow-xl p-4 overflow-hidden`}>
                            {content}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
