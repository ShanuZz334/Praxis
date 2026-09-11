/**
 * @file PaiCodeBlock.jsx
 * @purpose High-contrast, institutional-grade syntax-highlighted code & JSON block for PAI messages.
 * @features
 * - High-contrast obsidian surface with crystal clear readability in both light & dark mode.
 * - Native tokenized JSON syntax highlighting (sky keys, emerald strings, amber numbers, purple booleans).
 * - Terminal-style header bar with language badge and 1-click clipboard copy.
 * - Inline code component with WCAG AAA compliant contrast.
 */

import React, { useState, useMemo, memo } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * Parses and tokenizes a JSON string into syntax-colored spans
 */
function renderJsonSyntax(jsonStr) {
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    const elements = [];
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = regex.exec(jsonStr)) !== null) {
        if (match.index > lastIndex) {
            elements.push(
                <span key={`txt_${keyIdx++}`} className="text-slate-400">
                    {jsonStr.substring(lastIndex, match.index)}
                </span>
            );
        }

        const token = match[0];
        if (/^"/.test(token)) {
            if (/:$/.test(token)) {
                // Key with trailing colon
                const keyName = token.slice(0, -1);
                elements.push(
                    <span key={`key_${keyIdx++}`} className="text-sky-300 font-semibold">
                        {keyName}
                    </span>,
                    <span key={`col_${keyIdx++}`} className="text-slate-400 font-normal">
                        :
                    </span>
                );
                lastIndex = regex.lastIndex;
                continue;
            } else {
                // String value
                elements.push(
                    <span key={`str_${keyIdx++}`} className="text-emerald-300 font-normal">
                        {token}
                    </span>
                );
            }
        } else if (/true|false/.test(token)) {
            elements.push(
                <span key={`bool_${keyIdx++}`} className="text-purple-300 font-semibold">
                    {token}
                </span>
            );
        } else if (/null/.test(token)) {
            elements.push(
                <span key={`null_${keyIdx++}`} className="text-rose-400 font-semibold">
                    {token}
                </span>
            );
        } else {
            // Number
            elements.push(
                <span key={`num_${keyIdx++}`} className="text-amber-300 font-mono">
                    {token}
                </span>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < jsonStr.length) {
        elements.push(
            <span key={`txt_${keyIdx++}`} className="text-slate-400">
                {jsonStr.substring(lastIndex)}
            </span>
        );
    }

    return elements;
}

export const PaiInlineCode = memo(function PaiInlineCode({ children }) {
    return (
        <code className="px-1.5 py-0.5 mx-0.5 rounded text-[11.5px] font-mono font-medium bg-slate-200/90 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-300/80 dark:border-slate-700/60 break-words shadow-2xs">
            {children}
        </code>
    );
});

export const PaiCodeBlock = memo(function PaiCodeBlock({ className, children }) {
    const [copied, setCopied] = useState(false);

    const rawCode = useMemo(() => {
        return String(children || '').replace(/\n$/, '');
    }, [children]);

    const language = useMemo(() => {
        if (className && className.startsWith('language-')) {
            return className.replace('language-', '').toLowerCase();
        }
        // Auto-detect JSON if not explicitly passed
        const trimmed = rawCode.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch {
                // Not valid JSON
            }
        }
        return 'code';
    }, [className, rawCode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(rawCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isJson = language === 'json';

    return (
        <div className="w-full max-w-full my-3 rounded-xl border border-slate-700/60 dark:border-slate-800 bg-[#090d16] shadow-md overflow-hidden text-left">
            {/* Header bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1626] border-b border-slate-800/80 text-[11px] font-mono select-none">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Terminal size={12} className="text-sky-400" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-300">
                        {language}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Surface */}
            <div className="p-3.5 overflow-x-auto max-h-[480px]">
                <pre className="m-0 p-0 text-[12px] leading-relaxed font-mono text-slate-200 selection:bg-blue-600/40">
                    <code>
                        {isJson ? renderJsonSyntax(rawCode) : rawCode}
                    </code>
                </pre>
            </div>
        </div>
    );
});

export default PaiCodeBlock;
