import React from "react";

/**
 * CardSegmented
 * ----------------------------------
 * Premium segmented control
 * - Card-styled
 * - No dropdown
 * - Fully controlled
 */
export default function CardSegmented({
  value,
  onChange,
  options = [],
  size = "sm",
}) {
  return (
    <div
      className="
        inline-flex
        rounded-xl
        bg-white/5
        border border-white/10
        backdrop-blur
        p-1
      "
    >
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            className={`
              px-3
              ${size === "sm" ? "py-1 text-xs" : "py-2 text-sm"}
              rounded-lg
              transition-all
              ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
