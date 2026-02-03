/**
 * @file MenuSync.jsx
 * @purpose Synchronizes external menu state with internal navigation logic.
 * @responsibilities
 * - Updates the active menu state when the `menu` prop changes.
 * - Prevents infinite update loops via strict equality checks.
 * @key_exports
 * - MenuSync (Default)
 * @dependencies
 * - React (useEffect)
 * @lifecycle
 * - Rendered by parent layout components to sync deep-linked or routed menu states.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import { useEffect } from "react";

// =============================
// Component
// =============================

const MenuSync = ({ menu, setActiveMenu }) => {
  useEffect(() => {
    setActiveMenu((prev) => {
      if (prev === menu) return prev; // ⛔ prevent infinite loop
      return menu;
    });
  }, [menu, setActiveMenu]);

  return null;
};

export default MenuSync;
