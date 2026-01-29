/* --------------------------------------------------------------------------
   GLOBAL TYPOGRAPHY
   Standardized class strings for consistent text hierarchy.
-------------------------------------------------------------------------- */

export const typography = {
    // Headers
    h1: "text-3xl font-bold tracking-tight text-white",
    h2: "text-lg font-bold text-white tracking-tight",

    // Labels (The "Uppercased Small" look)
    label: {
        sm: "text-xs font-semibold uppercase tracking-wider text-white/40",
        xs: "text-[10px] font-bold uppercase tracking-widest text-white/40",
    },

    // Values
    number: {
        giant: "text-6xl font-bold text-white tracking-tighter",
        large: "text-3xl font-bold text-white tracking-tighter",
        medium: "text-xl font-bold text-white tracking-tight",
    },

    // Body
    body: {
        default: "text-sm text-white/90 leading-relaxed",
        subtle: "text-xs text-white/60",
    },

    // Data/Tech
    mono: {
        default: "font-mono text-xs",
        sm: "font-mono text-[10px]",
    }
};
