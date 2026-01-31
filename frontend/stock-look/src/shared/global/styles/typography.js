/* --------------------------------------------------------------------------
   GLOBAL TYPOGRAPHY
   Standardized class strings for consistent text hierarchy.
-------------------------------------------------------------------------- */

export const typography = {
    // Headers
    h1: "text-3xl font-bold tracking-tight text-text-primary",
    h2: "text-lg font-bold text-text-primary tracking-tight",

    // Labels (The "Uppercased Small" look)
    label: {
        sm: "text-xs font-semibold uppercase tracking-wider text-text-tertiary",
        xs: "text-[10px] font-bold uppercase tracking-widest text-text-tertiary",
    },

    // Values
    number: {
        giant: "text-6xl font-bold text-text-primary tracking-tighter",
        large: "text-3xl font-bold text-text-primary tracking-tighter",
        medium: "text-xl font-bold text-text-primary tracking-tight",
    },

    // Body
    body: {
        default: "text-sm text-text-primary leading-relaxed",
        subtle: "text-xs text-text-secondary",
    },

    // Data/Tech
    mono: {
        default: "font-mono text-xs",
        sm: "font-mono text-[10px]",
    }
};
