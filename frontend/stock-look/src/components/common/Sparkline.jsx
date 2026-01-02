import React, { useId } from "react";

const Sparkline = ({
  values = [],
  width = 80,
  height = 28,
}) => {
  if (!values.length) return null;

  const gradientId = useId();

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const up = values[values.length - 1] >= values[0];
  const stroke = up ? "#4ade80" : "#f87171";

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `
    ${linePath}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={stroke} />
    </svg>
  );
};

export default Sparkline;
