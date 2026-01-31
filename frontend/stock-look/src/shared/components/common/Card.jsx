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
            bg-background-card
            border border-border-default dark:border-border-subtle-faint
            shadow-md
            hover:border-border-hover dark:hover:border-border-subtle-translucent
            hover:shadow-2xl
            hover:-translate-y-1
            duration-300
          `,
        spanMap[span],
        className
      )}
    >
      {/* subtle inner glow (Manual-like sheen) */}
      {!borderless && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-background-surface to-transparent opacity-50" />
      )}

      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;
