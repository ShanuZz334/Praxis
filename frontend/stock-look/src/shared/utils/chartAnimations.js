/**
 * Chart Animation Configurations
 * Framer Motion spring configurations for smooth, GPU-accelerated animations
 */

/**
 * Spring configuration for chart entrance
 */
export const chartEntranceSpring = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
};

/**
 * Spring configuration for data updates
 */
export const dataUpdateSpring = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1,
};

/**
 * Spring configuration for smooth transitions
 */
export const smoothTransitionSpring = {
    type: 'spring',
    stiffness: 150,
    damping: 20,
    mass: 0.5,
};

/**
 * Entrance animation variants for charts
 */
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

/**
 * Stagger children animation
 */
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

/**
 * Fade in animation
 */
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3 },
    },
};

/**
 * Slide up animation
 */
export const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: smoothTransitionSpring,
    },
};

/**
 * Scale animation for interactive elements
 */
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

/**
 * Tooltip animation
 */
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

/**
 * Modal animation
 */
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

/**
 * Number counter animation
 */
export const counterTransition = {
    duration: 0.8,
    ease: 'easeOut',
};

/**
 * Path drawing animation for SVG
 */
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

/**
 * Shimmer animation for skeleton loaders
 */
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
