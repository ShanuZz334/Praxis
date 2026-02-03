/**
 * @file useAuth.js
 * @purpose Custom hook for managing and accessing authentication state.
 * @responsibilities
 * - Provides a unified interface for reading authentication status and user data.
 * - (Placeholder) Will eventually connect to global auth state management.
 * @key_exports
 * - useAuth (Function): Hook returning auth state.
 * @dependencies
 * - None (Currently a standalone placeholder)
 * @lifecycle
 * - Called by components within the auth or protected scopes.
 * @date 2026-02-03
 */

// =============================
// Main Hook
// =============================
export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
  };
}
