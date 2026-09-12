/**
 * @file useHighImpactEventNotifier.jsx
 * @purpose Global hook that listens for newly processed or confirmed market events via WebSocket
 *          and fires rich custom toast notifications on whichever page the user is currently viewing.
 *
 * @architecture
 *   - Subscribes to the "events:updated" socket broadcast globally.
 *   - Seeds the seenIds watermark from /api/v1/events on mount so existing events do not trigger toasts.
 *   - Fires whenever a new event is added (manual entry or auto-processor).
 *   - Includes a 15-second polling fail-safe to guarantee alerts even if WebSocket reconnects.
 *   - Uses sonner's toast.custom() to render the EventAlertToast component.
 */

import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import socket from '@/shared/utils/socket';
import axiosInstance from '@/shared/utils/axiosInstance';
import { getDisplayScore, getColorMap } from '@/shared/global/logic/eventsEngine';
import EventAlertToast from '@/shared/components/ui/EventAlertToast';

export function useHighImpactEventNotifier() {
    // Tracks the set of event IDs seen since mount
    const seenIds = useRef(new Set());
    const isHydrated = useRef(false);

    // Helper: dispatch toast notifications for new events
    const alertNewEvents = (newEvents) => {
        if (!Array.isArray(newEvents) || newEvents.length === 0) return;

        // Filter: only live (non-expired) events
        const liveNewEvents = newEvents.filter(ev => {
            const date = ev.published_time ? new Date(ev.published_time) : new Date(ev.created_at || Date.now());
            const diffMins = Math.floor((new Date() - date) / 60000);
            const ttlMins = (Number(ev.ttl_hours) || 72) * 60;
            return diffMins < ttlMins;
        });

        if (liveNewEvents.length === 0) return;

        // Cap batch alerts at 3 most recent to avoid toast flood if bulk imported
        const eventsToAlert = liveNewEvents.slice(0, 3);

        eventsToAlert.forEach((ev, index) => {
            setTimeout(() => {
                const displayScore = getDisplayScore(ev.event_score);
                const colors = getColorMap(ev);

                toast.custom(
                    (id) => (
                        <EventAlertToast
                            event={ev}
                            displayScore={displayScore}
                            colors={colors}
                            toastId={id}
                        />
                    ),
                    {
                        id: `event-alert-${ev.id}`,
                        duration: 8000,
                        position: 'top-right',
                    }
                );
            }, index * 400);
        });
    };

    useEffect(() => {
        let isMounted = true;

        // 1. Initial hydration: record existing event IDs so we do NOT alert on past history
        const hydrateInitialEvents = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/events');
                if (!isMounted) return;
                const events = res.data?.data || [];
                events.forEach(ev => seenIds.current.add(ev.id));
                isHydrated.current = true;
            } catch (err) {
                console.warn('[EventNotifier] Initial hydration warning:', err.message);
                if (isMounted) isHydrated.current = true;
            }
        };

        hydrateInitialEvents();

        // 2. Real-time WebSocket listener: fires immediately when backend broadcasts events:updated
        const handleEventsUpdated = (updatedEvents) => {
            if (!Array.isArray(updatedEvents) || updatedEvents.length === 0) return;

            // Baseline hydration fallback if socket fires before initial REST fetch finishes
            if (!isHydrated.current) {
                updatedEvents.forEach(ev => seenIds.current.add(ev.id));
                isHydrated.current = true;
                return;
            }

            // Identify genuinely new events
            const incomingNew = updatedEvents.filter(ev => !seenIds.current.has(ev.id));
            if (incomingNew.length === 0) return;

            // Mark as seen immediately so duplicate broadcasts do not re-alert
            incomingNew.forEach(ev => seenIds.current.add(ev.id));

            // Fire toasts for new events
            alertNewEvents(incomingNew);
        };

        socket.on('events:updated', handleEventsUpdated);

        // 3. Fail-safe periodic sync every 15 seconds in case WebSocket dropped or reconnects
        const syncInterval = setInterval(async () => {
            if (!isHydrated.current) return;
            try {
                const res = await axiosInstance.get('/api/v1/events');
                if (!isMounted) return;
                const events = res.data?.data || [];
                const unseen = events.filter(ev => !seenIds.current.has(ev.id));
                if (unseen.length > 0) {
                    unseen.forEach(ev => seenIds.current.add(ev.id));
                    alertNewEvents(unseen);
                }
            } catch (syncErr) {
                // Ignore silent background sync errors
            }
        }, 15000);

        return () => {
            isMounted = false;
            socket.off('events:updated', handleEventsUpdated);
            clearInterval(syncInterval);
        };
    }, []);
}
