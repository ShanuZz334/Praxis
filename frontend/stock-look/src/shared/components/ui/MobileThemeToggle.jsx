import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

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
