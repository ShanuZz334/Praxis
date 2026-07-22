import React, { useState } from "react";
import PaiSidebar from "./PaiSidebar";
import PaiChatArea from "./PaiChatArea";

export default function PaiPage() {
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatTitle, setActiveChatTitle] = useState("");
    const [activeChatType, setActiveChatType] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSelectChat = (chatId, chatTitle, chatType) => {
        setActiveChatId(chatId);
        setActiveChatTitle(chatTitle);
        setActiveChatType(chatType);
    };

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
