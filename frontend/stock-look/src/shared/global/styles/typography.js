/* --------------------------------------------------------------------------
   GLOBAL TYPOGRAPHY
   Standardized class strings for consistent text hierarchy.
-------------------------------------------------------------------------- */

export const typography = {
    // Headers
    h1: "text-3xl font-bold tracking-tight text-[var(--text-primary)]",
    h2: "text-lg font-bold text-[var(--text-primary)] tracking-tight",

    // Labels (The "Uppercased Small" look)
    label: {
        sm: "text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]",
        xs: "text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]",
    },

    // Values
    number: {
        giant: "text-6xl font-bold text-[var(--text-primary)] tracking-tighter",
        large: "text-3xl font-bold text-[var(--text-primary)] tracking-tighter",
        medium: "text-xl font-bold text-[var(--text-primary)] tracking-tight",
    },

    // Body
    body: {
        default: "text-sm text-[var(--text-secondary)] leading-relaxed",
        subtle: "text-xs text-[var(--text-muted)]",
    },

    // Data/Tech
    mono: {
        default: "font-mono text-xs",
        sm: "font-mono text-[10px]",
    }
};
