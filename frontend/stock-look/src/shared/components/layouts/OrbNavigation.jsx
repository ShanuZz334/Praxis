import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SIDE_MENU_DATA } from '@/shared/utils/data';
import { useTheme } from '@/shared/context/ThemeContext';
import { usePaiWidget } from '@/shared/context/PaiWidgetContext';
import logo1Bgless from "@/assets/icons/praxis logo 1 bgless.png";
import logo2Bgless from "@/assets/icons/praxis logo 2 bgless.png";

const OrbNavigation = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { setIsDocked, setIsChatOpen } = usePaiWidget();
    
    const [isDetached, setIsDetached] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const clickTimeoutRef = useRef(null);
    const hoverTimeoutRef = useRef(null);

    // Filter out items that shouldn't be in the orb (like logout, unless we want it)
    const navItems = SIDE_MENU_DATA.filter(item => item.key !== 'logout');

    const handleSingleClick = () => {
        if (!isDetached) {
            onToggleSidebar();
        }
    };

    const handleClick = (e) => {
        // Prevent triggering single click if dragging
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            setIsDetached(prev => !prev);
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                handleSingleClick();
                clickTimeoutRef.current = null;
            }, 250);
        }
    };

    const handleDragEnd = (e, info) => {
        // Magnetic snap back to dock if dropped near the top-left corner
        const dist = Math.hypot(info.point.x, info.point.y);
        if (dist < 150) {
            setIsDetached(false);
            setIsHovered(false);
        }
    };

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 350); // Generous 350ms grace period before collapse
    };

    // Calculate positions for radial menu
    const getIconPosition = (index, total) => {
        // First ring supports up to 8 items
        const isOuterRing = index >= 8;
        const ringTotal = isOuterRing ? total - 8 : Math.min(total, 8);
        const ringIndex = isOuterRing ? index - 8 : index;
        
        const radius = isOuterRing ? 120 : 65;
        // Adjust angle to start from top (-90 degrees)
        const angle = (ringIndex / ringTotal) * 2 * Math.PI - Math.PI / 2;
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    };

    return (
        <motion.div
            ref={containerRef}
            drag={isDetached}
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1 }}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{
                x: isDetached ? (window.innerWidth / 2 - 28) : 4,
                y: isDetached ? (window.innerHeight / 2 - 28) : 8.5,
                position: 'fixed',
                zIndex: 9999,
            }}
            style={{
                touchAction: 'none',
                top: 0,
                left: 0,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="flex items-center justify-center cursor-pointer select-none"
            onClick={handleClick}
        >
            {/* Center Logo Orb */}
            <motion.div 
                className={`
                    w-14 h-14 rounded-full flex items-center justify-center 
                    transition-shadow duration-300 relative z-50
                    ${isDetached ? 'backdrop-blur-md bg-white/10 border border-white/20 shadow-xl' : ''}
                `}
                animate={{ scale: isHovered ? 1.1 : 1 }}
            >
                <img
                    src={theme === 'light' ? logo1Bgless : logo2Bgless}
                    alt="Menu"
                    className="w-[50px] h-[50px] object-contain pointer-events-none transition-transform hover:scale-110"
                />
            </motion.div>

            {/* Radial Menu Items */}
            <AnimatePresence>
                {(isHovered && isDetached) && (
                    <>
                        {navItems.map((item, index) => {
                            const pos = getIconPosition(index, navItems.length);
                            const IconComponent = item.icon;
                            
                            const getTooltipStyle = (pos) => {
                                const style = {
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                };
                                
                                // The tooltip's container is w-10 h-10 (40x40).
                                // 50% width is 20px (the center of the icon).
                                // We want the tooltip to be placed 160px from the absolute center of the ORB.
                                const margin = 160;

                                if (pos.x >= -0.1) { 
                                    // Right flank
                                    style.left = `calc(50% + ${margin - pos.x}px)`;
                                } else { 
                                    // Left flank
                                    style.right = `calc(50% + ${margin + pos.x}px)`;
                                }

                                return style;
                            };
                            
                            const tooltipStyle = getTooltipStyle(pos);
                            
                            return (
                                <motion.div
                                    key={item.key}
                                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                                    animate={{ opacity: 1, x: pos.x, y: pos.y, scale: 1 }}
                                    exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 260, 
                                        damping: 20,
                                        delay: index * 0.02 
                                    }}
                                    className="absolute w-10 h-10 rounded-full bg-background-elevated border border-border-default shadow-lg flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors z-40 hover:z-[60] group"
                                    onMouseEnter={handleMouseEnter} // Keep open when hovering items
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.key === 'pai') {
                                            setIsDocked(false);
                                            setIsChatOpen(true);
                                        } else {
                                            navigate(item.path);
                                        }
                                        setIsHovered(false);
                                    }}
                                >
                                    {IconComponent ? (
                                        <IconComponent className="w-5 h-5" />
                                    ) : (
                                        <div className="text-xs font-bold">{item.label[0]}</div>
                                    )}
                                    
                                    {/* Custom Premium Tooltip */}
                                    <div 
                                        className="absolute px-2 py-1 bg-black/90 backdrop-blur-md text-white text-[10px] tracking-wider font-semibold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-xl border border-white/10 z-[9999]"
                                        style={tooltipStyle}
                                    >
                                        {item.label}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default OrbNavigation;
