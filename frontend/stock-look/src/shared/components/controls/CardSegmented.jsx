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
        bg-background-surface
        border border-border-default
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
