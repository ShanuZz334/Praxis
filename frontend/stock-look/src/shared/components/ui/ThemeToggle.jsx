/**
 * @file ThemeToggle.jsx
 * @purpose Animated day/night switch for global theme control.
 * @responsibilities
 * - Provides a visual toggle UI for Light/Dark mode.
 * - Uses SVG masks for smooth Sun-to-Moon morphing animations.
 * - Accessible via label/input pattern.
 * @key_exports
 * - ThemeToggle (Default)
 * @dependencies
 * - ThemeContext
 * - ThemeToggle.css (Animation Logic)
 * @lifecycle
 * - Main persistence toggle in Navbar.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

// =============================
// Component
// =============================

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <label
            htmlFor="themeToggle"
            className="themeToggle st-sunMoonThemeToggleBtn"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
            <input
                type="checkbox"
                id="themeToggle"
                className="themeToggleInput"
                checked={!isDark} // Checked state means "Light Mode" in this CSS
                onChange={toggleTheme}
            />
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                stroke="none"
            >
                <mask id="moon-mask">
                    <rect x="0" y="0" width="20" height="20" fill="white" />
                    <circle cx="11" cy="3" r="8" fill="black" />
                </mask>
                <circle
                    className="sunMoon"
                    cx="10"
                    cy="10"
                    r="8"
                    mask="url(#moon-mask)"
                />
                <g>
                    <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5" />
                    <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5" />
                    <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5" />
                    <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5" />
                    <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5" />
                    <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5" />
                </g>
            </svg>
        </label>
    );
}

