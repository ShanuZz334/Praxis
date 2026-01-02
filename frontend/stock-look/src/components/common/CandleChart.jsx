import React from "react";

const CandleChart = ({ candles = [], height = 120 }) => {
  if (!candles.length) return null;

  const padding = 6;

  const highs = candles.map(c => c.h);
  const lows = candles.map(c => c.l);

  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;

  const total = candles.length;

  // 🔽 NEW: spacing config
  const candleGap = 0.8;        // space between candles
  const candleBodyWidth = 0.9;  // body thickness

  const scaleY = price =>
    height - ((price - min) / range) * (height - padding * 2) - padding;

  return (
    <svg
      viewBox={`0 0 ${total} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      {candles.map((c, i) => {
        const x = i + candleGap / 2;

        const openY = scaleY(c.o);
        const closeY = scaleY(c.c);
        const highY = scaleY(c.h);
        const lowY = scaleY(c.l);

        const isBull = c.c >= c.o;
        const color = isBull ? "#22c55e" : "#ef4444";

        return (
          <g key={i}>
            {/* Wick (thinner) */}
            <line
              x1={x + candleBodyWidth / 2}
              x2={x + candleBodyWidth / 2}
              y1={highY}
              y2={lowY}
              stroke={color}
              strokeWidth="0.25"
            />

            {/* Body (slimmer + gap) */}
            <rect
              x={x}
              y={Math.min(openY, closeY)}
              width={candleBodyWidth}
              height={Math.max(1, Math.abs(openY - closeY))}
              fill={color}
              rx="0.2"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default CandleChart;
