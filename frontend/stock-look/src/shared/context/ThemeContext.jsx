/**
 * @file ThemeContext.jsx
 * @purpose Manages the global theme state (Light/Dark mode) and visual effects.
 * @responsibilities
 * - Provides `theme`, `vfxPreset`, and `gradientBorder` state to the app.
 * - Persists customization preferences to LocalStorage.
 * - Applies theme classes to the HTML root element.
 * @key_exports
 * - ThemeContext, ThemeProvider, useTheme
 * @dependencies
 * - React (createContext, useContext, useState, useEffect)
 * @lifecycle
 * - Wraps the entire application in `App.jsx`.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContextInstance';

// =============================
// Context Instance Re-export
// =============================

export { ThemeContext };

// =============================
// Provider Component
// =============================

export function ThemeProvider({ children }) {

    // --- State Initialization ---

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

    const [gradientBorder, setGradientBorder] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-gradient-border');
            if (saved) return saved === 'true';
            return true;
        }
        return true;
    });

    // --- Effects: Persistence & DOM Updates ---

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

    useEffect(() => {
        localStorage.setItem('stocky-gradient-border', gradientBorder);
    }, [gradientBorder]);

    // --- Actions ---

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // --- Render ---

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, vfxPreset, setVfxPreset, gradientBorder, setGradientBorder }}>
            {children}
        </ThemeContext.Provider>
    );
}

// =============================
// Hook Export
// =============================

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

