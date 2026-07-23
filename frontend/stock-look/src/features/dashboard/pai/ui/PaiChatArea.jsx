import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Settings, Sun, Moon, Square, AtSign } from 'lucide-react';
import PaiMessageBubble from './PaiMessageBubble';
import { useTheme } from '@/shared/context/ThemeContext';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import PaiLoader from './PaiLoader';
import MentionSuggestionDropdown from '@/shared/components/ui/MentionSuggestionDropdown';
import { useMentions, inferPageFromChatId } from '@/shared/hooks/useMentions';

import paiLogoLightCenter from '@/assets/images/icon 2-Photoroom.png';
import paiLogoDarkCenter from '@/assets/images/icon 4-Photoroom.png';
import axiosInstance from '@/shared/utils/axiosInstance';

export default function PaiChatArea({ activeChatId, chatTitle, chatType, refreshTrigger }) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('llama3');
    const [isGenerating, setIsGenerating] = useState(false);
    const bottomRef = useRef(null);
    const generationTimeoutRef = useRef(null);
    const textareaRef = useRef(null);

    // Infer page scope from the active chat's registry entry — registry-driven, zero prefix guessing
    const scopePageId = inferPageFromChatId(activeChatId);

    // @mention hook
    const mentions = useMentions(scopePageId);

    // Fetch messages when chat changes (or refresh is triggered)
    useEffect(() => {
        let isMounted = true;
        if (activeChatId) {
            const fetchHistory = async () => {
                try {
                    const scope = chatType === 'header' ? 'page' : 'card';
                    const res = await axiosInstance.get(`/api/v1/ai-prompts/thread/${activeChatId}`, { params: { scope } });
                    if (isMounted && res.data?.entries) {
                        setMessages(res.data.entries.map((m, i) => ({
                            id: i,
                            role: m.role === 'assistant' ? 'ai' : m.role,
                            content: m.content
                        })));
                    }
                } catch (err) {
                    console.error("Failed to fetch chat history:", err);
                    if (isMounted) setMessages([]);
                }
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
        return () => { isMounted = false; };
    }, [activeChatId, refreshTrigger, chatType]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isGenerating]);

    const handleStop = () => {
        if (generationTimeoutRef.current) clearTimeout(generationTimeoutRef.current);
        setIsGenerating(false);
    };

    const handleSend = async (e) => {
        e?.preventDefault();

        if (isGenerating) { handleStop(); return; }
        if (!input.trim() || !activeChatId) return;

        // Parse and resolve all @mentions from the final message text
        const { cleanText, cardSnapshots } = mentions.parseAndResolveAll(input);
        mentions.closeMentions();

        const newMsg = {
            id: Date.now(),
            role: 'user',
            content: input, // show original text with @mentions to user
            cardSnapshots: cardSnapshots.length > 0 ? cardSnapshots : undefined,
        };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsGenerating(true);

        try {
            const scope = chatType === 'header' ? 'page' : 'card';
            const res = await axiosInstance.post(`/api/v1/ai-prompts/chat/${activeChatId}`, {
                message: cleanText,
                scope,
                // Pass card snapshots so backend prepends [Live Card Data from Dashboard] block
                cardSnapshots: cardSnapshots.length > 0 ? cardSnapshots : undefined,
            });

            if (res.data?.message) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'ai',
                    content: res.data.message
                }]);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: "Sorry, I encountered an error connecting to the AI Gateway."
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        mentions.handleInputChange(val, e.target.selectionStart);
    };

    const handleKeyDown = (e) => {
        // Let mention hook intercept ↑↓ Enter Esc when dropdown is open
        const consumed = mentions.handleKeyDown(e, input, (candidate, newText) => {
            setInput(newText);
            // Restore focus and move cursor to end
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = newText.length;
                    textareaRef.current.selectionEnd = newText.length;
                }
            }, 0);
        });
        if (consumed) { e.preventDefault(); return; }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating) handleSend(e);
        }
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
                                No messages yet. Type <span className="mx-1 font-mono text-blue-400">@</span> to attach live card data.
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id}>
                                    <PaiMessageBubble
                                        role={msg.role}
                                        content={msg.content}
                                        onRegenerate={msg.role === 'ai' ? () => console.log('Regenerating...', msg.id) : undefined}
                                    />
                                    {/* Show attached card badges under user messages */}
                                    {msg.role === 'user' && msg.cardSnapshots?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 px-5 pb-2 justify-end">
                                            {msg.cardSnapshots.map(s => {
                                                const live = s.hasLiveData !== false; // true when data was populated
                                                return (
                                                    <span
                                                        key={s.cardId}
                                                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                                            live
                                                                ? 'border-blue-500/20 bg-blue-500/8 text-blue-500 dark:text-blue-400'
                                                                : 'border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400'
                                                        }`}
                                                        title={live
                                                            ? `${s.displayName}: ${s.value ?? '--'} | Score: ${s.score ?? '--'}`
                                                            : `${s.displayName}: No live data — this page may not be open. AI received N/A.`
                                                        }
                                                    >
                                                        <AtSign size={8} />
                                                        {s.displayName}
                                                        {live && s.score != null && (
                                                            <span className="text-blue-400/60">{s.score}</span>
                                                        )}
                                                        {!live && (
                                                            <span className="text-amber-500/80">⚠</span>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {isGenerating && <PaiLoader />}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background-app via-background-app to-transparent pt-10 pb-6 px-4 md:px-8">
                        <div className="max-w-4xl mx-auto pr-16 md:pr-32">
                            {/* @mention dropdown — rendered above the form */}
                            <div className="relative">
                                {mentions.isOpen && (
                                    <MentionSuggestionDropdown
                                        suggestions={mentions.suggestions}
                                        highlightedIndex={mentions.highlightedIndex}
                                        query={mentions.mentionQuery}
                                        onHighlightChange={mentions.setHighlightedIndex}
                                        onSelect={(candidate) => {
                                            const newText = mentions.selectMention(candidate, input);
                                            setInput(newText);
                                            setTimeout(() => textareaRef.current?.focus(), 0);
                                        }}
                                        onClose={mentions.closeMentions}
                                    />
                                )}
                                <form
                                    onSubmit={handleSend}
                                    className="relative flex items-end bg-background-tooltip border border-border-default rounded-xl shadow-lg focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow overflow-hidden"
                                >
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isGenerating ? 'AI is typing...' : `Message PAI… type @ to attach card data`}
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
