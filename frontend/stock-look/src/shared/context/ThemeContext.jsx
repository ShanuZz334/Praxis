import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Default to 'dark' to respect institutional nature, but check local storage
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-theme');
            if (saved) return saved;
            return 'dark';
        }
        return 'dark';
    });

    const [vfxPreset, setVfxPreset] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-vfx-preset');
            if (saved) return saved;
            return 'midnight';
        }
        return 'midnight';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
        localStorage.setItem('stocky-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('stocky-vfx-preset', vfxPreset);
    }, [vfxPreset]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, vfxPreset, setVfxPreset }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
