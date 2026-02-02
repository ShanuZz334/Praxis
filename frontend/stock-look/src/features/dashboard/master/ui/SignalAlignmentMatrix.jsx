import React from "react";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  MessageCircle,
  Clock
} from "lucide-react";
import Card from "@/shared/components/common/Card";

export default function SignalAlignmentMatrix({ alerts }) {
  if (!alerts?.length) return null;

  return (
    <Card className="h-full max-h-[360px] flex flex-col min-h-0 overflow-hidden p-0">
      {/* Header */}
      <div className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 border-b border-border-subtle">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 md:gap-2">
            <MessageCircle size={12} className="text-accent-primary" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-primary">
              AI Insights
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-text-tertiary italic">Live Feed</span>
        </div>
      </div>

      {/* Scroll Area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 md:px-4 py-2 md:py-3 space-y-2 md:space-y-3"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {alerts.map(item => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}


/* ----------------------------------------------------
   Individual Insight Card
---------------------------------------------------- */

function InsightCard({ item }) {
  let Icon = Info;
  let colorClass = "text-accent-primary";
  let bgClass = "bg-blue-500/10 border-blue-500/20";
  let title = "System Notice";

  if (item.type === "warning") {
    Icon = AlertTriangle;
    colorClass = "text-state-bearish-text";
    bgClass = "bg-state-bearish-surface border-red-500/20";
    title = "Risk Alert";
  } else if (item.type === "tip") {
    Icon = Lightbulb;
    colorClass = "text-amber-600 dark:text-amber-400";
    bgClass = "bg-amber-500/10 border-amber-500/20";
    title = "Pro Tip";
  } else if (item.type === "social") {
    Icon = MessageCircle;
    colorClass = "text-state-bullish-text";
    bgClass = "bg-state-bullish-surface border-emerald-500/20";
    title = "Market Chatter";
  }

  return (
    <div className="p-3 rounded-xl border border-border-subtle bg-background-elevated hover:bg-background-subtle transition-colors">
      {/* Label Row */}
      <div className="flex justify-between items-start mb-1.5">
        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${bgClass} ${colorClass}`}>
          <Icon size={10} />
          <span className="text-[9px] font-bold uppercase tracking-wide">
            {title}
          </span>
        </div>

        {item.time && (
          <div className="flex items-center gap-1 text-[9px] text-text-tertiary">
            <Clock size={8} />
            <span>{item.time}</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="text-xs text-text-secondary leading-relaxed font-medium pl-1">
        {item.text}
      </div>
    </div>
  );
}
