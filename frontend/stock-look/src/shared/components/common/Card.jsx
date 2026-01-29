import React from "react";
import clsx from "clsx";

const spanMap = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

const Card = ({
  children,
  className,
  span = 1,
  borderless = false,
}) => {
  return (
    <div
      className={clsx(
        `
        relative
        rounded-2xl
        p-6
        transition-all duration-300 ease-out
        `,
        borderless
          ? "bg-transparent shadow-none"
          : `
            bg-[var(--bg-card)]
            border border-[var(--border-main)]
            shadow-[0_8px_24px_rgba(0,0,0,0.15)]
            hover:border-[var(--accent-primary)]/40
            hover:shadow-[0_12px_32px_var(--accent-glow)]
          `,
        spanMap[span],
        className
      )}
    >
      {/* subtle inner glow only for normal cards */}
      {!borderless && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
      )}

      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;
