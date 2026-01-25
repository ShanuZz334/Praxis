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

/* -------------------------------------------
   PROTECTED ROUTE (UNCHANGED LOGIC)
-------------------------------------------- */
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(UserContext);

  if (loading) return null;

  return token ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* AUTH */}
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

        {/* DASHBOARD */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
