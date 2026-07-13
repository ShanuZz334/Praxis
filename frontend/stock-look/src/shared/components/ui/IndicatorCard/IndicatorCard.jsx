import React, { useState, useEffect, useContext, useMemo } from "react";
import Card from "@/shared/components/common/Card";
import { FundamentalContext } from "@/features/dashboard/fundamentals/ui/FundamentalContext";
import { FlipContainer, FlipTrigger } from "@/shared/components/common/FlipContainer";
import { Star, Lightbulb, Plus, BarChart2, Edit2, Check } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";

// =============================
// Helper: Score Bar
// =============================
function ScoreRangeBar({ score }) {
  // Clamp score between 0 and 100, fallback to 50 if NaN
  const parsedScore = parseFloat(score);
  const safeScore = isNaN(parsedScore) ? 50 : Math.min(Math.max(parsedScore, 0), 100);

  return (
    <div className="mt-4">
      <div className="text-[10px] text-text-tertiary font-mono mb-1">Score Range</div>
      
      {/* Gradient Bar */}
      <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500">
        
        {/* Pointer */}
        <div 
          className="absolute top-full -translate-x-1/2 flex flex-col items-center mt-1 transition-all duration-500 ease-out"
          style={{ left: `${safeScore}%` }}
        >
          {/* Triangle */}
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-blue-500 rotate-180" />
          <span className="text-[10px] font-mono font-bold text-text-primary mt-0.5">{safeScore}</span>
        </div>
      </div>
      
      {/* Labels below */}
      <div className="flex justify-between text-[9px] text-text-tertiary mt-6 font-mono">
        <div className="flex flex-col items-start">
          <span>Low</span>
          <span>0</span>
        </div>
        <div className="flex flex-col items-center">
          <span>Avg</span>
          <span>50</span>
        </div>
        <div className="flex flex-col items-end">
          <span>High</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

// =============================
// Helper: Header
// =============================
function IndicatorHeader({ title, category, mode, creditScore, updateTime, missingManualCount }) {
  const isAuto = mode?.toUpperCase() === "AUTO";
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        <p className="text-[10px] text-text-secondary">{category}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {/* Mode Badge */}
          <div className="flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", isAuto ? "bg-green-500" : "bg-yellow-500")} />
            <span className="text-[10px] font-mono font-bold tracking-wider text-text-primary uppercase">{mode}</span>
          </div>
          
          {/* CR Badge */}
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 border border-border-default rounded text-[10px] font-mono bg-background-elevated">{creditScore}</span>
            {missingManualCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                    {missingManualCount}
                </span>
            )}
          </div>
        </div>
        <span className="text-[9px] text-text-tertiary">Updated {updateTime}</span>
      </div>
    </div>
  );
}

// =============================
// Helper: Metrics Grid
// =============================
function MetricsGrid({ 
  details, 
  score, 
  bias, 
  confidence, 
  impactWeight, 
  isManual, 
  currentValueObj, 
  onSave 
}) {
  // Inline edit state removed to enforce centralized GlobalHeader manual overrides

  // Common styles for the grid rows
  const rowClass = "flex justify-between items-center py-1";
  const labelClass = "text-[11px] text-text-secondary";
  const valClass = "text-[11px] font-mono font-medium text-text-primary";

  return (
    <div className="flex flex-col gap-0.5">
      
      {/* Current Value */}
      {currentValueObj && currentValueObj.value !== '--' && (
        <div className={cn(rowClass, isManual && "mb-1")}>
          <span className={labelClass}>{currentValueObj.label || "Current Value"}</span>
          <div className="flex items-center gap-2">
            {isManual && (
              <span className="text-text-tertiary">
                <Edit2 className="w-3 h-3" />
              </span>
            )}
            <span className={cn(valClass, !isManual && "text-blue-400")}>{currentValueObj.value}</span>
          </div>
        </div>
      )}

      {/* Dynamic details injected specifically (e.g. MACD Line, Signal Line) */}
      {details?.filter(d => d && d.value !== '--' && d.value !== null && d.value !== undefined).map((d, i) => (
        <div key={i} className={rowClass}>
          <span className={labelClass}>{d.label}</span>
          <div className="flex items-center gap-2">
            {d.isManual && (
              <span className="text-text-tertiary">
                <Edit2 className="w-3 h-3" />
              </span>
            )}
            <span className={cn(valClass, !d.isManual && "text-blue-400")}>{d.value}</span>
          </div>
        </div>
      ))}

      {/* Core Standard Metrics */}
      <div className={rowClass}>
        <span className={labelClass}>Score</span>
        <span className={valClass}>
          <span className={cn(
             score >= 70 ? "text-green-500" : score <= 30 ? "text-red-500" : "text-yellow-500"
          )}>{isNaN(parseFloat(score)) ? '--' : parseFloat(score).toFixed(0)}</span>
          <span className="text-text-tertiary"> /100</span>
        </span>
      </div>

      <div className={rowClass}>
        <span className={labelClass}>Bias</span>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-2 h-2 rounded-full",
            bias?.toLowerCase().includes("bullish") ? "bg-green-500" : bias?.toLowerCase().includes("bearish") ? "bg-red-500" : "bg-yellow-500"
          )} />
          <span className="text-[11px] text-text-primary">{bias}</span>
        </div>
      </div>

      <div className={rowClass}>
        <span className={labelClass}>Confidence</span>
        <span className={valClass}>{confidence}</span>
      </div>

      <div className={rowClass}>
        <span className={labelClass}>Impact Weight</span>
        <span className={valClass}>{impactWeight}</span>
      </div>

    </div>
  );
}


// =============================
// Helper: Dual Chart
// =============================
function ValueChart({ data, valueKey, valueName }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 w-full mt-2 mb-4 flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-lg bg-background-elevated/30">
        <span className="text-[11px] font-mono text-text-tertiary">No Data Available</span>
      </div>
    );
  }

  return (
    <div className="h-40 w-full mt-2 mb-4">
      <div className="text-center text-[11px] font-bold text-text-primary mb-2">Value vs Engine Score</div>
      <div className="flex justify-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[9px] text-text-secondary font-mono">{valueName || "Value"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[9px] text-text-secondary font-mono">Engine Score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
          <XAxis 
            dataKey="date" 
            stroke="#4b5563" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => {
               if(!val) return '';
               // Assuming val is 'YYYY-MM-DD', convert to 'DD MMM'
               const d = new Date(val);
               return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }}
          />
          <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} tickLine={false} axisLine={false} hide />
          <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', fontSize: '10px' }}
            formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)}
            labelFormatter={(label) => label}
          />
          <ReferenceLine yAxisId="right" y={50} stroke="#4b5563" strokeDasharray="3 3" />
          <Line yAxisId="left" type="monotone" dataKey="raw_value" name={valueName || "Value"} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
          <Line yAxisId="right" type="monotone" dataKey="score" name="Score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


import { motion, AnimatePresence } from "framer-motion";

// =============================
// Main Component
// =============================

export function IndicatorCard({
  config,      // { title, category, mode, creditScore, updateTime, source, aiModel }
  data,        // { currentValueObj, details, score, bias, confidence, impactWeight }
  chartData,   // { points, valueKey, valueName }
  insights,    // { aiInsight, whyItMatters }
  onSave,      // callback for manual input
  className
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const context = useContext(FundamentalContext);
  const historicalData = useMemo(() => {
     if (context?.snapshots && config?.title) {
        return context.snapshots[config.title] || [];
     }
     return [];
  }, [context?.snapshots, config?.title]);

  useEffect(() => {
    const rawVal = data?.currentValueObj?.value;
    const isMissing = rawVal === undefined || rawVal === null || rawVal === '--' || rawVal === '';
    
    // Always dispatch, but send null if the value was cleared
    const event = new CustomEvent('SAVE_SNAPSHOT', {
        detail: {
            card_id: config.title,
            raw_value: isMissing ? null : parseFloat(rawVal) || 0,
            score: isMissing ? null : (data?.score || 50),
            bias: isMissing ? null : (data?.bias || 'Neutral')
        }
    });
    
    // Delay the dispatch slightly so that parent hooks (like useFundamentalComposite) 
    // have time to attach their event listeners during the mount phase.
    const timeoutId = setTimeout(() => {
        window.dispatchEvent(event);
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [config?.title, data?.currentValueObj?.value, data?.score, data?.bias]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const isManual = config.mode?.toUpperCase() === "MANUAL";

  const missingManualCount = [
    ...(data?.currentValueObj ? [{ ...data.currentValueObj, isManual: isManual || data.currentValueObj.isManual }] : []),
    ...(data?.details || [])
  ].filter(d => d && d.isManual && (d.value === '--' || d.value === null || d.value === undefined)).length;

  return (
    <Card 
      className={cn("p-5 overflow-hidden cursor-pointer relative", className)} 
      onDoubleClick={toggleExpand}
    >
      <div className="flex flex-col h-[380px]">
        {/* Always visible top section */}
        <div className="shrink-0">
          <IndicatorHeader 
            {...config} 
            missingManualCount={missingManualCount}
          />
        </div>
        
        <div className="mt-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* We pass a custom onSave that stops propagation so clicking Save doesn't close the card */}
          <MetricsGrid 
            {...data} 
            isManual={isManual} 
            onSave={(val) => {
              if(onSave) onSave(val);
            }}
          />
        </div>

        <div className="mt-auto pt-4 mb-0 shrink-0">
          <ScoreRangeBar score={data.score} />
        </div>
      </div>

      {/* Expandable Section */}
      <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 mb-2 border-t border-border-subtle" />

              {/* Scrollable Container for Content */}
              <div 
                className="h-[320px] overflow-y-auto pr-1 pb-4 custom-scrollbar"
                onClick={(e) => e.stopPropagation()} // Let users interact with content (copy text, etc.)
              >
                {/* Chart */}
                <div className="pb-2">
                  <ValueChart data={historicalData} valueName={chartData?.valueName} />
                </div>

                {/* AI Insight */}
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-[12px] font-bold text-purple-400">AI Insight</span>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {insights?.aiInsight}
                  </p>
                </div>

                <div className="my-4 border-t border-border-subtle" />

                {/* Why it Matters */}
                <div className="mt-4 mb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <span className="text-[12px] font-bold text-text-primary">Why It Matters</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5">
                    {insights?.whyItMatters?.map((point, idx) => (
                      <li key={idx} className="text-[12px] text-text-secondary leading-relaxed pl-1">{point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="flex items-center justify-between border-t border-border-subtle pt-4 mt-auto"
                onClick={(e) => e.stopPropagation()} // Prevent clicks here from closing card
              >
                <button className="text-text-tertiary hover:text-text-primary transition-colors p-1 -ml-2">
                  <Plus className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-text-tertiary font-mono">Source: {config.source || (isManual ? "Manual" : "Auto")}</span>
                  <span className="text-[10px] text-text-tertiary font-mono">AI Model: {config.aiModel || "Qwen3 8B"}</span>
                  <span className="text-[10px] text-text-tertiary font-mono">{config.updateTime}</span>
                </div>

                <button className="text-text-tertiary hover:text-text-primary transition-colors p-1 -mr-2">
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
    </Card>
  );
}
