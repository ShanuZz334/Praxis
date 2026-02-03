/**
 * @file chartAnimations.js
 * @purpose Framer Motion animation configurations for charts and UI elements.
 * @responsibilities
 * - Provides spring configurations for smooth animations.
 * - Defines entrance, exit, and interaction animation variants.
 * - Supports stagger, fade, slide, scale, and path drawing animations.
 * - Optimized for GPU acceleration and performance.
 * @key_exports
 * - chartEntranceSpring, dataUpdateSpring, smoothTransitionSpring
 * - chartVariants, staggerContainer, modalVariants, tooltipVariants
 * - fadeIn, slideUp, scaleOnHover, pathDrawing, shimmer
 * @dependencies
 * - Framer Motion (implicit - these are config objects)
 * @lifecycle
 * - Used by chart components and modals for consistent animations.
 * @date 2026-02-04
 */

// =============================
// Spring Configurations
// =============================


export const chartEntranceSpring = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
};


export const dataUpdateSpring = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1,
};


export const smoothTransitionSpring = {
    type: 'spring',
    stiffness: 150,
    damping: 20,
    mass: 0.5,
};

// =============================
// Animation Variants
// =============================
export const chartVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: chartEntranceSpring,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2,
        },
    },
};


export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};


export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3 },
    },
};


export const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: smoothTransitionSpring,
    },
};

// =============================
// Interactive Animations
// =============================
export const scaleOnHover = {
    rest: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10,
        },
    },
    tap: {
        scale: 0.95,
    },
};


export const tooltipVariants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
};


export const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2,
        },
    },
};

// =============================
// Specialized Animations
// =============================
export const counterTransition = {
    duration: 0.8,
    ease: 'easeOut',
};


export const pathDrawing = {
    hidden: {
        pathLength: 0,
        opacity: 0,
    },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: { duration: 1.5, ease: 'easeInOut' },
            opacity: { duration: 0.3 },
        },
    },
};


export const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
    },
};
