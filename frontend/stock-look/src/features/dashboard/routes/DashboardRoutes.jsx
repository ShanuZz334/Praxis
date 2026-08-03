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

import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Loader from "@/shared/components/ui/Loader";

// Lazy-loaded Feature Pages
const MasterDashboard = lazy(() => import("@/features/dashboard/master/ui/MasterDashboard"));
const FundamentalPage = lazy(() => import("@/features/dashboard/fundamentals/ui/FundamentalPage"));
const TechnicalPage = lazy(() => import("@/features/dashboard/technical/ui/TechnicalPage"));
const OptionsPage = lazy(() => import("@/features/dashboard/options/ui/OptionsPage"));
const EventsPage = lazy(() => import("@/features/dashboard/events/ui/EventsPage"));
const WalletPage = lazy(() => import("@/features/dashboard/wallet/ui/WalletPage"));
const ForeignPage = lazy(() => import("@/features/dashboard/foreign/ui/ForeignPage"));
const ManualDashboard = lazy(() => import("@/features/dashboard/manual/ui/ManualDashboard"));
const ManualSectionLayout = lazy(() => import("@/features/dashboard/manual/ui/ManualSectionLayout"));
const AboutPage = lazy(() => import("@/features/dashboard/about/ui/AboutPage"));
const SettingsPage = lazy(() => import("@/features/dashboard/settings/ui/SettingsPage"));
const MessagesPage = lazy(() => import("@/features/dashboard/messages/ui/MessagesPage"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const UpstoxCallback = lazy(() => import("@/features/admin/pages/UpstoxCallback"));
const JournalPage = lazy(() => import("@/features/dashboard/journal/ui/JournalPage"));
const PaiPage = lazy(() => import("@/features/dashboard/pai/ui/PaiPage"));
const PaiSettingsPage = lazy(() => import("@/features/dashboard/pai/ui/PaiSettingsPage"));

// Effects
import MenuSync from "@/shared/components/effects/MenuSync";




// =============================
// Component
// =============================

const DashboardRoutes = ({ setActiveMenu }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center min-h-[50vh]"><Loader text="Loading Workspace..." /></div>}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.99 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full h-full"
        >
          <Routes location={location}>
            {/* Default /dashboard entry redirects to /dashboard/home */}
        <Route index element={<Navigate to="home" replace />} />
        <Route path="" element={<Navigate to="home" replace />} />

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

        {/* PAI */}
        <Route
          path="pai"
          element={
            <>
              <MenuSync menu="pai" setActiveMenu={setActiveMenu} />
              <PaiPage />
            </>
          }
        />
        <Route
          path="pai/settings"
          element={
            <>
              <MenuSync menu="pai" setActiveMenu={setActiveMenu} />
              <PaiSettingsPage />
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

        {/* Journal */}
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
        
          {/* Fallback to Home for any unmapped /dashboard/* routes */}
          <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
};

export default DashboardRoutes;
