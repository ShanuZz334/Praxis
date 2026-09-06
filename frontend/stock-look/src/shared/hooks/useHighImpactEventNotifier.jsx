/**
 * @file useHighImpactEventNotifier.jsx
 * @purpose Global hook that listens for newly processed market events via WebSocket
 *          and fires a rich custom toast notification when an event's score
 *          exceeds the HIGH_IMPACT_THRESHOLD. Works on every page.
 *
 * @architecture
 *   - Subscribes to the "events:updated" socket broadcast globally.
 *   - Tracks a watermark (the latest event ID seen) in a ref so it only fires
 *     on truly NEW events, not on the initial load or refetches.
 *   - Applies the TTL expiry check (same as EventsPage) before scoring.
 *   - Uses sonner's `toast.custom()` to render the `EventAlertToast` component.
 *   - The toast is `pauseOnHover` by default in sonner so no extra config needed.
 *
 * @rule5_compliance No business logic duplication. Reuses getDisplayScore and
 *   getColorMap directly from eventsEngine.
 */

import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import socket from '@/shared/utils/socket';
import { getDisplayScore, getColorMap } from '@/shared/global/logic/eventsEngine';
import EventAlertToast from '@/shared/components/ui/EventAlertToast';

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLD: Absolute score required to fire a global alert.
// Internal scale is ±100. Display scale ÷10.
// 65 internal → 6.5/10 display — clearly significant, not spammy.
// ─────────────────────────────────────────────────────────────────────────────
const HIGH_IMPACT_THRESHOLD = 65;

export function useHighImpactEventNotifier() {
    // Tracks the set of event IDs seen since mount.
    // Using a ref so it never triggers re-renders.
    const seenIds = useRef(new Set());
    // Flag: skip the very first broadcast (initial full load on page open)
    const isFirstBroadcast = useRef(true);

    useEffect(() => {
        const handleEventsUpdated = (updatedEvents) => {
            if (!Array.isArray(updatedEvents) || updatedEvents.length === 0) return;

            // Seed the seen set on first broadcast (initial page load), don't alert
            if (isFirstBroadcast.current) {
                updatedEvents.forEach(ev => seenIds.current.add(ev.id));
                isFirstBroadcast.current = false;
                return;
            }

            // Find events that are genuinely new
            const newEvents = updatedEvents.filter(ev => !seenIds.current.has(ev.id));

            // Register all new IDs so we don't re-alert
            newEvents.forEach(ev => seenIds.current.add(ev.id));

            // Filter: only live (non-expired) events
            const liveNewEvents = newEvents.filter(ev => {
                const date = ev.published_time ? new Date(ev.published_time) : new Date(ev.created_at || Date.now());
                const diffMins = Math.floor((new Date() - date) / 60000);
                const ttlMins = (Number(ev.ttl_hours) || 72) * 60;
                return diffMins < ttlMins;
            });

            // Filter: high-impact only
            const highImpactEvents = liveNewEvents.filter(ev => {
                return Math.abs(Number(ev.event_score) || 0) >= HIGH_IMPACT_THRESHOLD;
            });

            // Fire one toast per high-impact event, staggered slightly so they don't
            // all slam in at once if multiple arrive in one broadcast batch.
            highImpactEvents.forEach((ev, index) => {
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
                            id:       `event-alert-${ev.id}`,
                            duration: 6000,  // 6 seconds auto-dismiss; pauses on hover
                            position: 'top-right',
                        }
                    );
                }, index * 600);
            });
        };

        socket.on('events:updated', handleEventsUpdated);
        return () => socket.off('events:updated', handleEventsUpdated);
    }, []);
}
