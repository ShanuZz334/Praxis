import React from 'react';
import { useDayTrades } from '../data/useDayTrades';
import { TrendingUp, TrendingDown, Clock, Tag, Plus, Activity } from 'lucide-react';
import { useDashboardContext } from '@/shared/context/DashboardContext';

export function DayTradeOverview({ date }) {
  const { trades = [], loading, error } = useDayTrades(date);
  const { setGlobalOrderTicket } = useDashboardContext() || {};

  const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const winningTrades = trades.filter(t => Number(t.pnl) > 0).length;
  const losingTrades = trades.filter(t => Number(t.pnl) < 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;
  const totalVolume = trades.reduce((sum, t) => sum + (Number(t.qty) || Number(t.quantity) || 0), 0);

  return (
    <div className="bg-background-card/80 backdrop-blur-xl border border-border-default/60 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border-default/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Session Executions</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background-elevated border border-border-default text-text-tertiary">
                {trades.length} {trades.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">Filled orders & executed trading positions</p>
          </div>
        </div>

        {setGlobalOrderTicket && (
          <button
            onClick={() => setGlobalOrderTicket({ type: 'QUICK', data: {} })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order Ticket</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-text-secondary gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading session executions...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-xs text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
          Failed to load trades: {error.message}
        </div>
      ) : trades.length === 0 ? (
        <div className="py-4 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-background-elevated border border-border-default/80 flex items-center justify-center text-text-tertiary mb-2.5 shadow-inner">
            <Clock className="w-5 h-5 text-blue-400/70" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1">No Executions Logged</h4>
          <p className="text-xs text-text-secondary max-w-sm mb-4">
            Zero executed trades or broker orders were recorded for this session.
          </p>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 w-full pt-3 border-t border-border-default/30 text-left">
            <div className="p-2.5 rounded-xl bg-background-elevated/40 border border-border-default/30">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-0.5">Realized P&L</span>
              <span className="text-xs font-mono font-bold text-text-secondary">₹0.00</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background-elevated/40 border border-border-default/30">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-0.5">Executions</span>
              <span className="text-xs font-mono font-bold text-text-secondary">0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background-elevated/40 border border-border-default/30">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-0.5">Win Rate</span>
              <span className="text-xs font-mono font-bold text-text-secondary">—</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background-elevated/40 border border-border-default/30">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-0.5">Volume</span>
              <span className="text-xs font-mono font-bold text-text-secondary">0 Lots</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Performance Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-background-elevated/50 border border-border-default/50">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-1">Total Realized P&L</span>
              <div className={`text-base font-bold font-mono flex items-center ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-1">Win Rate</span>
              <div className="text-base font-bold font-mono text-blue-400">{winRate}%</div>
              <div className="text-[10px] text-text-tertiary">{winningTrades}W / {losingTrades}L</div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-1">Total Executions</span>
              <div className="text-base font-bold font-mono text-text-primary">{trades.length}</div>
              <div className="text-[10px] text-text-tertiary">Filled Orders</div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-tertiary block mb-1">Total Quantity</span>
              <div className="text-base font-bold font-mono text-text-primary">{totalVolume > 0 ? totalVolume : '—'}</div>
              <div className="text-[10px] text-text-tertiary">Cumulative Size</div>
            </div>
          </div>

          {/* Trade Execution List */}
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {trades.map((trade, i) => {
              const tradePnl = Number(trade.pnl || 0);
              const isWin = tradePnl >= 0;
              const side = (trade.side || trade.transaction_type || 'BUY').toUpperCase();
              const isBuy = side === 'BUY';

              return (
                <div 
                  key={trade.id || i}
                  className="p-3.5 bg-background-elevated/30 hover:bg-background-elevated/60 border border-border-default/40 hover:border-border-default rounded-xl transition-all shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {side}
                      </span>
                      <span className="font-bold text-xs text-text-primary tracking-wide">
                        {trade.instrument || trade.tradingsymbol || 'Unknown Symbol'}
                      </span>
                      {trade.strategy && (
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-text-secondary rounded-full flex items-center gap-1 font-medium">
                          <Tag className="w-2.5 h-2.5" />
                          {trade.strategy}
                        </span>
                      )}
                    </div>

                    <div className={`font-mono text-xs font-bold flex items-center ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                      {tradePnl >= 0 ? '+' : '-'}₹{Math.abs(tradePnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-border-default/20 font-mono">
                    <div className="flex items-center gap-4">
                      <span>Entry: <strong className="text-text-secondary">₹{Number(trade.entryPrice || trade.average_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                      <span>Exit: <strong className="text-text-secondary">₹{Number(trade.exitPrice || trade.last_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                      {trade.qty && <span>Qty: <strong className="text-text-secondary">{trade.qty}</strong></span>}
                    </div>
                    {trade.time && (
                      <span className="text-[10px] text-text-tertiary">{trade.time}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
