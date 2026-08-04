import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [activeOverrideRequest, setActiveOverrideRequest] = useState(null);
    
    // Load notifications from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('praxis_notifications');
            if (stored) {
                setNotifications(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load notifications from local storage', e);
        }
    }, []);

    // Save to local storage whenever notifications change
    useEffect(() => {
        try {
            localStorage.setItem('praxis_notifications', JSON.stringify(notifications));
        } catch (e) {
            console.error('Failed to save notifications to local storage', e);
        }
    }, [notifications]);

    const addNotification = useCallback((notification) => {
        const id = notification.id || (Date.now().toString() + Math.random().toString(36).substring(7));
        const newNotification = {
            timestamp: new Date().toISOString(),
            read: false,
            ...notification,
            id // Ensure ID is set properly
        };
        
        setNotifications(prev => {
            if (prev.some(n => n.id === id)) {
                return prev; // Don't add duplicate
            }
            return [newNotification, ...prev];
        });
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            activeOverrideRequest,
            setActiveOverrideRequest,
            addNotification,
            removeNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationStore = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationStore must be used within a NotificationProvider');
    }
    return context;
};
