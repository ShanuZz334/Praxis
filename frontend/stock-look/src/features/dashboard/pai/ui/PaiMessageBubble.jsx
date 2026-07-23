import React, { useState } from 'react';
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, Check, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PaiMessageBubble({ role, content, onRegenerate, provider, model, latencyMs }) {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);

    let displayModel = model;
    if (displayModel && displayModel.includes('/')) {
        displayModel = displayModel.split('/').pop();
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex w-full mb-4 px-4 md:px-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
                
                {/* Avatar for PAI only */}
                {!isUser && (
                    <div className="shrink-0 flex items-start mt-1">
                        <img 
                            src="/images/pai-profile.png" 
                            alt="Praxis AI"
                            className="w-7 h-7 rounded-full object-cover shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-black"
                        />
                    </div>
                )}

                {/* Message Container */}
                <div className="flex flex-col gap-1 min-w-0">
                    {/* Message Bubble */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        isUser 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-background-tooltip border border-border-default/50 text-text-primary rounded-tl-sm shadow-md'
                    }`}>
                        {!isUser && (
                            <div className="flex items-center gap-2 mb-1.5 h-5">
                                <div className="font-bold text-[11px] text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                                    Praxis AI
                                </div>
                                {displayModel && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-[9px] text-text-tertiary px-2 py-0.5 rounded-full bg-background-elevated/50 border border-border-default/30 font-mono">
                                        <Cpu size={10} className="text-blue-400/70" />
                                        <span>{displayModel}</span>
                                        {latencyMs && <span className="text-text-tertiary/50">({latencyMs}ms)</span>}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={`text-[14px] leading-relaxed break-words ${isUser ? 'whitespace-pre-wrap' : 'prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 max-w-none'}`}>
                            {isUser ? (
                                content
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>

                    {/* AI Action Toolbar (Hidden by default, shown on group hover) */}
                    {!isUser && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
                            <button 
                                onClick={handleCopy}
                                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-background-surface rounded-md transition-colors"
                                title="Copy"
                            >
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            {onRegenerate && (
                                <button 
                                    onClick={onRegenerate}
                                    className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-background-surface rounded-md transition-colors"
                                    title="Regenerate"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                            <div className="w-px h-3 bg-border-default/50 mx-1" />
                            <button className="p-1.5 text-text-tertiary hover:text-green-500 hover:bg-green-500/10 rounded-md transition-colors" title="Good Response">
                                <ThumbsUp size={14} />
                            </button>
                            <button className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Bad Response">
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}
