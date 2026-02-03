/**
 * @file ManualSectionLayout.jsx
 * @purpose The split-view layout for browsing specific manual sections (e.g., Technical, Fundamental).
 * @responsibilities
 * - Displays a list of topics on the left (searchable).
 * - Displays the detailed content of the selected topic on the right.
 * - Handles navigation back to the main Manual Dashboard.
 * @key_exports
 * - ManualSectionLayout (Default Component)
 * @dependencies
 * - React, useState, useMemo
 * - react-router-dom (useParams, useNavigate)
 * - lucide-react (Icons)
 * - manualData (Content Source)
 * - TopicDetail (Right Pane)
 * @lifecycle
 * - Rendered when navigating to /dashboard/manual/:section
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, ChevronRight } from "lucide-react";
import { MANUAL_CONTENT, MANUAL_SECTIONS } from "../data/manualData";
import TopicDetail from "./TopicDetail";

// =============================
// Main Component
// =============================

export default function ManualSectionLayout() {
    const { section } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState(null);

    // --- Data Retrieval ---
    const sectionData = MANUAL_CONTENT[section];
    const sectionMeta = MANUAL_SECTIONS.find(s => s.id === section);

    // --- Filter Logic ---
    const filteredTopics = useMemo(() => {
        if (!sectionData) return [];
        return sectionData.topics.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sectionData, searchQuery]);

    const activeTopic = sectionData?.topics.find(t => t.id === selectedTopicId);

    // --- Render Guard ---
    if (!sectionData) {
        return <div className="p-8 text-text-primary">Section Not Found</div>;
    }

    return (
        <div className="h-screen flex flex-col p-4 md:p-6 overflow-hidden max-w-[1920px] mx-auto animate-in fade-in duration-500">

            {/* Header Bar */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <button
                    onClick={() => navigate('/dashboard/manual')}
                    className="p-2 rounded-lg bg-background-surface hover:bg-background-elevated text-text-secondary hover:text-text-primary transition-colors border border-border-default shadow-sm active:scale-95"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-text-primary flex items-center gap-3">
                        {sectionMeta?.icon && <sectionMeta.icon className="w-6 h-6 text-blue-500" />}
                        <span className="hidden md:inline opacity-50 font-normal">Manual /</span>
                        {sectionData.title}
                    </h1>
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">

                {/* LEFT: Search & List (Mobile: Top Half, Desktop: Left Side) */}
                <div className="w-full md:w-5/12 lg:w-4/12 flex flex-col h-[45%] md:h-full min-h-0 bg-background-card border border-border-default rounded-xl overflow-hidden shrink-0 shadow-lg">

                    {/* Search Bar */}
                    <div className="p-4 border-b border-border-default shrink-0 bg-background-elevated">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="Search metrics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background-surface border border-border-default rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 invisibleScroll space-y-3 bg-background-card">
                        {filteredTopics.map((topic) => (
                            <div
                                key={topic.id}
                                onClick={() => setSelectedTopicId(topic.id)}
                                className={`
                                    relative h-20 p-3 rounded-2xl border cursor-pointer group transition-all duration-200 overflow-hidden shrink-0
                                    ${selectedTopicId === topic.id
                                        ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_4px_12px_rgba(59,130,246,0.1)]'
                                        : 'bg-background-surface border-border-default hover:border-border-subtle shadow-sm hover:shadow-md'}
                                `}
                            >
                                {/* Inner Glow for Depth */}
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-background-surface to-transparent opacity-50" />

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[13px] font-bold ${selectedTopicId === topic.id ? 'text-blue-500' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                            {topic.title}
                                        </span>
                                        {selectedTopicId === topic.id && <ChevronRight size={14} className="text-blue-500" />}
                                    </div>
                                    <p className="text-[10px] text-text-tertiary line-clamp-2 leading-relaxed">
                                        {topic.description}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {filteredTopics.length === 0 && (
                            <div className="text-center text-text-tertiary py-8 text-sm">
                                No metrics found.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail View (Mobile: Bottom Half, Desktop: Right Side) */}
                <div className="flex-1 h-[55%] md:h-full bg-background-card border border-border-default rounded-xl p-4 md:p-8 overflow-hidden min-h-0 shadow-lg relative">
                    <TopicDetail topic={activeTopic} />
                </div>

            </div>
        </div>
    );
}
