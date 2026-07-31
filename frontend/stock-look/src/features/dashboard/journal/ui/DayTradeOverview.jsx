import React from 'react';
import { useDayTrades } from '../data/useDayTrades';
import { TrendingUp, TrendingDown, Clock, Tag } from 'lucide-react';

export function DayTradeOverview({ date }) {
  const { trades = [], loading, error } = useDayTrades(date);

  if (loading) {
    return <div className="p-4 text-text-secondary animate-pulse bg-background-card rounded-lg border border-border-default">Loading trades...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">Error loading trades: {error.message}</div>;
  }

  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-background-card rounded-xl border border-border-default shadow-sm">
        <Clock className="w-10 h-10 text-text-tertiary mb-3 opacity-50" />
        <p className="text-text-secondary font-medium">No trades recorded for this day</p>
      </div>
    );
  }

  const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const winningTrades = trades.filter(t => Number(t.pnl) > 0).length;
  const winRate = ((winningTrades / trades.length) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">Day Trades</h3>
      <div className="grid gap-3">
        {trades.map((trade, i) => (
          <div key={trade.id || i} className="p-4 bg-background-card border border-border-default rounded-xl shadow-sm hover:border-border-hover transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-text-primary">{trade.instrument}</span>
                {trade.strategy && (
                  <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 text-text-secondary rounded-full flex items-center font-medium">
                    <Tag className="w-3 h-3 mr-1" />
                    {trade.strategy}
                  </span>
                )}
              </div>
              <span className={`font-semibold flex items-center ${Number(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Number(trade.pnl) >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                ${Math.abs(Number(trade.pnl)).toFixed(2)}
              </span>
            </div>
            <div className="flex text-sm text-text-tertiary space-x-6">
              <div>Entry: <span className="text-text-secondary font-medium">${trade.entryPrice}</span></div>
              <div>Exit: <span className="text-text-secondary font-medium">${trade.exitPrice}</span></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between p-5 bg-background-card rounded-xl border border-border-default mt-4 shadow-sm">
        <div>
          <div className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
        </div>
      </div>
    </div>
  );
}
