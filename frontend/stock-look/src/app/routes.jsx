/**
 * @file routes.jsx
 * @purpose Defines the primary navigation architecture and route protection logic.
 * @responsibilities
 * - Manages URL-to-Component mapping via React Router.
 * - Implements ProtectedRoute HOC for authentication-gated access.
 * - Handles top-level layout switching (Auth vs Dashboard).
 * - Provides fallback redirection for invalid paths.
 * @key_exports
 * - AppRoutes (Default)
 * @dependencies
 * - react-router-dom
 * - UserContext, AuthLayout, DashboardLayout
 * @lifecycle
 * - Rendered by App.jsx within the provider tree.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "@/features/auth/pages/Login";
import SignUp from "@/features/auth/pages/SignUp";
import { UserContext } from "@/shared/context/UserContext";
import AuthLayout from "@/shared/components/layouts/AuthLayout";
import DashboardLayout from "@/shared/components/layouts/DashboardLayout";

// =============================
// Utility / Guard Functions
// =============================
/**
 * ProtectedRoute HOC
 * Redirects unauthenticated users to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(UserContext);

  if (loading) return null;

  return token ? children : <Navigate to="/login" replace />;
};

// =============================
// Main Routing Configuration
// =============================
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Default Entry */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthLayout>
              <SignUp />
            </AuthLayout>
          }
        />

        {/* Authenticated Dashboard Scope */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

// =============================
// Exports
// =============================
export default AppRoutes;
