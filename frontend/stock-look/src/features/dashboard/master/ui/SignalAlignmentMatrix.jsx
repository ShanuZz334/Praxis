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
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/90">
              AI Insights
            </span>
          </div>
          <span className="text-[10px] text-white/30 italic">Live Feed</span>
        </div>
      </div>

      {/* Scroll Area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
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
  let colorClass = "text-blue-400";
  let bgClass = "bg-blue-500/10 border-blue-500/20";
  let title = "System Notice";

  if (item.type === "warning") {
    Icon = AlertTriangle;
    colorClass = "text-red-400";
    bgClass = "bg-red-500/10 border-red-500/20";
    title = "Risk Alert";
  } else if (item.type === "tip") {
    Icon = Lightbulb;
    colorClass = "text-amber-400";
    bgClass = "bg-amber-500/10 border-amber-500/20";
    title = "Pro Tip";
  } else if (item.type === "social") {
    Icon = MessageCircle;
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-500/10 border-emerald-500/20";
    title = "Market Chatter";
  }

  return (
    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      {/* Label Row */}
      <div className="flex justify-between items-start mb-1.5">
        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${bgClass} ${colorClass}`}>
          <Icon size={10} />
          <span className="text-[9px] font-bold uppercase tracking-wide">
            {title}
          </span>
        </div>

        {item.time && (
          <div className="flex items-center gap-1 text-[9px] text-white/20">
            <Clock size={8} />
            <span>{item.time}</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="text-xs text-white/70 leading-relaxed font-medium pl-1">
        {item.text}
      </div>
    </div>
  );
}
