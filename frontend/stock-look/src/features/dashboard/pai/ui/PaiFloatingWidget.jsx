import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useAnimation } from 'framer-motion';
import { usePaiWidget } from '@/shared/context/PaiWidgetContext';
import { useLocation } from 'react-router-dom';
import paiIcon from "@/assets/icons/pai-round-bgless.png";
import paiLabelImg from "@/assets/icons/pai-label-bgless.png";
import PaiLoader from './PaiLoader';
import { X, Send, Sparkles, Globe } from 'lucide-react';

export default function PaiFloatingWidget({ sidebarCollapsed = true }) {
    const { 
        isDocked, setIsDocked, 
        isChatOpen, setIsChatOpen, 
        sidebarRect
    } = usePaiWidget();
    
    const location = useLocation();
    const [chatMode, setChatMode] = useState('contextual'); // 'contextual' or 'global'
    
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const [message, setMessage] = useState("");
    const dragControls = useDragControls();
    
    // Explicitly control the dragging physics
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [showPanel, setShowPanel] = useState(false);
    const isSnapping = useRef(false);
    const [isSnappingState, setIsSnappingState] = useState(false);
    const controls = useAnimation();
    
    const [messages, setMessages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const bottomRef = useRef(null);
    const generationTimeoutRef = useRef(null);

    // Compute active context name
    const getContextName = (pathname) => {
        if (pathname.includes('/fundamental')) return 'Fundamentals';
        if (pathname.includes('/technical')) return 'Technicals';
        if (pathname.includes('/options')) return 'Options';
        if (pathname.includes('/global')) return 'Global Macros';
        if (pathname.includes('/events')) return 'Events';
        return 'Dashboard';
    };
    const activeContext = chatMode === 'global' ? 'Global Praxis' : getContextName(location.pathname);

    // Initial greeting and auto-reset when context changes
    useEffect(() => {
        setMessages([{ id: 1, role: 'ai', content: `Hello! I'm PAI. What would you like to analyze regarding ${activeContext}?` }]);
    }, [activeContext]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isGenerating, showPanel]);

    // Cleanup generation timeout on unmount
    useEffect(() => {
        return () => {
            if (generationTimeoutRef.current) {
                clearTimeout(generationTimeoutRef.current);
            }
        };
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || isGenerating) return;

        const newMsg = { id: Date.now(), role: 'user', content: message };
        setMessages(prev => [...prev, newMsg]);
        setMessage('');
        setIsGenerating(true);

        // Simulate AI response delay
        generationTimeoutRef.current = setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: 'This is a placeholder response for the UI mockup. Once the local LLM via Ollama is connected, real insights will stream here!'
            }]);
            setIsGenerating(false);
        }, 1500);
    };

    // Trigger initial slide out if opened from sidebar
    useEffect(() => {
        let slideTimer;
        let panelTimer;

        if (!isDocked) {
            // Reset snapping lock whenever it undocks so it can be magnetically grabbed again
            isSnapping.current = false;
            setIsSnappingState(false);
        }

        if (!isDocked && isChatOpen && !hasDragged) {
            // Wait 50ms for Framer Motion to fully bind the drag constraints to the DOM node
            // Without this, the drag initialization will silently cancel the controls.start() call on the second mount!
            slideTimer = setTimeout(() => {
                controls.start({ x: 230, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } });
            }, 50);
            
            // Open the panel after the slide animation naturally finishes (~400ms)
            panelTimer = setTimeout(() => {
                setShowPanel(true);
            }, 450);
        } else if (!isChatOpen) {
            setShowPanel(false);
        } else {
            setShowPanel(true);
        }

        return () => {
            if (slideTimer) clearTimeout(slideTimer);
            if (panelTimer) clearTimeout(panelTimer);
        };
    }, [isDocked, isChatOpen, hasDragged, controls]);

    // Force dock when the sidebar is expanded to prevent two chats
    useEffect(() => {
        if (sidebarCollapsed === false && !isDocked) {
            setShowPanel(false);
            setIsSnappingState(true);
            
            // Wait 1 frame so React updates the DOM to disable drag, preventing race conditions
            requestAnimationFrame(() => {
                controls.start({
                    x: 0,
                    y: 0,
                    transition: { type: "spring", stiffness: 300, damping: 25 }
                }).then(() => {
                    // Manually zero out internal state before unmounting so it wakes up fresh next time
                    x.set(0);
                    y.set(0);
                    setIsDocked(true);
                    setIsChatOpen(false);
                    setIsSnappingState(false);
                });
            });
        }
    }, [sidebarCollapsed, isDocked, controls, setIsDocked, setIsChatOpen, x, y]);

    if (isDocked) return null;

    const handleDragStart = () => {
        setIsDragging(true);
        setHasDragged(true);
        
        // Prevent background text selection while playing with the magnet
        window.getSelection()?.removeAllRanges(); // Clear any accidental selection
        document.body.style.userSelect = "none";
    };

    const handleDrag = async (e, info) => {
        if (!sidebarRect || isSnapping.current) return;
        
        // Calculate distance from current drag point to the sidebar dock center
        const dist = Math.hypot(info.point.x - sidebarRect.centerX, info.point.y - sidebarRect.centerY);
        
        // Magnetic Snapping: If pulled within 120px, rip it from the cursor and dock it!
        if (dist < 120) {
            isSnapping.current = true;
            setIsSnappingState(true); // Triggers re-render to set drag={false}, forcefully disengaging the user's mouse
            setIsChatOpen(false); // Close chat panel immediately
            
            // Because docking unmounts the floating element, native pointerup/mouseup events often get cancelled by the browser.
            // We use a 3-second delay to guarantee text selection is restored gracefully after the user has finished their interaction.
            setTimeout(() => {
                document.body.style.userSelect = "";
            }, 3000);
            
            // Wait exactly 1 frame for React to apply drag={false} so the animation doesn't get instantly cancelled by an active drag session
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Manually animate x and y back to the exact origin (0,0) before unmounting for a 100% smooth transition
            await controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 600, damping: 12, mass: 0.8 } }).catch(() => {});
            
            // Force zero the physics variables and reset the drag constraint state BEFORE docking,
            // so when it mounts next time, it doesn't instantly trigger a state change that cancels its initial slide out!
            x.set(0);
            y.set(0);
            setIsSnappingState(false);
            
            setIsDocked(true);
            setHasDragged(false); // Reset for next time
        }
    };

    const handleDragEnd = async (e, info) => {
        setIsDragging(false);
        // The pointerup listener handles restoring userSelect now
        
        if (!sidebarRect || isSnapping.current) return;
        // Check once more on release, just in case
        const dist = Math.hypot(info.point.x - sidebarRect.centerX, info.point.y - sidebarRect.centerY);
        if (dist < 180) { // considerably more generous on release
            isSnapping.current = true;
            setIsSnappingState(true);
            setIsChatOpen(false);
            
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            await controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 600, damping: 12, mass: 0.8 } }).catch(() => {});
            
            x.set(0);
            y.set(0);
            setIsSnappingState(false);
            
            setIsDocked(true);
            setHasDragged(false);
        }
    };

    const handleIconClick = () => {
        if (!isDragging) {
            setIsChatOpen(!isChatOpen);
        }
    };

    return (
        <div 
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{
                // Anchor the container's 0,0 strictly to the sidebar placeholder!
                left: sidebarRect?.x || 0,
                top: sidebarRect?.y || 0
            }}
        >
            {/* The draggable wrapper holds BOTH the icon and the panel */}
            <motion.div 
                className="absolute"
                animate={controls}
                style={{ x, y }}
                drag={!isSnappingState}
                dragControls={dragControls}
                dragListener={false} // Prevents dragging via the chat panel
                dragMomentum={false}
                dragElastic={0.1} // tight drag
                // Constrain to screen so it never gets lost
                dragConstraints={{ 
                    left: -(sidebarRect?.x || 0), 
                    top: -(sidebarRect?.y || 0), 
                    right: window.innerWidth - (sidebarRect?.x || 0) - 48, 
                    bottom: window.innerHeight - (sidebarRect?.y || 0) - 48 
                }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
            >
                {/* The PAI Handle (Chat Head) */}
                <motion.div
                    layoutId="pai-handle"
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={handleIconClick}
                    whileHover={!isDragging ? { scale: 1.05 } : {}}
                    whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                    style={{
                        scale: isChatOpen ? 1.08 : 1,
                        boxShadow: isChatOpen ? "0 0 20px rgba(59,130,246,0.5)" : "0 0 0px rgba(0,0,0,0)",
                    }}
                    className="w-[48px] h-[48px] rounded-full flex-shrink-0 cursor-pointer pointer-events-auto relative z-20"
                >
                    <img
                        src={paiIcon}
                        alt="PAI"
                        className="w-full h-full object-contain drop-shadow-xl pointer-events-none"
                        draggable={false}
                    />
                </motion.div>

                {/* The Quick Chat Panel */}
                <AnimatePresence>
                    {showPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, filter: "blur(10px)", height: 0 }}
                            animate={{ width: 320, opacity: 1, filter: "blur(0px)", height: 460 }}
                            exit={{ width: 0, opacity: 0, filter: "blur(10px)", height: 0 }}
                            transition={{
                                width: { type: "spring", stiffness: 250, damping: 22, duration: 0.32 },
                                height: { type: "spring", stiffness: 250, damping: 22, duration: 0.32 },
                                opacity: { duration: 0.25 },
                                filter: { duration: 0.18 }
                            }}
                            onPointerDownCapture={(e) => e.stopPropagation()} // Extra safety to prevent drag on panel
                            // Absolute positioned below the icon, perfectly horizontally centered relative to the icon
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 origin-top bg-background-tooltip backdrop-blur-xl border border-border-default shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col z-10"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
                                <div className="w-6 shrink-0" /> {/* Spacer to perfectly center the logo */}
                                <div 
                                    className="flex justify-center items-center cursor-pointer relative group"
                                    onDoubleClick={() => setChatMode(p => p === 'global' ? 'contextual' : 'global')}
                                    title="Double click to toggle Global AI Mode"
                                >
                                    <img src={paiLabelImg} alt="PAI" className="h-7 object-contain drop-shadow-md transition-transform group-hover:scale-105" draggable={false} />
                                    {chatMode === 'global' && (
                                        <div className="absolute -right-6 flex items-center">
                                            <Globe size={14} className="text-blue-500 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors shrink-0">
                                    <X className="w-4 h-4 text-text-tertiary" />
                                </button>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto no-scrollbar flex flex-col gap-3 min-w-0">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-2 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'ai' && (
                                            <div className="shrink-0 flex items-start mt-0.5">
                                                <img 
                                                    src="/images/pai-profile.png" 
                                                    alt="PAI"
                                                    className="w-6 h-6 rounded-full object-cover shadow-[0_0_10px_rgba(99,102,241,0.2)] bg-black"
                                                />
                                            </div>
                                        )}
                                        <div className={`text-[12px] leading-relaxed px-3.5 py-2.5 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm max-w-[85%]' : 'bg-background-tooltip border border-border-default/50 text-text-primary rounded-tl-sm max-w-[85%]'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isGenerating && (
                                    <div className="w-full">
                                        <PaiLoader />
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-3 border-t border-border-subtle shrink-0">
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={`Ask PAI about ${activeContext}...`}
                                        className="w-full bg-background-app border border-border-default rounded-xl pl-4 pr-10 py-2.5 text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <button type="submit" disabled={isGenerating || !message.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
