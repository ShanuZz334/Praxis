import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { CalendarClock, AlertCircle } from 'lucide-react';

export default function CatalystCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/catalysts');
                if (res.data?.success) {
                    setEvents(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch catalysts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarClock className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Economic Catalysts</h3>
                </div>
                <p className="text-[11px] text-text-secondary">Loading events...</p>
            </div>
        );
    }

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Upcoming Catalysts</h3>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {events.length === 0 ? (
                    <div className="text-[10px] text-text-tertiary px-2">No upcoming catalysts scheduled</div>
                ) : events.map((event, i) => {
                    const impactColor = event.impact === 'High' ? 'text-rose-400 bg-rose-400/10 border-rose-400/30' : 
                                        event.impact === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 
                                        'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
                    
                    return (
                        <div key={i} className="flex flex-col bg-background-elevated px-3 py-2.5 rounded border border-border-subtle">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11.5px] font-bold text-text-primary">{event.title}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${impactColor}`}>
                                    {event.impact}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10.5px] text-text-secondary">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-[10px] text-text-tertiary">{event.category}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
