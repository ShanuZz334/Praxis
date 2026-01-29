import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Navbar from "@/shared/components/layouts/Navbar";
import SideMenu from "@/shared/components/layouts/SideMenu";
import MobileHeader from "@/shared/components/layouts/MobileHeader";
import DashboardRoutes from "@/features/dashboard/routes/DashboardRoutes";
import { UserContext } from "@/shared/context/UserContext";

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 200;
const NAVBAR_HEIGHT = 60;
const MOBILE_HEADER_HEIGHT = 56; // 14 * 4px = 56px

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user } = useContext(UserContext);
  const location = useLocation();

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // Auto-collapse sidebar on route change for desktop
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden flex flex-col md:block transition-colors duration-300">

      {/* GLOBAL BACKGROUND VFX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--vfx-blue)] rounded-full blur-[120px] transition-colors duration-500" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-[var(--vfx-purple)] rounded-full blur-[100px] transition-colors duration-500" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[var(--vfx-emerald)] rounded-full blur-[120px] transition-colors duration-500" />
      </div>

      {/* --- DESKTOP LAYOUT COMPONENTS --- */}

      {/* DESKTOP NAVBAR (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Navbar onToggleSidebar={() => setCollapsed((p) => !p)} />
      </div>

      {/* DESKTOP SIDEMENU (Hidden on Mobile) */}
      <div className="hidden md:block">
        <SideMenu
          collapsed={collapsed}
          activeMenu={activeMenu}
          topOffset={NAVBAR_HEIGHT + 10}
          user={user}
        />
      </div>


      {/* --- MOBILE LAYOUT COMPONENTS --- */}

      {/* MOBILE TOP HEADER (New Requirement) */}
      <MobileHeader onMenuClick={() => setShowMobileMenu(true)} />

      {/* MOBILE MENU DRAWER */}
      <div className={`
        fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden
        ${showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
`} onClick={() => setShowMobileMenu(false)} />

      <div className={`
        fixed inset-y-0 left-0 z-[61] w-[280px] bg-[var(--bg-surface)] md:bg-[var(--bg-card)] backdrop-blur-2xl border-r border-[var(--border-main)] shadow-2xl transform transition-transform duration-300 md:hidden
        ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}
`}>
        <div className="h-full pt-safe-area-top pb-safe-area-bottom">
          {/* Center: Brand (Optional, maybe small logo) */}
          <div className="text-lg font-brand font-bold text-[var(--accent-primary)] tracking-wide p-4">
            Stocky
          </div>
          <SideMenu
            collapsed={false}
            activeMenu={activeMenu}
            topOffset={0}
            user={user}
            isMobileDrawer={true}
          />
        </div>
      </div>


      {/* --- MAIN CONTENT AREA --- */}
      <main
        className="
          min-h-screen transition-all duration-300 ease-in-out relative z-10
          pt-[56px] pb-0 md:pt-[60px] md:pb-0
        "
        style={{
          marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0,
        }}
      >
        <DashboardRoutes setActiveMenu={setActiveMenu} />
      </main>
    </div>
  );
};

export default DashboardLayout;
