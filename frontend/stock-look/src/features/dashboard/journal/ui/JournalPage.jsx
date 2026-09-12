import React, { useState } from "react";
import { createPortal } from "react-dom";
import JournalHeader from "./JournalHeader";
import YearCalendar from "./YearCalendar";
import { DayPanel } from "./DayPanel";
import { useJournalCalendar } from "../data/useJournalCalendar";

export default function JournalPage() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDayData, setSelectedDayData] = useState(null);
    
    // Lift calendar state to feed both Header KPIs and the Calendar Grid
    const { dayMap, loading, error } = useJournalCalendar(selectedYear);

    const handleDayClick = (dateStr, dayData) => {
        if (dayData?.state === 'holiday') return;
        setSelectedDate(dateStr);
        setSelectedDayData(dayData);
    };

    const handleNavigateDate = (newDateStr) => {
        if (!newDateStr) return;
        const newDayData = dayMap[newDateStr] || { state: 'no-trade', pnl: 0, tradesCount: 0 };
        setSelectedDate(newDateStr);
        setSelectedDayData(newDayData);
    };

    const handleClosePanel = () => {
        setSelectedDate(null);
        setSelectedDayData(null);
    };

    return (
        <div className="pb-20 animate-in fade-in duration-500 min-h-screen font-sans bg-background-default relative overflow-x-hidden">
            <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
                
                {/* Top KPI Header */}
                <JournalHeader dayMap={dayMap} />

                {/* Main Calendar View */}
                <div className="mt-8">
                    <YearCalendar 
                        year={selectedYear} 
                        dayMap={dayMap}
                        loading={loading}
                        error={error}
                        onYearChange={setSelectedYear} 
                        onDayClick={handleDayClick} 
                    />
                </div>
            </div>

            {/* Slide-in Day Panel Overlay */}
            {selectedDate && createPortal(
                <div className="fixed inset-0 z-[100] isolate">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={handleClosePanel}
                    />
                    
                    {/* Panel */}
                    <div className="fixed top-0 right-0 h-full w-full md:w-[680px] lg:w-[840px] xl:w-[920px] bg-background-app dark:bg-background-surface shadow-2xl border-l border-border-default/60 overflow-hidden animate-in slide-in-from-right duration-300">
                        <DayPanel 
                            date={selectedDate} 
                            dayData={selectedDayData} 
                            onClose={handleClosePanel} 
                            onNavigateDate={handleNavigateDate}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
