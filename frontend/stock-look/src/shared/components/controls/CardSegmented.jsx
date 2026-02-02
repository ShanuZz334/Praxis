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
  fullWidth = false,
}) {
  return (
    <div
      className={`
        ${fullWidth ? "flex w-full" : "inline-flex"}
        rounded-xl
        bg-background-surface
        border border-border-default
        backdrop-blur
        p-1
      `}
    >
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            className={`
              ${fullWidth ? "flex-1" : ""}
              rounded-lg
              transition-all
              ${size === "xs" ? "px-1.5 py-1 text-[10px]" : size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}
              ${active
                ? "bg-background-card text-text-primary shadow-sm ring-1 ring-border-default"
                : "text-text-tertiary hover:text-text-primary hover:bg-background-card/50"
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
