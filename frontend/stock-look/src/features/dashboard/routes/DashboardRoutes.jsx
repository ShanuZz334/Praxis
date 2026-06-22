/**
 * @file DashboardRoutes.jsx
 * @purpose Defines the internal routing for the authenticated Dashboard.
 * @responsibilities
 * - Manages child routes for all dashboard features (Master, Fundamental, Technical, etc.).
 * - Syncs the active menu state via MenuSync.
 * - Provides centralized navigation structure for the workspace.
 * @key_exports
 * - DashboardRoutes (Default)
 * @dependencies
 * - react-router-dom
 * - MenuSync (Effect)
 * - All Dashboard Feature Pages
 * @lifecycle
 * - Rendered by DashboardLayout inside the main content area.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React from "react";
import { Routes, Route } from "react-router-dom";

// Feature Pages
import MasterDashboard from "@/features/dashboard/master/ui/MasterDashboard";
import FundamentalPage from "@/features/dashboard/fundamentals/ui/FundamentalPage";
import TechnicalPage from "@/features/dashboard/technical/ui/TechnicalPage";
import OptionsPage from "@/features/dashboard/options/ui/OptionsPage";
import EventsPage from "@/features/dashboard/events/ui/EventsPage";
import WalletPage from "@/features/dashboard/wallet/ui/WalletPage";
import ForeignPage from "@/features/dashboard/foreign/ui/ForeignPage";
import JournalPage from "@/features/dashboard/journal/ui/JournalPage";
import ManualDashboard from "@/features/dashboard/manual/ui/ManualDashboard";
import ManualSectionLayout from "@/features/dashboard/manual/ui/ManualSectionLayout";
import AboutPage from "@/features/dashboard/about/ui/AboutPage";
import SettingsPage from "@/features/dashboard/settings/ui/SettingsPage";
import MessagesPage from "@/features/dashboard/messages/ui/MessagesPage";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import UpstoxCallback from "@/features/admin/pages/UpstoxCallback";

// Effects
import MenuSync from "@/shared/components/effects/MenuSync";




// =============================
// Component
// =============================

const DashboardRoutes = ({ setActiveMenu }) => {
  return (
    <Routes>
      <Route
        path="home"
        element={
          <>
            <MenuSync menu="dashboard" setActiveMenu={setActiveMenu} />
            <MasterDashboard />
          </>
        }
      />

      <Route
        path="fundamental"
        element={
          <>
            <MenuSync menu="fundamental" setActiveMenu={setActiveMenu} />
            <FundamentalPage />
          </>
        }
      />

      <Route
        path="technical"
        element={
          <>
            <MenuSync menu="technical" setActiveMenu={setActiveMenu} />
            <TechnicalPage />
          </>
        }
      />

      <Route
        path="options"
        element={
          <>
            <MenuSync menu="options" setActiveMenu={setActiveMenu} />
            <OptionsPage />
          </>
        }
      />

      <Route
        path="events"
        element={
          <>
            <MenuSync menu="events" setActiveMenu={setActiveMenu} />
            <EventsPage />
          </>
        }
      />



      <Route
        path="globalstructure"
        element={
          <>
            <MenuSync menu="globalstructure" setActiveMenu={setActiveMenu} />
            <ForeignPage />
          </>
        }
      />

      <Route
        path="wallet"
        element={
          <>
            <MenuSync menu="wallet" setActiveMenu={setActiveMenu} />
            <WalletPage />
          </>
        }
      />

      <Route
        path="journal"
        element={
          <>
            <MenuSync menu="journal" setActiveMenu={setActiveMenu} />
            <JournalPage />
          </>
        }
      />

      <Route
        path="manual"
        element={
          <>
            <MenuSync menu="manual" setActiveMenu={setActiveMenu} />
            <ManualDashboard />
          </>
        }
      />
      <Route
        path="manual/:section"
        element={
          <>
            <MenuSync menu="manual" setActiveMenu={setActiveMenu} />
            <ManualSectionLayout />
          </>
        }
      />

      <Route
        path="about"
        element={
          <>
            <MenuSync menu="about" setActiveMenu={setActiveMenu} />
            <AboutPage />
          </>
        }
      />

      <Route
        path="settings"
        element={
          <>
            <MenuSync menu="settings" setActiveMenu={setActiveMenu} />
            <SettingsPage />
          </>
        }
      />


      <Route
        path="messages"
        element={
          <>
            <MenuSync menu="messages" setActiveMenu={setActiveMenu} />
            <MessagesPage />
          </>
        }
      />
      <Route
        path="messages"
        element={
          <>
            <MenuSync menu="messages" setActiveMenu={setActiveMenu} />
            <MessagesPage />
          </>
        }
      />

      <Route
        path="admin"
        element={
          <>
            <MenuSync menu="settings" setActiveMenu={setActiveMenu} />
            <AdminDashboard />
          </>
        }
      />

      <Route path="/oauth/upstox/callback" element={<UpstoxCallback />} />
    </Routes>
  );
};

export default DashboardRoutes;
