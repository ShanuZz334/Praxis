import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";

import UserProvider, { UserContext } from "./context/userContext";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";

/* -------------------------------------------
   PROTECTED ROUTE (CORRECT)
-------------------------------------------- */
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(UserContext);

  if (loading) return null;

  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <UserProvider>
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
    </UserProvider>
  );
};

export default App;
