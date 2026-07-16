import React, { useState, useRef, useEffect } from 'react';

/**
 * A standard, reusable premium custom dropdown inspired by the Uiverse aesthetic.
 * Fully adapts to Tailwind Light/Dark mode variables.
 */
export default function UiverseDropdown({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...",
    className = "" 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        opt.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={containerRef} className={`relative w-full md:w-auto min-w-[120px] ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full h-8 flex items-center justify-between px-3 rounded-md
                    bg-background-surface/30 hover:bg-background-surface/60 transition-colors
                    border border-border-default/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                    text-xs text-text-primary shadow-sm
                `}
            >
                <span className={selectedOption ? "text-text-primary" : "text-text-tertiary"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg 
                    className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-background-tooltip/95 backdrop-blur-2xl border border-border-default rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px]">
                    <div className="p-2 border-b border-border-default/50 sticky top-0 bg-background-tooltip/95 z-10">
                        <input
                            type="text"
                            className="w-full bg-background-surface/50 border border-border-default/50 rounded-md px-3 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-text-tertiary italic">No options</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`
                                        w-full text-left px-3 py-1.5 text-xs transition-colors
                                        hover:bg-background-surface/80
                                        ${value === opt.value ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-text-primary'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
