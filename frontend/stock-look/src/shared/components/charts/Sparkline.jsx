/**
 * @file Sparkline.jsx
 * @purpose Minimalistic line chart for trend visualization.
 * @responsibilities
 * - Renders a simple SVG polyline chart.
 * - Fits within small UI containers (tiles, list items).
 * - Auto-measures width for responsive rendering.
 * @key_exports
 * - Sparkline (Default)
 * @dependencies
 * - React
 * @lifecycle
 * - Used in high-density data grids/lists.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { memo, useEffect, useRef, useState } from "react";

// =============================
// Constants
// =============================

const HEIGHT = 32;
const PADDING = 4;

// =============================
// Component
// =============================

function Sparkline({ data = [], color = "var(--accent-primary)" }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(1); // 🔑 never 0

  /* ---------------------------------------
     Measure container width
  --------------------------------------- */
  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length < 2) {
    return <div ref={ref} className="h-8 w-full" />;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const safeWidth = Math.max(width, 1);

  const points = values.map((v, i) => {
    const x =
      (i / (values.length - 1)) * (safeWidth - PADDING * 2) +
      PADDING;
    const y =
      HEIGHT -
      PADDING -
      ((v - min) / range) * (HEIGHT - PADDING * 2);
    return `${x},${y}`;
  });

  return (
    <div ref={ref} className="w-full h-8">
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${safeWidth} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        {width > 1 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

export default memo(Sparkline);
