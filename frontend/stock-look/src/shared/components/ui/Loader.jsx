/**
 * @file Loader.jsx
 * @purpose Reusable loading spinner component with size/color variants.
 * @responsibilities
 * - Renders a CSS-based animated loader.
 * - Supports multiple sizes (xxs to lg) and color themes.
 * @key_exports
 * - Loader (Default)
 * @dependencies
 * - Loader.css (Animation styles)
 * @lifecycle
 * - Used during async data fetching or lazy loading states.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import './Loader.css';

// =============================
// Component
// =============================

const Loader = ({ size = 'md', color = 'indigo' }) => {
    const sizeClasses = {
        xxs: 'w-5 h-5',
        xs: 'w-6 h-6',
        sm: 'w-12 h-12',
        md: 'w-20 h-20',
        lg: 'w-28 h-28'
    };

    const colorClasses = {
        indigo: 'border-indigo-400',
        blue: 'border-blue-400',
        purple: 'border-purple-400',
        white: 'border-white'
    };

    return (
        <div className={`loader ${sizeClasses[size]}`}>
            <div className={`box1 ${colorClasses[color]}`}></div>
            <div className={`box2 ${colorClasses[color]}`}></div>
            <div className={`box3 ${colorClasses[color]}`}></div>
        </div>
    );
};

export default Loader;
