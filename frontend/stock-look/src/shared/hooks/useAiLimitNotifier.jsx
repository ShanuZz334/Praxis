/**
 * @file useAiLimitNotifier.jsx
 * @purpose Proactively monitors AI Gateway providers and models quota limits,
 *          triggering high/critical alerts in the system notification inbox
 *          and desktop toast alerts whenever limits are almost reached (<=20%) or reached (exhausted/429).
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import socket from '@/shared/utils/socket';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useNotificationStore } from '@/shared/context/NotificationContext';

export function useAiLimitNotifier() {
    const { addNotification, notifications } = useNotificationStore();
    const notifiedKeysRef = useRef(new Set());
    const isInitialMount = useRef(true);

    // Seed existing notification IDs so page refresh never re-spams toasts
    useEffect(() => {
        if (isInitialMount.current && Array.isArray(notifications)) {
            notifications.forEach(n => {
                if (n.id) notifiedKeysRef.current.add(n.id);
            });
            isInitialMount.current = false;
        }
    }, [notifications]);

    const emitAlert = useCallback(({ id, title, description, priority, metadata, toastType }) => {
        if (notifiedKeysRef.current.has(id)) return;
        notifiedKeysRef.current.add(id);

        addNotification({
            id,
            title,
            description,
            priority,
            category: 'alerts',
            metadata,
            timestamp: new Date().toISOString()
        });

        if (toastType === 'critical') {
            toast.error(title, {
                id,
                description,
                duration: 8000,
                position: 'top-right'
            });
        } else if (toastType === 'warning') {
            toast.warning(title, {
                id,
                description,
                duration: 7000,
                position: 'top-right'
            });
        }
    }, [addNotification]);

    const evaluateLimits = useCallback(async () => {
        try {
            // Do not run background AI checks when unauthenticated or on login/signup pages
            const path = window.location.pathname;
            const token = localStorage.getItem('token');
            if (!token || path === '/login' || path === '/signup' || path === '/register') {
                return;
            }

            // Fetch gateway provider headers and model quotas in parallel
            const [gatewayRes, quotasRes] = await Promise.allSettled([
                axiosInstance.get('/api/v1/gateway/status'),
                axiosInstance.get('/api/v1/ai-settings/quotas')
            ]);

            const now = Date.now();
            const todayStr = new Date().toISOString().split('T')[0];

            // 1. Evaluate Providers
            if (gatewayRes.status === 'fulfilled' && gatewayRes.value?.data?.providers) {
                const providers = Object.values(gatewayRes.value.data.providers);

                providers.forEach(p => {
                    // Skip local ollama or inactive providers
                    if (!p || p.id === 'ollama' || p.status === 'Offline') return;

                    const pName = p.name || p.id.toUpperCase();
                    const resetKey = p.resetTimestamp 
                        ? Math.floor(p.resetTimestamp / (15 * 60 * 1000)) 
                        : todayStr;

                    const isExhausted = p.status === 'Exhausted' || 
                                        p.healthStatus === 'exhausted' || 
                                        (p.remainingRequests !== 'Unlimited' && typeof p.remainingRequests === 'number' && p.remainingRequests <= 0) ||
                                        (typeof p.requestsPercent === 'number' && p.requestsPercent <= 0);

                    const isLowQuota = !isExhausted && 
                                       p.remainingRequests !== 'Unlimited' && 
                                       typeof p.requestsPercent === 'number' && 
                                       p.requestsPercent <= 20 && 
                                       p.requestsPercent > 0;

                    if (isExhausted) {
                        const alertId = `ai_prov_exhausted_${p.id}_${resetKey}`;
                        emitAlert({
                            id: alertId,
                            title: `Quota Exhausted: ${pName}`,
                            description: `${pName} rate limit has been reached (0 requests left). AI Gateway is routing queries to fallback providers. Resets in ${p.resetCountdown || 'next cycle'}.`,
                            priority: 'critical',
                            metadata: {
                                Provider: pName,
                                Status: 'Exhausted',
                                Remaining: '0 requests',
                                Limit: String(p.limitRequests || 'Default'),
                                ResetsIn: p.resetCountdown || 'Scheduled Reset'
                            },
                            toastType: 'critical'
                        });
                    } else if (isLowQuota) {
                        const alertId = `ai_prov_low_${p.id}_${resetKey}`;
                        emitAlert({
                            id: alertId,
                            title: `Low Quota Warning: ${pName}`,
                            description: `${pName} limit is almost reached (${p.remainingRequests} / ${p.limitRequests} requests left, ${Math.round(p.requestsPercent)}% capacity remaining). Resets in ${p.resetCountdown || 'next cycle'}.`,
                            priority: 'high',
                            metadata: {
                                Provider: pName,
                                Status: 'Low Quota',
                                Remaining: `${p.remainingRequests} / ${p.limitRequests}`,
                                Capacity: `${Math.round(p.requestsPercent)}% left`,
                                ResetsIn: p.resetCountdown || 'Scheduled Reset'
                            },
                            toastType: 'warning'
                        });
                    }
                });
            }

            // 2. Evaluate Models
            if (quotasRes.status === 'fulfilled' && quotasRes.value?.data?.quotas) {
                const quotasMap = quotasRes.value.data.quotas;

                Object.values(quotasMap).forEach(m => {
                    if (!m || m.providerId === 'ollama' || m.limitRequests === 'Unlimited (Local)') return;

                    const resetKey = m.resetTimestamp 
                        ? Math.floor(m.resetTimestamp / (15 * 60 * 1000)) 
                        : todayStr;

                    if (typeof m.remainingRequests === 'number') {
                        const isExhausted = m.remainingRequests <= 0 || m.remainingPercent <= 0;
                        const isLow = !isExhausted && m.remainingPercent <= 20 && m.remainingPercent > 0;

                        if (isExhausted) {
                            const alertId = `ai_model_exhausted_${m.providerId}_${m.modelId}_${resetKey}`;
                            emitAlert({
                                id: alertId,
                                title: `Model Limit Reached: ${m.modelId}`,
                                description: `Model ${m.modelId} (${m.providerId}) allocation reached for this window (${m.requestsToday} requests logged today). Resets in ${m.resetTimeStr || 'next reset'}.`,
                                priority: 'critical',
                                metadata: {
                                    Model: m.modelId,
                                    Provider: m.providerId.toUpperCase(),
                                    RequestsToday: String(m.requestsToday || 0),
                                    Status: 'Exhausted',
                                    ResetsIn: m.resetTimeStr || 'Scheduled'
                                },
                                toastType: 'critical'
                            });
                        } else if (isLow) {
                            const alertId = `ai_model_low_${m.providerId}_${m.modelId}_${resetKey}`;
                            emitAlert({
                                id: alertId,
                                title: `Model Quota Warning: ${m.modelId}`,
                                description: `Model ${m.modelId} (${m.providerId}) is almost reached (${m.remainingRequests} / ${m.limitRequests} left, ${m.remainingPercent}% capacity remaining). Resets in ${m.resetTimeStr || 'next reset'}.`,
                                priority: 'high',
                                metadata: {
                                    Model: m.modelId,
                                    Provider: m.providerId.toUpperCase(),
                                    Remaining: `${m.remainingRequests} / ${m.limitRequests}`,
                                    Capacity: `${m.remainingPercent}% left`,
                                    ResetsIn: m.resetTimeStr || 'Scheduled'
                                },
                                toastType: 'warning'
                            });
                        }
                    }
                });
            }
        } catch (err) {
            console.warn('[useAiLimitNotifier] Evaluation warning:', err.message);
        }
    }, [emitAlert]);

    useEffect(() => {
        let isMounted = true;

        // Run evaluation on mount
        evaluateLimits();

        // Real-time WebSocket push listener for rate limits and quota alerts
        const handleLimitAlert = (data) => {
            if (!isMounted || !data) return;

            const pName = data.name || data.providerId?.toUpperCase() || 'AI Provider';
            const alertId = `ai_ws_limit_${data.providerId}_${Math.floor(Date.now() / 60000)}`;

            if (data.type === 'reached') {
                emitAlert({
                    id: alertId,
                    title: `Quota Exhausted: ${pName}`,
                    description: data.message || `${pName} rate limit (429) hit. Traffic routed to fallback model.`,
                    priority: 'critical',
                    metadata: {
                        Provider: pName,
                        Status: 'Rate Limited (429)',
                        Reason: data.message || 'Exceeded provider inference allowance'
                    },
                    toastType: 'critical'
                });
            } else if (data.type === 'almost_reached') {
                emitAlert({
                    id: alertId,
                    title: `Low Quota Warning: ${pName}`,
                    description: `${pName} is down to ${data.remainingRequests} requests (${data.percent}% capacity).`,
                    priority: 'high',
                    metadata: {
                        Provider: pName,
                        Status: 'Low Quota',
                        Remaining: `${data.remainingRequests} requests`,
                        Capacity: `${data.percent}% left`
                    },
                    toastType: 'warning'
                });
            }

            // Also trigger a full refresh of limits
            evaluateLimits();
        };

        socket.on('ai:limit_alert', handleLimitAlert);

        // Polling interval: every 30 seconds
        const intervalId = setInterval(() => {
            if (isMounted) evaluateLimits();
        }, 30000);

        return () => {
            isMounted = false;
            socket.off('ai:limit_alert', handleLimitAlert);
            clearInterval(intervalId);
        };
    }, [evaluateLimits, emitAlert]);
}
