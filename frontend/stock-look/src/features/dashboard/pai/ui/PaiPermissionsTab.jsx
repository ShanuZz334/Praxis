import React, { useState } from 'react';
import { ShieldAlert, Database, Globe, Briefcase, Key } from 'lucide-react';
import { UniversalToggle } from '@/components/ui/universal-toggle';

export default function PaiPermissionsTab() {
    const [permissions, setPermissions] = useState({
        readPortfolio: true,
        readWatchlists: true,
        readWallet: false,
        writeTrades: false,
        writeJournal: true,
        networkAccess: true,
    });

    const togglePermission = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const ToggleRow = ({ title, desc, icon: Icon, stateKey, colorClass }) => (
        <div className="flex items-center justify-between p-4 bg-background-surface/30 border border-border-default/30 rounded-xl hover:bg-background-surface/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-background-elevated ${colorClass}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <h4 className="text-[14px] font-semibold text-text-primary">{title}</h4>
                    <p className="text-[12px] text-text-tertiary mt-0.5">{desc}</p>
                </div>
            </div>
            <UniversalToggle 
                checked={permissions[stateKey]} 
                onChange={() => togglePermission(stateKey)} 
            />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">AI Permissions</h2>
                <p className="text-[13px] text-text-tertiary">Control exactly what data PAI can access and what actions it can execute.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                
                {/* Read Access */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={18} className="text-blue-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Read Access</h3>
                    </div>
                    <div className="space-y-3">
                        <ToggleRow 
                            title="Portfolio Data" 
                            desc="Allow AI to analyze your current holdings and positions."
                            icon={Briefcase}
                            stateKey="readPortfolio"
                            colorClass="text-blue-500"
                        />
                        <ToggleRow 
                            title="Watchlists" 
                            desc="Allow AI to view stocks saved to your active watchlists."
                            icon={Database}
                            stateKey="readWatchlists"
                            colorClass="text-emerald-500"
                        />
                        <ToggleRow 
                            title="Wallet & Balances" 
                            desc="Allow AI to view your total cash balances and margins."
                            icon={Key}
                            stateKey="readWallet"
                            colorClass="text-orange-500"
                        />
                    </div>
                </div>

                {/* Write Access */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert size={18} className="text-red-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Write / Execution Access</h3>
                    </div>
                    <div className="space-y-3">
                        <ToggleRow 
                            title="Execute Trades" 
                            desc="WARNING: Allows AI to place live market orders on your behalf."
                            icon={ShieldAlert}
                            stateKey="writeTrades"
                            colorClass="text-red-500"
                        />
                        <ToggleRow 
                            title="Manage Journal" 
                            desc="Allow AI to create and edit entries in your trading journal."
                            icon={Briefcase}
                            stateKey="writeJournal"
                            colorClass="text-purple-500"
                        />
                    </div>
                </div>

                {/* Network Access */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe size={18} className="text-teal-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Network Features</h3>
                    </div>
                    <div className="space-y-3">
                        <ToggleRow 
                            title="Web Browsing" 
                            desc="Allow AI to search the internet for live news and external stock data."
                            icon={Globe}
                            stateKey="networkAccess"
                            colorClass="text-teal-500"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
