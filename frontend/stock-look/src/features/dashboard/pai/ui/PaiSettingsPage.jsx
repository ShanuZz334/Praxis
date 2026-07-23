import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Shield, MessageSquareText } from 'lucide-react';

import PaiModelsTab from './PaiModelsTab';
import PaiPermissionsTab from './PaiPermissionsTab';
import PaiPromptsTab from './PaiPromptsTab';

export default function PaiSettingsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('models');

    const TABS = [
        { id: 'models', label: 'Models & API', icon: Cpu },
        { id: 'permissions', label: 'Permissions', icon: Shield },
        { id: 'prompts', label: 'Prompts Studio', icon: MessageSquareText },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-background-app p-4 md:p-6 animate-in fade-in duration-300">
            <div className="max-w-[1400px] mx-auto space-y-4">
                
                {/* Header Section */}
                <div className="flex items-center gap-4 border-b border-border-default/40 pb-4">
                    <button 
                        onClick={() => navigate('/dashboard/pai')}
                        className="p-2 rounded-xl bg-background-surface/50 text-text-tertiary hover:text-text-primary hover:bg-background-elevated transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-text-primary">PAI Configuration</h1>
                        </div>
                        <p className="text-sm text-text-tertiary mt-1">Manage AI personality, connections, permissions, and advanced prompt engineering.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-border-default/30 pb-3 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'bg-blue-600/10 text-blue-500 shadow-sm border border-blue-500/20' 
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-background-surface/50 border border-transparent'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-2">
                    {activeTab === 'models' && <PaiModelsTab />}
                    {activeTab === 'permissions' && <PaiPermissionsTab />}
                    {activeTab === 'prompts' && <PaiPromptsTab />}
                </div>

            </div>
        </div>
    );
}
