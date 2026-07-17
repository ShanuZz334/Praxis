import React, { useState } from "react";
import PaiSidebar from "./PaiSidebar";
import PaiChatArea from "./PaiChatArea";

export default function PaiPage() {
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatTitle, setActiveChatTitle] = useState("");

    const handleSelectChat = (chatId, chatTitle) => {
        setActiveChatId(chatId);
        setActiveChatTitle(chatTitle);
    };

    return (
        <div className="fixed inset-0 z-50 flex overflow-hidden animate-in fade-in duration-300 bg-background-app">
            {/* Sidebar */}
            <PaiSidebar 
                activeChatId={activeChatId} 
                onSelectChat={handleSelectChat} 
            />
            
            {/* Main Chat Window */}
            <PaiChatArea 
                activeChatId={activeChatId} 
                chatTitle={activeChatTitle} 
            />
        </div>
    );
}
