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
    <div className="min-h-screen bg-[#02050e] text-white relative overflow-hidden flex flex-col md:block">

      {/* GLOBAL BACKGROUND VFX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 md:bg-blue-600/[0.16] rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 md:bg-purple-600/[0.12] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 md:bg-emerald-600/[0.12] rounded-full blur-[120px]" />
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
        fixed inset-y-0 left-0 z-[61] w-[280px] bg-black/20 backdrop-blur-2xl border-r border-white/5 shadow-2xl transform transition-transform duration-300 md:hidden
        ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}
`}>
        <div className="h-full pt-safe-area-top pb-safe-area-bottom">
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
