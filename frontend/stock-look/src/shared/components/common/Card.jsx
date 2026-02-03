import React, { useContext } from "react";
import clsx from "clsx";
import { ThemeContext } from "@/shared/context/ThemeContext";

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
  const { theme, gradientBorder } = useContext(ThemeContext);

  const isGradientEnabled = theme === 'dark' && gradientBorder;

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
            /* ---------- THEME DEPLOYMENT (FIXED) ---------- */
            /* ---------- THEME DEPLOYMENT (FIXED) ---------- */
            ${isGradientEnabled
            ? "card-gradient-border dark:hover:shadow-[var(--shadow-card-gradient-hover)]"
            : "bg-[var(--bg-card-primary)] border-2 dark:border border-[var(--border-subtle)] hover:border-border-hover dark:hover:border-border-subtle-translucent"
          }
            shadow-sm dark:shadow-none
            hover:shadow-[var(--shadow-card-3d-hover)]
            hover:-translate-y-2
          `,
        spanMap[span],
        className
      )}
    >
      {/* subtle inner sheen — removed for pure color matching */}
      {!borderless && (
        <div
          className={clsx(
            "pointer-events-none absolute inset-0 rounded-2xl",
            "bg-gradient-to-br from-background-surface to-transparent",
            "opacity-0"
          )}
        />
      )}

      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;
