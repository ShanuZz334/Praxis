import { Routes, Route } from "react-router-dom";

// Pages
// Pages
import MasterDashboard from "@/features/dashboard/master/ui/MasterDashboard";
import FundamentalPage from "@/features/dashboard/fundamentals/ui/FundamentalPage";
import TechnicalPage from "@/features/dashboard/technical/ui/TechnicalPage";
import OptionsPage from "@/features/dashboard/options/ui/OptionsPage"; // New Import
import EventsPage from "@/features/dashboard/events/ui/EventsPage";
import WalletPage from "@/features/dashboard/wallet/ui/WalletPage";
import ForeignPage from "@/features/dashboard/foreign/ui/ForeignPage";
import JournalPage from "@/features/dashboard/journal/ui/JournalPage";
import ManualDashboard from "@/features/dashboard/manual/ui/ManualDashboard";
import ManualSectionLayout from "@/features/dashboard/manual/ui/ManualSectionLayout";
import AboutPage from "@/features/dashboard/about/ui/AboutPage";
import SettingsPage from "@/features/dashboard/settings/ui/SettingsPage";
import MessagesPage from "@/features/dashboard/messages/ui/MessagesPage";
// Menu sync
import MenuSync from "@/shared/components/effects/MenuSync";




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
    </Routes>
  );
};

export default DashboardRoutes;
