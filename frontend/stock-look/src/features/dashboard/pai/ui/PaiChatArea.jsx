import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Settings, Sun, Moon, Square } from 'lucide-react';
import PaiMessageBubble from './PaiMessageBubble';
import { useTheme } from '@/shared/context/ThemeContext';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import PaiLoader from './PaiLoader';

import paiLogoLightCenter from '@/assets/images/icon 2-Photoroom.png';
import paiLogoDarkCenter from '@/assets/images/icon 4-Photoroom.png';

const MOCK_MESSAGES = [
    { id: 1, role: 'user', content: 'What are your thoughts on this indicator?' },
    { id: 2, role: 'ai', content: `Based on the current data structures, this indicator is showing a strong divergence from the sector average. The momentum oscillators are confirming this trend.

Here is a quick breakdown of the key resistance levels:
| Level | Price | Confidence |
| :--- | :---: | :---: |
| **R1** | ₹21,450 | High |
| **R2** | ₹21,600 | Medium |

I recommend watching the key resistance levels closely over the **next 48 hours**.` }
];

export default function PaiChatArea({ activeChatId, chatTitle }) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('llama3');
    const [isGenerating, setIsGenerating] = useState(false);
    const bottomRef = useRef(null);
    const generationTimeoutRef = useRef(null);

    // Reset messages when chat changes (simulate loading history)
    useEffect(() => {
        if (activeChatId) {
            setMessages(MOCK_MESSAGES);
        } else {
            setMessages([]);
        }
    }, [activeChatId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isGenerating]);

    const handleStop = () => {
        if (generationTimeoutRef.current) {
            clearTimeout(generationTimeoutRef.current);
        }
        setIsGenerating(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        
        if (isGenerating) {
            handleStop();
            return;
        }
        
        if (!input.trim() || !activeChatId) return;

        const newMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsGenerating(true);

        // Simulate AI response delay
        generationTimeoutRef.current = setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: 'This is a placeholder response for the UI mockup. Once the local LLM via Ollama is connected, real insights will stream here!'
            }]);
            setIsGenerating(false);
        }, 5000); // 5 seconds delay to allow testing the stop button
    };



    return (
        <div className="flex-1 flex flex-col bg-background-app h-full relative">
            {/* Header Sticky */}
            <div className="sticky top-0 z-10 bg-background-app/80 backdrop-blur-md border-b border-border-default/40 h-[72px] px-6 grid grid-cols-3 items-center shrink-0">
                <div className="flex justify-start">
                    <h3 className="font-bold text-text-primary tracking-wide truncate">
                        {chatTitle || 'Unknown Chat'}
                    </h3>
                </div>
                
                <div className="flex justify-center items-center h-full">
                    <img 
                        src={theme === 'dark' ? paiLogoDarkCenter : paiLogoLightCenter} 
                        alt="PAI Navbar Logo" 
                        className="h-12 w-auto object-contain opacity-90 transition-transform duration-300 hover:scale-110"
                    />
                </div>
                
                <div className="flex justify-end items-center gap-1">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-lg hover:bg-background-elevated"
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard/pai/settings')}
                        className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-lg hover:bg-background-elevated"
                        title="PAI Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {!activeChatId ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-background-app text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                        <Sparkles size={32} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-brand mb-2">Praxis AI</h2>
                    <p className="text-text-secondary max-w-md">
                        Select a chat from the sidebar to view historical insights or start a new conversation about specific indicators.
                    </p>
                </div>
            ) : (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-32">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-tertiary">
                        No messages yet.
                    </div>
                ) : (
                    messages.map(msg => (
                        <PaiMessageBubble 
                            key={msg.id} 
                            role={msg.role} 
                            content={msg.content} 
                            onRegenerate={msg.role === 'ai' ? () => console.log('Regenerating message...', msg.id) : undefined}
                        />
                    ))
                )}
                {isGenerating && <PaiLoader />}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background-app via-background-app to-transparent pt-10 pb-6 px-4 md:px-8">
                <div className="max-w-4xl mx-auto pr-16 md:pr-32">
                    <form 
                        onSubmit={handleSend}
                        className="relative flex items-end bg-background-tooltip border border-border-default rounded-xl shadow-lg focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow overflow-hidden"
                    >
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isGenerating) {
                                        handleSend(e);
                                    }
                                }
                            }}
                            placeholder={isGenerating ? 'AI is typing...' : `Message PAI about ${chatTitle}...`}
                            disabled={isGenerating}
                            className="w-full bg-transparent text-text-primary text-[13px] placeholder-slate-400 dark:placeholder-slate-400 px-3.5 py-3 max-h-[150px] min-h-[44px] resize-none outline-none custom-scrollbar disabled:opacity-50"
                            rows={1}
                        />
                        <div className="p-1.5 shrink-0 h-[44px] flex items-center">
                            <button 
                                type="button"
                                onClick={handleSend}
                                disabled={!input.trim() && !isGenerating}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-md disabled:shadow-none disabled:bg-background-elevated disabled:text-text-tertiary text-white
                                    ${isGenerating 
                                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                        : 'bg-blue-600 hover:bg-blue-500'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <Square size={12} fill="currentColor" />
                                ) : (
                                    <Send size={14} className="ml-0.5" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Model Selector Dropdown (Absolute Bottom Right) */}
                <div className="absolute bottom-6 right-4 md:right-8">
                    <UiverseDropdown 
                        options={[
                            { value: 'llama3', label: 'Llama 3' },
                            { value: 'gpt4o', label: 'GPT-4o' },
                            { value: 'claude3', label: 'Claude 3.5' }
                        ]}
                        value={selectedModel}
                        onChange={(val) => setSelectedModel(val)}
                        className="w-[140px]"
                        dropup={true}
                        hideSearch={true}
                        alignRight={true}
                        matchWidth={true}
                    />
                </div>
            </div>
            </>
        )}
    </div>
);
}
