/**
 * @file DashboardLayout.jsx
 * @purpose Main application shell for the authenticated dashboard.
 * @responsibilities
 * - Manages the responsive sidebar and top navbar.
 * - Handles viewport-specific layout adjustments (Mobile Drawer vs Desktop Sidebar).
 * - Renders global background visual effects based on theme.
 * - Wraps all dashboard feature routes.
 * @key_exports
 * - DashboardLayout (Default)
 * @dependencies
 * - Navbar, SideMenu, MobileHeader (Layout Components)
 * - UserContext, ThemeContext (Global State)
 * @lifecycle
 * - Parent route for all /dashboard/* paths.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Navbar from "@/shared/components/layouts/Navbar";
import SideMenu from "@/shared/components/layouts/SideMenu";
import DashboardRoutes from "@/features/dashboard/routes/DashboardRoutes";
import { UserContext } from "@/shared/context/UserContext";
import { useTheme } from "@/shared/context/ThemeContext";
import { DashboardProvider } from "@/shared/context/DashboardContext";
import { PaiWidgetProvider } from "@/shared/context/PaiWidgetContext";
import PaiFloatingWidget from "@/features/dashboard/pai/ui/PaiFloatingWidget";

// =============================
// Constants
// =============================

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 200;
const NAVBAR_HEIGHT = 73;
const MOBILE_HEADER_HEIGHT = 72;

// =============================
// Component
// =============================

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");
  const { user } = useContext(UserContext);
  const { theme, vfxPreset } = useTheme();
  const location = useLocation();

  // VFX Presets Configuration
  const presets = {
    midnight: {
      layer1: ["from-cyan-500/40 via-cyan-400/30", "from-indigo-500/20 via-blue-600/15", "from-emerald-400/25 via-green-500/15"],
      layer2: ["from-cyan-400/20 via-sky-400/15", "from-orange-500/25 via-orange-600/15"],
      layer3: ["from-blue-600/18 via-indigo-500/12", "from-amber-400/20 via-yellow-400/15"],
      pop: ["from-teal-400/15", "from-blue-700/18 via-blue-500/15"]
    },
    solar: {
      layer1: ["from-orange-500/40 via-amber-400/30", "from-rose-600/20 via-red-600/15", "from-yellow-400/25 via-amber-500/15"],
      layer2: ["from-red-400/20 via-rose-400/15", "from-orange-600/25 via-amber-700/15"],
      layer3: ["from-yellow-500/18 via-orange-500/12", "from-red-500/20 via-rose-500/15"],
      pop: ["from-amber-400/15", "from-orange-700/18 via-red-600/15"]
    },
    forest: {
      layer1: ["from-emerald-500/40 via-teal-400/30", "from-green-600/20 via-lime-600/15", "from-cyan-400/25 via-emerald-500/15"],
      layer2: ["from-lime-400/20 via-green-400/15", "from-teal-600/25 via-emerald-700/15"],
      layer3: ["from-emerald-500/18 via-teal-500/12", "from-cyan-500/20 via-sky-500/15"],
      pop: ["from-green-400/15", "from-emerald-700/18 via-teal-600/15"]
    },
    ocean: {
      layer1: ["from-blue-700/40 via-cyan-600/30", "from-navy-600/20 via-blue-800/15", "from-sky-400/25 via-blue-500/15"],
      layer2: ["from-cyan-500/20 via-sky-500/15", "from-blue-800/25 via-indigo-900/15"],
      layer3: ["from-blue-600/18 via-cyan-600/12", "from-navy-500/20 via-blue-700/15"],
      pop: ["from-sky-400/15", "from-blue-950/18 via-navy-800/15"]
    },
    royal: {
      layer1: ["from-indigo-600/40 via-violet-500/30", "from-blue-600/20 via-indigo-700/15", "from-purple-500/25 via-violet-600/15"],
      layer2: ["from-violet-400/20 via-indigo-400/15", "from-blue-700/25 via-indigo-800/15"],
      layer3: ["from-indigo-500/18 via-violet-500/12", "from-blue-500/20 via-sky-500/15"],
      pop: ["from-violet-400/15", "from-indigo-800/18 via-blue-700/15"]
    }
  };

  const p = presets[vfxPreset] || presets.midnight;

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // No longer auto-collapsing for mobile menu
  useEffect(() => {
    // Desktop only layout
  }, [location.pathname]);

  const isPaiPage = location.pathname.includes('/pai');
  const activeSidebarWidth = isPaiPage ? 0 : (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);

  return (
    <PaiWidgetProvider>
    <DashboardProvider>
    <div className="min-h-screen bg-background-app text-text-primary relative overflow-hidden flex flex-col md:block">

      {/* LIGHT MODE - SOFT MINT & LAVENDER (LOCKED) */}
      {theme === "light" && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-[-15%] left-[-15%] w-[800px] h-[800px] bg-gradient-to-br from-blue-400/18 via-blue-300/12 to-transparent rounded-full blur-[140px] animate-float-slow opacity-100" />
            <div className="absolute top-[-20%] left-[20%] w-[850px] h-[850px] bg-gradient-to-b from-emerald-400/22 via-emerald-300/15 to-transparent rounded-full blur-[150px] animate-float-reverse opacity-95" />
            <div className="absolute top-[-10%] right-[-15%] w-[800px] h-[800px] bg-gradient-to-bl from-violet-400/18 via-indigo-300/10 to-transparent rounded-full blur-[140px] animate-float-delayed opacity-100" />
          </div>
        </div>
      )}

      {/* PREMIUM ANIMATED BACKGROUND VFX - VIBRANT (DARK MODE ONLY) */}
      {theme === "dark" && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Layer 1: Primary Vibrant Orbs - Slow Float */}
          <div className="absolute inset-0">
            <div className={`absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br ${p.layer1[0]} to-transparent rounded-full blur-[140px] animate-float-slow opacity-100`} />
            <div className={`absolute top-[30%] right-[-8%] w-[500px] h-[500px] bg-gradient-to-bl ${p.layer1[1]} to-transparent rounded-full blur-[120px] animate-float-delayed opacity-100`} />
            <div className={`absolute bottom-[-12%] left-[15%] w-[650px] h-[650px] bg-gradient-to-tr ${p.layer1[2]} to-transparent rounded-full blur-[130px] animate-float-reverse opacity-100`} />
          </div>

          {/* Layer 2: Secondary Vibrant Accents - Medium Speed */}
          <div className="absolute inset-0">
            <div className={`absolute top-[10%] right-[25%] w-[350px] h-[350px] bg-gradient-to-br ${p.layer2[0]} to-transparent rounded-full blur-[100px] animate-pulse-slow opacity-90`} />
            <div className={`absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-gradient-to-tl ${p.layer2[1]} to-transparent rounded-full blur-[110px] animate-float-medium opacity-85`} />
          </div>

          {/* Layer 3: Bold Accent Highlights - Fast Subtle */}
          <div className="absolute inset-0">
            <div className={`absolute top-[50%] left-[40%] w-[300px] h-[300px] bg-gradient-to-r ${p.layer3[0]} to-transparent rounded-full blur-[90px] animate-drift opacity-75`} />
            <div className={`absolute bottom-[35%] left-[5%] w-[280px] h-[280px] bg-gradient-to-br ${p.layer3[1]} to-transparent rounded-full blur-[95px] animate-float-fast opacity-80`} />
          </div>

          {/* Layer 4: Vibrant Mesh Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_50%)] opacity-100" />

          {/* Layer 5: Extra Pop - Bright Accents */}
          <div className="absolute inset-0">
            <div className={`absolute top-[60%] right-[30%] w-[250px] h-[250px] bg-gradient-to-br ${p.pop[0]} to-transparent rounded-full blur-[85px] animate-pulse-slow opacity-70`} />
            <div className={`absolute top-[15%] left-[30%] w-[320px] h-[320px] bg-gradient-to-tr ${p.pop[1]} to-transparent rounded-full blur-[105px] animate-float-medium opacity-75`} />
          </div>
        </div>
      )}

      {/* --- DESKTOP LAYOUT COMPONENTS --- */}

      {/* DESKTOP NAVBAR */}
      {!isPaiPage && (
        <div>
          <Navbar onToggleSidebar={() => setCollapsed((p) => !p)} />
        </div>
      )}

      {/* DESKTOP SIDEMENU */}
      {!isPaiPage && (
        <div>
          <SideMenu
            collapsed={collapsed}
            activeMenu={activeMenu}
            topOffset={NAVBAR_HEIGHT + 10}
            user={user}
          />
        </div>
      )}

      <main
        className={`
          min-h-screen relative z-10
          ${isPaiPage ? '!m-0 !p-0 w-full h-screen' : 'pt-[73px] pb-0'}
        `}
        style={isPaiPage ? {} : {
          marginLeft: activeSidebarWidth,
          "--sidebar-width": `${activeSidebarWidth}px`,
          "--navbar-height": `${NAVBAR_HEIGHT}px`,
        }}
      >
        <DashboardRoutes setActiveMenu={setActiveMenu} />
      </main>
      
      <PaiFloatingWidget sidebarCollapsed={collapsed} />
      
    </div>
    </DashboardProvider>
    </PaiWidgetProvider>
  );
};

export default DashboardLayout;
