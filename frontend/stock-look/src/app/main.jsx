/**
 * @file main.jsx
 * @purpose Client-side entry point that initializes and mounts the React application.
 * @responsibilities
 * - Connects the React application to the DOM root element.
 * - Imports global CSS styling and CSS variables.
 * - Enables StrictMode for development-time safety checks.
 * @key_exports
 * - None (Entry Script)
 * @dependencies
 * - react-dom: For DOM-based rendering.
 * - index.css: Root stylesheet containing theme variables and resets.
 * - App: Root component of the application.
 * @lifecycle
 * - First script executed by the browser.
 * - Performs high-level DOM mounting.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "./App";

// =============================
// Core Initialization
// =============================
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
