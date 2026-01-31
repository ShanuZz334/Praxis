import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-elevated transition-colors relative overflow-hidden group"
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-full h-full transition-all duration-500 transform ${isDark ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}
                />
                <Moon
                    className={`absolute inset-0 w-full h-full transition-all duration-500 transform ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}
                />
            </div>
        </button>
    );
}
