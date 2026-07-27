import React, { useState, useCallback } from "react";
import PaiSidebar from "./PaiSidebar";
import PaiChatArea from "./PaiChatArea";

const CACHE_KEY = "pai_active_chat_session";
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

const getInitialChatState = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < FIVE_HOURS_MS) {
                return parsed;
            }
        }
    } catch (e) {}
    return { id: 'assist_global', title: 'Global Chat', type: 'manual' };
};

export default function PaiPage() {
    const [initialState] = useState(getInitialChatState);
    const [activeChatId, setActiveChatId] = useState(initialState.id);
    const [activeChatTitle, setActiveChatTitle] = useState(initialState.title);
    const [activeChatType, setActiveChatType] = useState(initialState.type);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSelectChat = useCallback((chatId, chatTitle, chatType) => {
        setActiveChatId(chatId);
        setActiveChatTitle(chatTitle);
        setActiveChatType(chatType);

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                id: chatId,
                title: chatTitle,
                type: chatType,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex overflow-hidden animate-in fade-in duration-300 bg-background-app">
            {/* Sidebar */}
            <PaiSidebar 
                activeChatId={activeChatId} 
                onSelectChat={handleSelectChat} 
                onChatCleared={() => setRefreshTrigger(k => k + 1)}
            />
            
            {/* Main Chat Window */}
            <PaiChatArea 
                activeChatId={activeChatId} 
                chatTitle={activeChatTitle} 
                chatType={activeChatType}
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
}
