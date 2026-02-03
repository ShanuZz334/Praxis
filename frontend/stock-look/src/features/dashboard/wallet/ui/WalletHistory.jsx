/**
 * @file WalletHistory.jsx
 * @purpose Ledger of wallet events and audit trail.
 * @responsibilities
 * - Lists chronological wallet events (e.g., "Margin Call Warning", "Deposit").
 * - Collapsible implementation.
 * @key_exports
 * - WalletHistory (Default)
 * @dependencies
 * - None (Pure UI)
 * @lifecycle
 * - Rendered by WalletPage (Future/Expanded).
 * @date 2026-02-03
 */

import React, { useState } from "react";

export default function WalletHistory({ history }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-background-card-primary border border-border-subtle-translucent rounded-2xl overflow-hidden shadow-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
            >
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Wallet Logs & Audit Trail</span>
                <span className="text-white/40 text-xs">{isOpen ? 'Collapse' : 'Expand'}</span>
            </button>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-white/5 bg-black/20">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-white/30 uppercase">
                                <th className="pb-2 pl-2">Time</th>
                                <th className="pb-2">Event</th>
                                <th className="pb-2">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((item, i) => (
                                <tr key={i} className="text-xs text-white/70">
                                    <td className="py-2 pl-2 font-mono text-white/40">{item.time}</td>
                                    <td className="py-2 font-semibold text-blue-200">{item.event}</td>
                                    <td className="py-2">{item.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
