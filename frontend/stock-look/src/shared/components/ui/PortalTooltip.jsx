import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * PortalTooltip
 * 
 * Renders tooltip content into a portal (document.body) to avoid
 * distinct stacking contexts and overflow clipping.
 * 
 * Features:
 * - Auto-flip (top/bottom) based on viewport space
 * - Horizontal clamping (stays within viewport)
 * - Fade in/out transition
 */
export default function PortalTooltip({
    content,
    children,
    className = "",
    offset = 8
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [placement, setPlacement] = useState('top'); // top | bottom
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    const updatePosition = () => {
        if (!triggerRef.current || !isVisible) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { width: 200, height: 100 };

        // Default: Top Center
        let top = triggerRect.top - tooltipRect.height - offset;
        let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        let newPlacement = 'top';

        // 1. Vertical Flip Check
        if (top < 10) {
            // Not enough space on top, flip to bottom
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

    const hoverTimeout = useRef(null);

    const show = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsVisible(true);
    };

    const hide = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsVisible(false);
        }, 300); // 300ms grace period
    };

    // Re-calculate on scroll or resize
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

    // Initial calculation when becoming visible
    useEffect(() => {
        if (isVisible) {
            // Small timeout to allow render and measuring
            requestAnimationFrame(updatePosition);
        }
    }, [isVisible]);

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
                    className="fixed z-[9999] pointer-events-auto transition-opacity duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        opacity: isVisible ? 1 : 0
                    }}
                    onMouseEnter={show}
                    onMouseLeave={hide}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
}
