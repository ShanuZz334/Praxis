import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useAnimation } from 'framer-motion';
import { usePaiWidget } from '@/shared/context/PaiWidgetContext';
import { useLocation } from 'react-router-dom';
import paiIcon from "@/assets/icons/pai-round-bgless.png";
import paiLabelImg from "@/assets/icons/pai-label-bgless.png";
import PaiLoader from './PaiLoader';
import Loader from '@/shared/components/ui/Loader';
import { X, Send, Sparkles, Globe, AtSign, Brain, Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useMentions, inferPageFromChatId } from '@/shared/hooks/useMentions';
import MentionSuggestionDropdown from '@/shared/components/ui/MentionSuggestionDropdown';
import { useVoice } from '@/shared/context/VoiceContext';

export default function PaiFloatingWidget({ sidebarCollapsed = true, isPaiPage = false }) {
    const { 
        isDocked, setIsDocked, 
        isChatOpen, setIsChatOpen, 
        sidebarRect
    } = usePaiWidget();
    
    const location = useLocation();
    const [chatMode, setChatMode] = useState('contextual'); // 'contextual' or 'global'

    const getTargetId = (pathname, mode) => {
        if (mode === 'global') return 'master_qchat';           // Cross-dashboard Master QChat
        if (pathname.includes('/fundamental')) return 'qchat_fundamentals';
        if (pathname.includes('/technical'))  return 'qchat_technical';  // canonical (was qchat_technicals)
        if (pathname.includes('/options'))    return 'qchat_options';
        if (pathname.includes('/global'))     return 'qchat_global';     // canonical (was qchat_global_macros)
        if (pathname.includes('/events'))     return 'qchat_events';
        return 'master_qchat';                                  // canonical (was qchat_dashboard)
    };

    const activeTargetId = getTargetId(location.pathname, chatMode);

    // Registry-driven page scope — same unified method as PaiChatArea, zero URL-path duplication
    const mentionScopePageId = inferPageFromChatId(activeTargetId);
    const mentions = useMentions(mentionScopePageId);
    const inputRef = useRef(null);
    
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
    const lastUserMsgRef = useRef(null);
    const chatContainerRef = useRef(null);
    const generationTimeoutRef = useRef(null);
    const [isFetchingHistory, setIsFetchingHistory] = useState(true);
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);

    const { isVoiceMode, toggleVoiceMode, status: voiceStatus, synthesize, skipTts, registerListener, unregisterListener } = useVoice();

    // Ref to hold the freshest handleSendDirect without causing dependency cycles
    const handleSendDirectRef = useRef(null);
    
    // Register listener when chat panel is open
    useEffect(() => {
        if (!isChatOpen || isDocked) return;
        
        const handleVoiceText = (text) => {
            const pseudoEvent = { preventDefault: () => {} };
            if (handleSendDirectRef.current) handleSendDirectRef.current(text);
        };
        registerListener(handleVoiceText);
        return () => unregisterListener(handleVoiceText);
    }, [isChatOpen, isDocked, registerListener, unregisterListener]);

    // Global listener for auto-undock when standby wake word fires globally
    useEffect(() => {
        const handleGlobalWakeWord = (e) => {
            // Auto undock and open!
            setIsDocked(false);
            setIsChatOpen(true);
            
            // We should also automatically send the message if there's text
            if (e.detail && e.detail.trim().length > 0) {
                setTimeout(() => {
                    if (handleSendDirectRef.current) handleSendDirectRef.current(e.detail);
                }, 1000); // Wait for open animation
            }
        };
        window.addEventListener('paiGlobalWakeWord', handleGlobalWakeWord);
        return () => window.removeEventListener('paiGlobalWakeWord', handleGlobalWakeWord);
    }, [isDocked, setIsDocked, setIsChatOpen]);

    const [tempModel, setTempModel] = useState(null);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const fetchModels = async () => {
            try {
                // 1. Fetch live local models
                const ollamaRes = await axiosInstance.get('/api/v1/ai-settings/providers/ollama/models').catch(() => ({ data: [] }));
                let localModels = ollamaRes.data || [];
                
                // 2. Fetch configured cloud providers
                const providersRes = await axiosInstance.get('/api/v1/ai-settings/providers').catch(() => ({ data: [] }));
                const cloudProviders = providersRes.data || [];
                
                // 3. Extract unique cloud models
                const cloudModelsSet = new Set();
                const cloudModels = [];
                
                cloudProviders.forEach(p => {
                    if (p.providerId === 'ollama') return; // Skip local models mapping
                    if (p.models) {
                        Object.values(p.models).forEach(modelStr => {
                            if (modelStr && !cloudModelsSet.has(modelStr)) {
                                cloudModelsSet.add(modelStr);
                                cloudModels.push({
                                    modelId: modelStr,
                                    displayName: `${p.displayName}: ${modelStr}`
                                });
                            }
                        });
                    }
                });

                if (isMounted) {
                    setAvailableModels([...cloudModels, ...localModels]);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchModels();
        return () => { isMounted = false; };
    }, []);

    // Compute active context name
    const getContextName = (pathname, mode) => {
        if (mode === 'global') return 'Global Praxis';
        if (pathname.includes('/fundamental')) return 'Fundamentals';
        if (pathname.includes('/technical')) return 'Technicals';
        if (pathname.includes('/options')) return 'Options';
        if (pathname.includes('/global')) return 'Global Macros';
        if (pathname.includes('/events')) return 'Events';
        return 'Dashboard';
    };

    const activeContext = getContextName(location.pathname, chatMode);    // Initial greeting and auto-reset when context changes
    useEffect(() => {
        if (!isChatOpen) return; // Only fetch history when the widget is actually opened!

        let isMounted = true;
        
        const fetchHistory = async () => {
            try {
                const res = await axiosInstance.get(`/api/v1/ai-prompts/thread/${activeTargetId}`, { params: { scope: 'page' } });
                if (isMounted && res.data?.entries && res.data.entries.length > 0) {
                    const fetchedHistory = res.data.entries.map((m, i) => ({
                        id: i,
                        role: m.role === 'assistant' ? 'ai' : m.role,
                        content: m.content
                    }));
                    setMessages(prev => {
                        // Preserve any messages the user sent while we were fetching (e.g. via voice)
                        const userMsgsDuringFetch = prev.filter(m => m.id > 1000000000);
                        return [...fetchedHistory, ...userMsgsDuringFetch];
                    });
                } else if (isMounted) {
                    const fallbackMsg = { id: 1, role: 'ai', content: `Hello! I'm PAI. What would you like to analyze regarding ${activeContext}?` };
                    setMessages(prev => {
                        const userMsgsDuringFetch = prev.filter(m => m.id > 1000000000);
                        return [fallbackMsg, ...userMsgsDuringFetch];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch chat history:", err);
                if (isMounted) {
                    const fallbackMsg = { id: 1, role: 'ai', content: `Hello! I'm PAI. What would you like to analyze regarding ${activeContext}?` };
                    setMessages(prev => {
                        const userMsgsDuringFetch = prev.filter(m => m.id > 1000000000);
                        return [fallbackMsg, ...userMsgsDuringFetch];
                    });
                }
            } finally {
                if (isMounted) setIsFetchingHistory(false);
            }
        };

        setIsFetchingHistory(true);
        setIsPanelExpanded(false); // Reset expansion state
        setMessages([]); // Clear before fetching
        fetchHistory();

        return () => { isMounted = false; };
    }, [activeContext, activeTargetId, isChatOpen]);

    // Auto-scroll to the last user message so the question stays in view
    useEffect(() => {
        if (!isPanelExpanded || isFetchingHistory || !chatContainerRef.current) return;

        // Use a short polling mechanism to wait for the DOM to settle after animation
        const scrollTarget = () => {
            const container = chatContainerRef.current;
            if (!container) return;
            
            if (lastUserMsgRef.current) {
                // Manually calculate scrollTop to perfectly place it at the top of the container
                // We subtract 16px to account for the container's p-4 padding
                const targetScrollTop = lastUserMsgRef.current.offsetTop - 16;
                container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
            } else if (bottomRef.current) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        };

        const t1 = setTimeout(scrollTarget, 100);
        const t2 = setTimeout(scrollTarget, 350); // Double check after animation fully finishes

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [messages, isGenerating, isPanelExpanded, isFetchingHistory]);

    // Cleanup generation timeout on unmount
    useEffect(() => {
        return () => {
            if (generationTimeoutRef.current) {
                clearTimeout(generationTimeoutRef.current);
            }
        };
    }, []);

    const handleSend = async (e) => {
        e?.preventDefault();
        handleSendDirect(message);
    };

    const handleSendDirect = async (textToSubmit) => {
        if (!textToSubmit.trim() || isGenerating) return;

        // Parse and resolve all @mentions from the message
        const { cleanText, cardSnapshots } = mentions.parseAndResolveAll(textToSubmit);
        mentions.closeMentions();

        const newMsg = {
            id: Date.now(),
            role: 'user',
            content: textToSubmit, // show original @mention text to user
            cardSnapshots: cardSnapshots.length > 0 ? cardSnapshots : undefined,
        };
        setMessages(prev => [...prev, newMsg]);
        setMessage('');
        setIsGenerating(true);

        try {
            const res = await axiosInstance.post(`/api/v1/ai-prompts/chat/${activeTargetId}`, {
                message: cleanText,
                scope: 'page',
                cardSnapshots: cardSnapshots.length > 0 ? cardSnapshots : undefined,
                explicitModel: tempModel,
            });
            
            if (res.data?.message) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'ai',
                    content: res.data.message
                }]);
                if (isVoiceMode) {
                    synthesize(res.data.message);
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: "Sorry, I encountered an error connecting to the AI Gateway."
            }]);
            if (isVoiceMode) {
                synthesize("Sorry, I encountered an error.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Update the ref to always point to the latest handleSendDirect (which has the latest closures)
    useEffect(() => {
        handleSendDirectRef.current = handleSendDirect;
    });

    // Trigger initial slide out if opened from sidebar
    useEffect(() => {
        let slideTimer;
        let panelTimer;

        if (!isDocked) {
            // Reset snapping lock whenever it undocks so it can be magnetically grabbed again
            isSnapping.current = false;
            setIsSnappingState(false);
        }

        if (!isDocked && isChatOpen) {
            if (!hasDragged) {
                // Wait 50ms for Framer Motion to fully bind the drag constraints to the DOM node
                slideTimer = setTimeout(() => {
                    controls.start({ x: 230, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } });
                }, 50);
            }
            
            // Always ensure the panel opens, regardless of whether it animated or not
            panelTimer = setTimeout(() => {
                setShowPanel(true);
            }, hasDragged ? 10 : 450);
            
        } else if (!isChatOpen) {
            setShowPanel(false);
            setIsPanelExpanded(false); // Reset when closing
            setTempModel(null);        // Reset temp model to original setting when closed
            setShowModelSelector(false);
        }

        return () => {
            if (slideTimer) clearTimeout(slideTimer);
            if (panelTimer) clearTimeout(panelTimer);
        };
    }, [isDocked, isChatOpen, hasDragged, controls]);

    const prevSidebarCollapsed = useRef(sidebarCollapsed);

    // Auto-dock the widget ONLY when the sidebar explicitly opens (transitions from true to false).
    // This allows the user to still pop it out manually while the sidebar is open!
    useEffect(() => {
        if (prevSidebarCollapsed.current === true && sidebarCollapsed === false) {
            if (!isDocked) {
                // Instantly dock it to avoid animation race conditions where it gets stuck in an undraggable state
                setIsDocked(true);
                setIsChatOpen(false);
                x.set(0);
                y.set(0);
                setIsSnappingState(false);
                setHasDragged(false);
            }
        }
        prevSidebarCollapsed.current = sidebarCollapsed;
    }, [sidebarCollapsed, isDocked, controls, setIsDocked, setIsChatOpen, x, y]);

    // Auto-dock when navigating to the PAI main page
    useEffect(() => {
        if (isPaiPage && !isDocked) {
            setIsDocked(true);
            setIsChatOpen(false);
            x.set(0);
            y.set(0);
            setIsSnappingState(false);
            setHasDragged(false);
        }
    }, [isPaiPage, isDocked, setIsDocked, setIsChatOpen, x, y]);

    if (isDocked) return null;

    const handleDragStart = () => {
        setIsDragging(true);
        setHasDragged(true);
        
        // Prevent background text selection while playing with the magnet
        window.getSelection()?.removeAllRanges(); // Clear any accidental selection
        document.body.style.userSelect = "none";
    };

    const getLatestSidebarRect = () => {
        const el = document.getElementById('pai-sidebar-dock-slot');
        if (!el) return sidebarRect;
        const rect = el.getBoundingClientRect();
        return {
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            centerX: rect.x + window.scrollX + rect.width / 2,
            centerY: rect.y + window.scrollY + rect.height / 2
        };
    };

    const handleDrag = async (e, info) => {
        if (isSnapping.current) return;
        const currentRect = getLatestSidebarRect();
        if (!currentRect) return;
        
        // Calculate distance from current drag point to the sidebar dock center
        const dist = Math.hypot(info.point.x - currentRect.centerX, info.point.y - currentRect.centerY);
        
        // Magnetic Snapping: If pulled within 128px, rip it from the cursor and dock it!
        if (dist < 128) {
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
        
        if (isSnapping.current) return;
        const currentRect = getLatestSidebarRect();
        if (!currentRect) return;

        // Check once more on release, just in case
        const dist = Math.hypot(info.point.x - currentRect.centerX, info.point.y - currentRect.centerY);
        if (dist < 176) { // considerably more generous on release
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

    // Continuously grab the real DOM coordinates so the container wrapper never gets stuck in a stale "blank" location on the screen
    const liveSidebarEl = document.getElementById('pai-sidebar-dock-slot');
    const liveSidebarRect = liveSidebarEl ? liveSidebarEl.getBoundingClientRect() : null;

    return (
        <div 
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{
                // Anchor the container's 0,0 strictly to the LIVE sidebar placeholder!
                left: liveSidebarRect ? liveSidebarRect.x : (sidebarRect?.x || 0),
                top: liveSidebarRect ? liveSidebarRect.y : (sidebarRect?.y || 0)
            }}
        >
            {/* The draggable wrapper holds BOTH the icon and the panel */}
            <motion.div 
                className="absolute"
                style={{ x, y, willChange: 'transform' }} // Force GPU layer to prevent dragging lag
                animate={controls}
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
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={handleIconClick}
                    whileHover={!isDragging ? { scale: 1.05 } : {}}
                    whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                    style={{
                        scale: isChatOpen ? 1.08 : 1,
                        boxShadow: isChatOpen ? "0 0 20px rgba(59,130,246,0.5)" : "0 4px 15px rgba(0,0,0,0.3)", // Use box-shadow instead of expensive drop-shadow
                    }}
                    className="w-[48px] h-[48px] rounded-full flex-shrink-0 cursor-pointer pointer-events-auto relative z-20 bg-background-surface"
                >
                    <img
                        src={paiIcon}
                        alt="PAI"
                        className="w-full h-full object-contain pointer-events-none" // Removed drop-shadow-xl for performance
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
                            onAnimationComplete={(definition) => {
                                if (definition.width === 320) {
                                    setIsPanelExpanded(true);
                                }
                            }}
                            onPointerDownCapture={(e) => e.stopPropagation()} // Extra safety to prevent drag on panel
                            // Absolute positioned below the icon, perfectly horizontally centered relative to the icon
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 origin-top bg-background-tooltip backdrop-blur-xl border border-border-default shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col z-10"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
                                <button 
                                    onClick={() => setShowModelSelector(!showModelSelector)}
                                    className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors shrink-0 group relative ${showModelSelector ? 'bg-blue-500/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                                    title="Temporary Model Override"
                                >
                                    <Brain className={`w-4 h-4 transition-colors ${showModelSelector || tempModel ? 'text-blue-500' : 'text-text-tertiary group-hover:text-blue-500'}`} />
                                    {tempModel && !showModelSelector && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                </button>
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
                            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto no-scrollbar min-w-0 relative">
                                <AnimatePresence mode="wait">
                                    {showModelSelector ? (
                                        <motion.div
                                            key="model-selector"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute inset-0 bg-background-app/95 backdrop-blur-xl z-[60] flex flex-col p-5"
                                        >
                                            <div className="text-sm font-semibold text-text-primary mb-1">Temporary Model Override</div>
                                            <div className="text-[11px] text-text-tertiary mb-4 leading-relaxed">
                                                Select a model to use for this session. It will reset to default when you close the widget.
                                            </div>
                                            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pb-2">
                                                <button
                                                    onClick={() => { setTempModel(null); setShowModelSelector(false); }}
                                                    className={`px-3 py-2 text-left text-xs rounded-lg transition-colors border ${
                                                        !tempModel 
                                                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-medium' 
                                                            : 'bg-background-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default'
                                                    }`}
                                                >
                                                    Default (Global Setting)
                                                </button>
                                                {availableModels.map(m => (
                                                    <button
                                                        key={m.modelId}
                                                        onClick={() => { setTempModel(m.modelId); setShowModelSelector(false); }}
                                                        className={`px-3 py-2 text-left text-xs rounded-lg transition-colors border ${
                                                            tempModel === m.modelId 
                                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-medium' 
                                                                : 'bg-background-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default'
                                                        }`}
                                                    >
                                                        {m.displayName || m.modelId}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : (!isPanelExpanded || isFetchingHistory) ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center opacity-70"
                                        >
                                            <Loader size="sm" color="blue" />
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="messages"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col gap-3"
                                        >
                                            {messages.map((msg, index) => {
                                                // Robust alternative to findLastIndex for older browsers
                                                let isLastUserMsg = false;
                                                if (msg.role === 'user') {
                                                    for (let i = messages.length - 1; i >= index; i--) {
                                                        if (messages[i].role === 'user') {
                                                            isLastUserMsg = (i === index);
                                                            break;
                                                        }
                                                    }
                                                }
                                                
                                                return (
                                                <motion.div 
                                                    ref={isLastUserMsg ? lastUserMsgRef : null}
                                                    initial={{ opacity: 0, y: 10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    transition={{ duration: 0.3 }}
                                                    key={msg.id} 
                                                    className={`flex gap-2 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
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
                                                </motion.div>
                                                );
                                            })}
                                            {isGenerating && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                                                    <PaiLoader />
                                                </motion.div>
                                            )}
                                            {/* Extra padding so the last message can actually be scrolled to the top even if it's short */}
                                            <div ref={bottomRef} className="h-[200px]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <form onSubmit={handleSend} className="p-3 border-t border-border-subtle shrink-0">
                                <div className="relative">
                                    {/* @mention dropdown — above the input */}
                                    {mentions.isOpen && (
                                        <MentionSuggestionDropdown
                                            suggestions={mentions.suggestions}
                                            highlightedIndex={mentions.highlightedIndex}
                                            query={mentions.mentionQuery}
                                            onHighlightChange={mentions.setHighlightedIndex}
                                            onSelect={(candidate) => {
                                                const newText = mentions.selectMention(candidate, message);
                                                setMessage(newText);
                                                setTimeout(() => inputRef.current?.focus(), 0);
                                            }}
                                            onClose={mentions.closeMentions}
                                        />
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                            mentions.handleInputChange(e.target.value, e.target.selectionStart);
                                        }}
                                        onKeyDown={(e) => {
                                            const consumed = mentions.handleKeyDown(e, message, (candidate, newText) => {
                                                setMessage(newText);
                                                setTimeout(() => inputRef.current?.focus(), 0);
                                            });
                                            if (consumed) e.preventDefault();
                                        }}
                                        placeholder={`Ask PAI… @ to attach card data`}
                                        className="w-full bg-background-app border border-border-default rounded-xl pl-4 pr-16 py-2.5 text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                if (isVoiceMode && voiceStatus === 'speaking') {
                                                    skipTts();
                                                } else {
                                                    toggleVoiceMode(!isVoiceMode);
                                                }
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors relative overflow-hidden ${
                                                isVoiceMode 
                                                    ? voiceStatus === 'speaking'
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                        : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' 
                                                    : 'text-text-tertiary hover:bg-background-elevated hover:text-text-primary'
                                            }`}
                                            title={isVoiceMode && voiceStatus === 'speaking' ? 'Click to skip AI response' : isVoiceMode ? 'Disable Voice Mode' : 'Enable Voice Mode'}
                                        >
                                            {isVoiceMode ? (
                                                voiceStatus === 'listening' ? <Mic className="w-3.5 h-3.5 animate-pulse" /> :
                                                voiceStatus === 'processing' ? (
                                                    <>
                                                        <Sparkles className="w-3.5 h-3.5 z-10 relative animate-pulse" />
                                                        <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                                                    </>
                                                ) :
                                                voiceStatus === 'speaking' ? (
                                                    <>
                                                        <Volume2 className="w-3.5 h-3.5 z-10 relative" />
                                                        <div className="absolute inset-0 bg-orange-600/50 animate-pulse"></div>
                                                    </>
                                                ) :
                                                <Mic className="w-3.5 h-3.5" />
                                            ) : (
                                                <MicOff className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button type="submit" disabled={isGenerating || !message.trim()} className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {/* Attached card badges */}
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
