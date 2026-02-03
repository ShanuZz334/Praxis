/**
 * @file MobileThemeToggle.jsx
 * @purpose Simplified theme toggle button for mobile overlays.
 * @responsibilities
 * - Toggles global theme between Light and Dark modes.
 * - Renders specific icons (Sun/Moon) based on active state.
 * - Optimized for touch targets in mobile menus.
 * @key_exports
 * - MobileThemeToggle (Default)
 * @dependencies
 * - ThemeContext
 * - react-icons
 * @lifecycle
 * - Used in MobileQuickNav or MobileHeader.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

// =============================
// Component
// =============================

export default function MobileThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
                p-2 rounded-full transition-all duration-300
                ${isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
            `}
            aria-label="Toggle Theme"
        >
            {isDark ? (
                <FiMoon className="text-xl" />
            ) : (
                <FiSun className="text-xl" />
            )}
        </button>
    );
}
