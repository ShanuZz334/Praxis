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

    const [tradingMode, setTradingMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-trading-mode');
            // Migrate old values from v1 names to v2
            if (saved === 'conservative') return 'intraday';
            if (saved === 'balanced')     return 'swing';
            if (saved === 'aggressive')   return 'positional';
            if (saved) return saved;
            return 'swing';
        }
        return 'swing';
    });

    const [tradingModeVfx, setTradingModeVfx] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-trading-mode-vfx');
            if (saved) return saved === 'true';
            return false;
        }
        return false;
    });

    const [paiMascotColor, setPaiMascotColor] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pai-mascot-color');
            if (saved) return saved;
            return '#FF0000'; // Default orange/red
        }
        return '#FF0000';
    });

    const [paiAccessory, setPaiAccessory] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pai-mascot-accessory');
            if (saved) return saved;
            return 'none'; // Default accessory
        }
        return 'none';
    });

    const [paiAudioStyle, setPaiAudioStyle] = useState(() => {
        return localStorage.getItem('pai-audio-style') || 'pixel';
    });

    const [useOrbNav, setUseOrbNav] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stocky-orb-nav');
            if (saved) return saved === 'true';
            return false;
        }
        return false;
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

    useEffect(() => {
        localStorage.setItem('stocky-trading-mode', tradingMode);
    }, [tradingMode]);

    useEffect(() => {
        localStorage.setItem('stocky-trading-mode-vfx', tradingModeVfx);
    }, [tradingModeVfx]);

    useEffect(() => {
        localStorage.setItem('pai-mascot-color', paiMascotColor);
        window.document.documentElement.style.setProperty('--pai-mascot-color', paiMascotColor);
    }, [paiMascotColor]);

    useEffect(() => {
        localStorage.setItem('pai-mascot-accessory', paiAccessory);
    }, [paiAccessory]);

    useEffect(() => {
        localStorage.setItem('pai-audio-style', paiAudioStyle);
    }, [paiAudioStyle]);

    useEffect(() => {
        localStorage.setItem('stocky-orb-nav', useOrbNav);
    }, [useOrbNav]);

    // NEW: Sync Trading Mode Visuals
    useEffect(() => {
        const root = window.document.documentElement;
        // Expose the active profile as a CSS data attribute for targeted styling
        root.setAttribute('data-profile', tradingMode);

        if (tradingModeVfx) {
            switch (tradingMode) {
                case 'intraday':
                    root.style.setProperty('--gradient-start', '#f97316'); // Orange — fast, urgent
                    root.style.setProperty('--gradient-end', '#ef4444');   // Red
                    break;
                case 'positional':
                    root.style.setProperty('--gradient-start', '#10b981'); // Emerald — calm, long-term
                    root.style.setProperty('--gradient-end', '#06b6d4');   // Cyan
                    break;
                case 'swing':
                default:
                    root.style.setProperty('--gradient-start', '#3b82f6'); // Blue — balanced
                    root.style.setProperty('--gradient-end', '#8b5cf6');   // Violet
                    break;
            }
        } else {
            // Restore defaults
            root.style.setProperty('--gradient-start', '#3b82f6');
            root.style.setProperty('--gradient-end', '#8b5cf6');
        }
    }, [tradingMode, tradingModeVfx]);

    // --- Actions ---

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const contextValue = React.useMemo(() => ({
        theme,
        toggleTheme,
        vfxPreset,
        setVfxPreset,
        gradientBorder,
        setGradientBorder,
        tradingMode,
        setTradingMode,
        tradingModeVfx,
        setTradingModeVfx,
        paiMascotColor,
        setPaiMascotColor,
        paiAccessory,
        setPaiAccessory,
        paiAudioStyle,
        setPaiAudioStyle,
        useOrbNav,
        setUseOrbNav
    }), [theme, vfxPreset, gradientBorder, tradingMode, tradingModeVfx, paiMascotColor, paiAccessory, paiAudioStyle, useOrbNav]);

    return (
        <ThemeContext.Provider value={contextValue}>
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

