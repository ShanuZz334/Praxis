/**
 * @file GlitchText.jsx
 * @purpose Renders text with a cyberpunk-style glitch animation effect.
 * @responsibilities
 * - Applies CSS-based glitch animations to text content.
 * - Supports configurable speed and shadow effects.
 * - Handles hover-state activation logic.
 * @key_exports
 * - GlitchText (Default)
 * @dependencies
 * - GlitchText.css (Animation definitions)
 * @lifecycle
 * - Used for headings/titles where visual emphasis is needed.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import './GlitchText.css';

// =============================
// Component
// =============================

const GlitchText = ({ children, speed = 1, enableShadows = true, enableOnHover = true, className = '' }) => {
  const inlineStyles = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-5px 0 red' : 'none',
    '--before-shadow': enableShadows ? '5px 0 cyan' : 'none'
  };

  const hoverClass = enableOnHover ? 'enable-on-hover' : '';

  return (
    <div className={`glitch ${hoverClass} ${className}`} style={inlineStyles} data-text={children}>
      {children}
    </div>
  );
};

export default GlitchText;
